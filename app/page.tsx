"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VideoAvatar } from "@/components/VideoAvatar";
import { FileUpload } from "@/components/FileUpload";
import { InstallPrompt } from "@/components/InstallPrompt";
import { loadMemoryFromStorage, saveMemoryToStorage } from "@/lib/memory-client";
import { getSpeechRecognition, speak, stopSpeaking } from "@/lib/voice";
import type { Memory, Message } from "@/lib/types";

const AVATAR_VIDEO =
  process.env.NEXT_PUBLIC_AVATAR_VIDEO_URL ?? "/avatar-video.mp4";

const SILENCE_TIMEOUT_MS = 1800;
const INACTIVITY_PAUSE_MS = 10 * 60 * 1000;

function HomeContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent") ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [memory, setMemory] = useState<Memory>(() => loadMemoryFromStorage());
  const [uploadedImage, setUploadedImage] = useState<{ url: string; file: File } | null>(null);
  const [logoPattern, setLogoPattern] = useState<"solid" | "ring" | "glow">("solid");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const sendToAIRef = useRef<((t: string) => Promise<void>) | null>(null);
  const restartListeningRef = useRef<(() => void) | null>(null);

  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setTranscript("");
    setIsProcessing(true);

    try {
      const body: { message: string; memory: Memory; imageUrl?: string; agentId?: string } = {
        message: text,
        memory,
      };
      if (uploadedImage?.url) body.imageUrl = uploadedImage.url;
      if (agentId) body.agentId = agentId;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const { reply, updatedMemory } = data;

      setMemory(updatedMemory);
      saveMemoryToStorage(updatedMemory);

      const assistantMsg: Message = {
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);

      speak(reply, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          restartListeningRef.current?.();
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error. Check connection and try again.";
      const isNetwork = msg.includes("abort") || msg.includes("fetch") || msg.includes("Network");
      const errMsg: Message = {
        role: "assistant",
        content: isNetwork
          ? "Connection took too long or failed. Please try again."
          : `Sorry: ${msg}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, errMsg]);
      speak(errMsg.content, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          restartListeningRef.current?.();
        },
      });
    } finally {
      setIsProcessing(false);
    }
  }, [memory, uploadedImage, agentId]);

  sendToAIRef.current = sendToAI;

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setTranscript("Speech recognition not supported in this browser.");
      return;
    }
    stopSpeaking();
    setIsSpeaking(false);
    if (recognitionRef.current) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "ar-SA";

    rec.onresult = (e: { results: SpeechRecognitionResultList }) => {
      lastActivityRef.current = Date.now();
      let text = "";
      let hasFinal = false;
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        text += t;
        if (r.isFinal) hasFinal = true;
      }
      setTranscript(text);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (hasFinal && text.trim().length >= 2) {
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          const txt = text.trim();
          if (txt && sendToAIRef.current) {
            stopListening();
            sendToAIRef.current(txt);
          }
        }, SILENCE_TIMEOUT_MS);
      }
    };

    rec.onerror = (e: { error: string }) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setIsListening(false);
      setTranscript((prev) => prev || `Error: ${e.error}`);
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) {
        recognitionRef.current = null;
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
    setTranscript("");
    try {
      rec.start();
      setIsListening(true);
    } catch (err) {
      recognitionRef.current = null;
        setTranscript("اضغط للسماح باستخدام الميكروفون");
    }
  }, [stopListening]);

  restartListeningRef.current = startListening;

  const handleAvatarClick = useCallback(() => {
    if (isProcessing) return;
    lastActivityRef.current = Date.now();
    if (isListening) {
      if (transcript.trim()) {
        stopListening();
        sendToAI(transcript.trim());
        setTimeout(() => startListening(), 100);
      }
    } else {
      startListening();
    }
  }, [isListening, isProcessing, transcript, startListening, stopListening, sendToAI]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (getSpeechRecognition()) startListening();
    }, 600);
    return () => clearTimeout(t);
  }, [startListening]);

  useEffect(() => {
    const checkInactivity = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > INACTIVITY_PAUSE_MS && recognitionRef.current) {
        stopListening();
      }
    };
    const id = setInterval(checkInactivity, 60000);
    return () => clearInterval(id);
  }, [stopListening]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {})
        .catch(() => {});
    }
  }, []);

  return (
    <div className="relative min-h-dvh w-full">
      {/* Fullscreen video background */}
      <VideoAvatar
        src={AVATAR_VIDEO}
        isTalking={isListening || isSpeaking}
        logoPattern={logoPattern}
        isProcessing={isProcessing}
        uploadedPhotoUrl={uploadedImage?.url ?? null}
        onClick={handleAvatarClick}
      />

      {/* Overlay UI - tap anywhere to speak */}
      <div
        className="relative z-20 flex min-h-dvh flex-col cursor-pointer"
        onClick={handleAvatarClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleAvatarClick()}
        aria-label="Tap to speak"
      >
        {/* Logo pattern: Solid, Ring, Glow */}
        <div className="absolute left-4 top-4 z-40 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {(["solid", "ring", "glow"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setLogoPattern(p)}
                className={`rounded px-2 py-1 text-xs capitalize ${logoPattern === p ? "bg-yellow-500/30 text-yellow-400" : "bg-white/5 text-gray-500"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {/* X close button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); window.close?.(); }}
          className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur"
          aria-label="Close"
        >
          ×
        </button>

        {/* Voice only - no text on screen. Hidden status for accessibility */}
        <div className="mt-auto p-4">
          <div className="mb-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
            <FileUpload onUpload={(url, file) => setUploadedImage({ url, file })} />
          </div>
          <div className="flex items-center justify-center gap-2 min-h-[2rem]">
            <span
              className={`h-3 w-3 rounded-full transition ${isListening ? "animate-pulse bg-green-500" : isProcessing ? "bg-yellow-500" : "bg-white/30"}`}
              aria-hidden
            />
          </div>
          <p className="sr-only" aria-live="polite">
            {transcript || (isListening ? "جاري الاستماع" : "اضغط للتحدث")}
          </p>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a]" />}>
      <HomeContent />
    </Suspense>
  );
}
