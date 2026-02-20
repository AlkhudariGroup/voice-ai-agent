"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { VideoAvatar } from "@/components/VideoAvatar";
import { ConversationBubble } from "@/components/ConversationBubble";
import { InstallPrompt } from "@/components/InstallPrompt";
import { loadMemoryFromStorage, saveMemoryToStorage } from "@/lib/memory-client";
import { getSpeechRecognition, speak, stopSpeaking } from "@/lib/voice";
import type { Memory, Message } from "@/lib/types";

const AVATAR_VIDEO =
  process.env.NEXT_PUBLIC_AVATAR_VIDEO_URL ?? "/avatar-video.mp4";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [memory, setMemory] = useState<Memory>(() => loadMemoryFromStorage());
  const [uploadedImage] = useState<{ url: string; file: File } | null>(null);
  const [logoPattern] = useState<"solid" | "ring" | "glow">("solid");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setTranscript("Speech recognition not supported in this browser.");
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) final += t;
        else interim += t;
      }
      setTranscript((prev) => prev + final + interim);
    };

    rec.onerror = (e: { error: string }) => {
      if (e.error === "no-speech") return;
      setIsListening(false);
      setTranscript((prev) => prev || `Error: ${e.error}`);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    setTranscript("");
    setMessages((m) => m);
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setTranscript("");
    setIsProcessing(true);

    try {
      const body: { message: string; memory: Memory; imageUrl?: string } = {
        message: text,
        memory,
      };
      if (uploadedImage?.url) body.imageUrl = uploadedImage.url;

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
        onEnd: () => setIsSpeaking(false),
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
        onEnd: () => setIsSpeaking(false),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [memory, uploadedImage]);

  const handleAvatarClick = useCallback(() => {
    if (isProcessing) return;
    if (isListening) {
      stopListening();
      if (transcript.trim()) sendToAI(transcript.trim());
    } else {
      startListening();
    }
  }, [isListening, isProcessing, transcript, startListening, stopListening, sendToAI]);

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
        {/* X close button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); window.close?.(); }}
          className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-2xl text-white backdrop-blur"
          aria-label="Close"
        >
          ×
        </button>

        {/* Transcript - bottom area */}
        <div className="mt-auto p-4">
          <p className="mb-2 min-h-[1.5rem] text-center text-base text-white drop-shadow-lg">
            {transcript || (isListening ? "Listening..." : "Tap to speak")}
          </p>
          {isProcessing && (
            <p className="text-center text-sm text-yellow-400">Thinking...</p>
          )}
        </div>

        <div
          ref={scrollRef}
          onClick={(e) => e.stopPropagation()}
          className="scrollbar-hide max-h-48 overflow-y-auto border-t border-white/10 bg-black/30 px-4 py-4 backdrop-blur-sm"
        >
          {messages.map((msg, i) => (
            <ConversationBubble key={i} role={msg.role} content={msg.content} />
          ))}
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
}
