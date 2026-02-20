"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceAvatar } from "./VoiceAvatar";

interface VideoAvatarProps {
  src: string;
  isTalking: boolean;
  logoPattern: "solid" | "ring" | "glow";
  isProcessing: boolean;
  uploadedPhotoUrl?: string | null;
  onClick: () => void;
}

export function VideoAvatar({
  src,
  isTalking,
  logoPattern,
  isProcessing,
  uploadedPhotoUrl,
  onClick,
}: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isTalking) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isTalking]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
      {!videoError && (
        <div className="relative aspect-square h-[min(100vw,100dvh)] w-[min(100vw,100dvh)] max-h-[min(100vw,100dvh)] max-w-[min(100vw,100dvh)] shrink-0 overflow-hidden">
          <video
            ref={videoRef}
            src={src}
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Uploaded photo - square overlay in center */}
          {uploadedPhotoUrl && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg border-4 border-yellow-500/50 bg-black/40 p-2">
              <img
                src={uploadedPhotoUrl}
                alt="Your photo"
                className="h-full w-full object-contain"
              />
            </div>
          )}
          {/* Logo - center, hide when photo shown */}
          {!uploadedPhotoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className={`text-8xl font-bold text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-[logo-float_4s_ease-in-out_infinite] ${
                logoPattern === "ring" ? "ring-4 ring-yellow-500 rounded-full p-4" : ""
              } ${logoPattern === "glow" ? "drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]" : ""}`}
            >
              e
            </span>
          </div>
          )}
        </div>
      )}
      {videoError && (
        <div className="flex items-center justify-center">
          <VoiceAvatar
            logoPattern={logoPattern}
            isListening={isTalking}
            isProcessing={isProcessing}
            onClick={onClick}
          />
        </div>
      )}
    </div>
  );
}
