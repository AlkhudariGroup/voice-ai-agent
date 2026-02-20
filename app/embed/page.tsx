"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VideoAvatar } from "@/components/VideoAvatar";
import { VoiceConsentModal, getUserId, hasVoiceConsent } from "@/components/VoiceConsentModal";
import { VoiceRecorder } from "@/lib/voice-recorder";
import { loadMemoryFromStorage, saveMemoryToStorage } from "@/lib/memory-client";
import { getSpeechRecognition, speak, stopSpeaking } from "@/lib/voice";
import type { Memory, Message } from "@/lib/types";

const AVATAR_VIDEO =
  process.env.NEXT_PUBLIC_AVATAR_VIDEO_URL ?? "/avatar-video.mp4";

function EmbedContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent") ?? "";
  const siteName = searchParams.get("site") ?? "Store";
  const siteDesc = searchParams.get("desc") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [memory, setMemory] = useState<Memory>(() => loadMemoryFromStorage());
  const [voiceOptions, setVoiceOptions] = useState<{ speed?: number; primaryLanguage?: "ar" | "en" | "auto" }>({});
  const [voiceRecordingEnabled, setVoiceRecordingEnabled] = useState(false);
  const [voiceUploadToken, setVoiceUploadToken] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [logoPattern] = useState<"solid" | "ring" | "glow">("solid");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const pendingUploadRef = useRef<{ transcript: string; aiResponse: string } | null>(null);

  useEffect(() => {
    if (!agentId) return;
    fetch(`/api/agent/settings?agentId=${encodeURIComponent(agentId)}`)
      .then((r) => r.json())
      .then((d) => {
        const vs = d.voiceSettings;
        if (vs) setVoiceOptions({ speed: vs.speed, primaryLanguage: vs.primaryLanguage });
        setVoiceRecordingEnabled(!!d.voiceRecordingEnabled);
        if (d.voiceUploadToken) setVoiceUploadToken(d.voiceUploadToken);
      })
      .catch(() => {});
  }, [agentId]);
  const uploadRecording = useCallback(
    async (blob: Blob, transcript: string, aiResponse: string) => {
      if (!agentId || !voiceUploadToken) return;
      const fd = new FormData();
      fd.append("audio", blob);
      fd.append("store_id", agentId);
      fd.append("user_id", getUserId());
      fd.append("transcript", transcript);
      fd.append("ai_response", aiResponse);
      fd.append("consent_given", "true");
      try {
        await fetch("/api/voice/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${voiceUploadToken}` },
          body: fd,
        });
      } catch {}
    },
    [agentId, voiceUploadToken]
  );

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setTranscript("Speech recognition not supported.");
      return;
    }
    stopSpeaking();
    setIsSpeaking(false);
    if (voiceRecordingEnabled && hasVoiceConsent(agentId)) {
      recorderRef.current = new VoiceRecorder({
        onStop: (blob) => {
          const p = pendingUploadRef.current;
          if (p) uploadRecording(blob, p.transcript, p.aiResponse);
          pendingUploadRef.current = null;
        },
      });
      recorderRef.current.start();
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) final += t;
      }
      setTranscript((prev) => prev + final);
    };
    rec.onerror = (e: { error: string }) => {
      if (e.error !== "no-speech") setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    setTranscript("");
    rec.start();
    setIsListening(true);
  }, [agentId, voiceRecordingEnabled, uploadRecording]);

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          memory,
          agentId: agentId || undefined,
          siteContext: { siteName, siteDesc },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(res.status === 429 ? (data.error ?? "Usage limit reached") : "API error");
      }
      setMemory(data.updatedMemory);
      saveMemoryToStorage(data.updatedMemory);
      const assistantMsg: Message = { role: "assistant", content: data.reply, timestamp: new Date().toISOString() };
      setMessages((m) => [...m, assistantMsg]);
      if (voiceRecordingEnabled && hasVoiceConsent(agentId)) {
        pendingUploadRef.current = { transcript: text, aiResponse: data.reply };
      }
      speak(
        data.reply,
        {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            if (recorderRef.current?.isRecording()) {
              recorderRef.current.stop();
            }
          },
        },
        voiceOptions
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sorry, please try again.";
      setMessages((m) => [...m, { role: "assistant", content: msg, timestamp: new Date().toISOString() }]);
    } finally {
      setIsProcessing(false);
    }
  }, [memory, siteName, siteDesc, agentId, voiceOptions, voiceRecordingEnabled]);

  const handleClick = useCallback(() => {
    if (isProcessing) return;
    if (voiceRecordingEnabled && agentId && !hasVoiceConsent(agentId)) {
      setShowConsent(true);
      return;
    }
    if (isListening) {
      stopListening();
      if (transcript.trim()) sendToAI(transcript.trim());
    } else startListening();
  }, [isListening, isProcessing, transcript, voiceRecordingEnabled, agentId, startListening, stopListening, sendToAI]);

  return (
    <div className="relative min-h-dvh w-full">
      {showConsent && (
        <VoiceConsentModal
          agentId={agentId}
          onAccept={() => {
            setShowConsent(false);
            startListening();
          }}
          onDecline={() => setShowConsent(false)}
        />
      )}
      <VideoAvatar src={AVATAR_VIDEO} isTalking={isListening || isSpeaking} logoPattern={logoPattern} isProcessing={isProcessing} onClick={handleClick} />
      <div className="relative z-20 flex min-h-dvh flex-col cursor-pointer" onClick={handleClick}>
        <div className="mt-auto p-4">
          <div className="flex items-center justify-center gap-2 min-h-[2rem]">
            <span
              className={`h-3 w-3 rounded-full transition ${isListening ? "animate-pulse bg-green-500" : isProcessing ? "bg-yellow-500" : "bg-white/30"}`}
              aria-hidden
            />
          </div>
          <p className="sr-only" aria-live="polite">
            {transcript || (isListening ? "Listening" : "Tap to speak")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <EmbedContent />
    </Suspense>
  );
}
