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

    if (isTalking) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isTalking]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]">
      {!videoError && (
        <video
          ref={videoRef}
          src={src}
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="fixed inset-0 h-full w-full object-cover"
        />
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
