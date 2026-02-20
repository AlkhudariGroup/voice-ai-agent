"use client";

export interface VoiceOptions {
  speed?: number;
  primaryLanguage?: "ar" | "en" | "auto";
}

export function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speak(
  text: string,
  callbacks?: { onStart?: () => void; onEnd?: () => void },
  options?: VoiceOptions
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = Math.max(0.5, Math.min(2, options?.speed ?? 1));
  u.pitch = 1;
  u.volume = 1;
  const langOverride = options?.primaryLanguage;
  const isArabic =
    langOverride === "ar" || (langOverride !== "en" && /[\u0600-\u06FF]/.test(text));
  u.lang = isArabic ? "ar-SA" : "en-US";
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith(isArabic ? "ar" : "en") && /male|daniel|alex|david|fred|ralph|mark|paul|george|nick|مجل|عربي/i.test(v.name)
  );
  const fallback = voices.find((v) => v.lang.startsWith(isArabic ? "ar" : "en"));
  const voice = preferred ?? fallback;
  if (voice) u.voice = voice;
  u.onstart = () => callbacks?.onStart?.();
  u.onend = () => callbacks?.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
