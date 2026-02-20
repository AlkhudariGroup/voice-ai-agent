"use client";

interface VoiceAvatarProps {
  logoPattern: "solid" | "ring" | "glow";
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

export function VoiceAvatar({
  logoPattern,
  isListening,
  isProcessing,
  onClick,
}: VoiceAvatarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isProcessing}
      className="focus:outline-none focus:ring-4 focus:ring-yellow-500/30 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
    >
      <div
        className={`relative flex h-40 w-40 items-center justify-center rounded-full transition ${
          isProcessing ? "opacity-70" : ""
        }`}
      >
        {/* E logo - yellow on dark black - pattern variants */}
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-[#0a0a0a] ${
            logoPattern === "ring"
              ? "ring-4 ring-yellow-500"
              : logoPattern === "glow"
                ? "shadow-[0_0_40px_rgba(234,179,8,0.4)]"
                : ""
          }`}
        >
          <span className="flex h-full w-full items-center justify-center text-7xl font-bold leading-none text-yellow-500">e</span>
        </div>
        {/* Voice animation - waves when listening/speaking */}
        {(isListening || isProcessing) && (
          <>
            <span className="absolute inset-0 animate-[voice-pulse_1.5s_ease-in-out_infinite] rounded-full bg-yellow-500/15" />
            <span className="absolute -inset-2 animate-[voice-ring_2s_ease-out_infinite] rounded-full border-2 border-yellow-500/40" />
            <span className="absolute -inset-4 animate-[voice-ring_2s_ease-out_infinite] rounded-full border-2 border-yellow-500/20" style={{ animationDelay: "0.3s" }} />
            {/* Voice bars */}
            <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-2 w-1 rounded-full bg-yellow-500 animate-[voice-wave_0.6s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </button>
  );
}
