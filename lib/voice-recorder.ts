"use client";

const MIME = "audio/webm; codecs=opus";

export interface VoiceRecorderCallbacks {
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onError?: (err: string) => void;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private callbacks: VoiceRecorderCallbacks = {};

  constructor(callbacks?: VoiceRecorderCallbacks) {
    if (callbacks) this.callbacks = callbacks;
  }

  async start(): Promise<boolean> {
    if (this.mediaRecorder?.state === "recording") return false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = { mimeType: MIME, audioBitsPerSecond: 48000 };
      if (!MediaRecorder.isTypeSupported(MIME)) {
        delete options.mimeType;
      }
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        if (this.chunks.length > 0) {
          const blob = new Blob(this.chunks, { type: MIME || "audio/webm" });
          this.callbacks.onStop?.(blob);
        }
        this.stream?.getTracks().forEach((t) => t.stop());
      };
      this.mediaRecorder.start(100);
      this.callbacks.onStart?.();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.callbacks.onError?.(msg);
      return false;
    }
  }

  stop(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }
}
