"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { VideoAvatar } from "@/components/VideoAvatar";
import { ConversationBubble } from "@/components/ConversationBubble";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FileUpload } from "@/components/FileUpload";
import { loadMemoryFromStorage, saveMemoryToStorage } from "@/lib/memory-client";
import { getSpeechRecognition, speak, stopSpeaking } from "@/lib/voice";
import type { Memory, Message } from "@/lib/types";

const LOGO_PATTERNS = ["solid", "ring", "glow"] as const;
const AVATAR_VIDEO =
  process.env.NEXT_PUBLIC_AVATAR_VIDEO_URL ?? "/avatar-video.mp4";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [memory, setMemory] = useState<Memory>(() => loadMemoryFromStorage());
  const [uploadedImage, setUploadedImage] = useState<{ url: string; file: File } | null>(null);
  const [logoPattern, setLogoPattern] = useState<(typeof LOGO_PATTERNS)[number]>("solid");
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
      setUploadedImage(null);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("API error");
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
      const errMsg: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
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

        {/* Upload photo - PWA friendly */}
        <div
          className="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 flex flex-col items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FileUpload onUpload={(url, file) => setUploadedImage({ url, file })} />
          {uploadedImage && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
              className="text-xs text-yellow-400 underline"
            >
              Remove photo
            </button>
          )}
          <p className="text-xs text-white/70">Tap to add photo, then speak</p>
        </div>
        <div
          className="absolute left-4 top-4 z-40 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1">
            {LOGO_PATTERNS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={(e) => { e.stopPropagation(); setLogoPattern(p); }}
                className={`rounded px-2 py-1 text-xs capitalize ${logoPattern === p ? "bg-yellow-500/30 text-yellow-400" : "bg-white/5 text-gray-500"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

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
