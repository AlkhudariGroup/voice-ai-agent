"use client";

import { useEffect, useRef, useState } from "react";

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
    video.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]">
      {!videoError && (
        <>
          <video
            ref={videoRef}
            src={src}
            loop
            muted
            playsInline
            autoPlay
            onError={() => setVideoError(true)}
            className="fixed inset-0 h-full w-full object-cover"
          />
          {/* Dimmer - dark when AI not talking, bright when talking */}
          <div
            className={`fixed inset-0 bg-black pointer-events-none transition-opacity duration-500 ${
              isTalking ? "opacity-0" : "opacity-50"
            }`}
            aria-hidden
          />
        </>
      )}
      {videoError && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
          <button
            type="button"
            onClick={onClick}
            className="focus:outline-none focus:ring-4 focus:ring-yellow-500/30 rounded-full"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="h-40 w-40 object-contain"
            />
          </button>
        </div>
      )}
    </div>
  );
}
