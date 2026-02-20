"use client";

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
  callbacks?: { onStart?: () => void; onEnd?: () => void }
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  u.volume = 1;
  u.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find((v) => v.lang.startsWith("en"));
  if (en) u.voice = en;
  u.onstart = () => callbacks?.onStart?.();
  u.onend = () => callbacks?.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
