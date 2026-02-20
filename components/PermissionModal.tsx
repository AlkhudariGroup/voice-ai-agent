"use client";

import { useState } from "react";

interface PermissionModalProps {
  onComplete: (granted: boolean) => void;
  avatarSrc: string;
}

export function PermissionModal({ onComplete, avatarSrc }: PermissionModalProps) {
  const [micStatus, setMicStatus] = useState<"pending" | "granted" | "denied">("pending");

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
    } catch {
      setMicStatus("denied");
    }
  };

  const handleContinue = () => {
    if (micStatus === "granted") {
      onComplete(true);
    } else if (micStatus === "denied") {
      onComplete(false);
    } else {
      requestMic();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="relative mx-4 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <img
            src={avatarSrc}
            alt="AI Avatar"
            className="h-32 w-32 rounded-full object-cover"
          />
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-white">
          Welcome to Voice AI
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          Grant microphone access to talk. File upload is optional and requested when needed.
        </p>
        {micStatus === "granted" && (
          <p className="mb-4 text-center text-sm text-green-400">Microphone ready ✓</p>
        )}
        {micStatus === "denied" && (
          <p className="mb-4 text-center text-sm text-red-400">Microphone access denied</p>
        )}
        <button
          onClick={handleContinue}
          className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {micStatus === "pending" ? "Allow Microphone" : "Continue"}
        </button>
      </div>
    </div>
  );
}
