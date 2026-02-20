"use client";

const CONSENT_KEY = "ecommerco_voice_consent";
const USER_ID_KEY = "ecommerco_user_id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function hasVoiceConsent(agentId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(`${CONSENT_KEY}_${agentId}`);
    return stored === "accepted";
  } catch {
    return false;
  }
}

export function setVoiceConsent(agentId: string, accepted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CONSENT_KEY}_${agentId}`, accepted ? "accepted" : "declined");
  } catch {}
}

interface VoiceConsentModalProps {
  agentId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function VoiceConsentModal({ agentId, onAccept, onDecline }: VoiceConsentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-md rounded-xl border border-white/10 bg-[#0a0a0f] p-6 backdrop-blur">
        <p className="mb-6 text-center text-white">
          This conversation may be recorded for service improvement.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setVoiceConsent(agentId, true);
              onAccept();
            }}
            className="flex-1 rounded-lg bg-yellow-500 py-3 font-semibold text-black hover:bg-yellow-400"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => {
              setVoiceConsent(agentId, false);
              onDecline();
            }}
            className="flex-1 rounded-lg border border-white/20 py-3 text-gray-300 hover:bg-white/10"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
