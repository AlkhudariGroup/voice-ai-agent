"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowPrompt(false);
  };

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-white/10 bg-black/80 p-4 backdrop-blur">
      <p className="mb-2 text-sm text-white">Install Voice AI for the best experience</p>
      <div className="flex gap-2">
        <button
          onClick={install}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="rounded-lg bg-white/10 py-2 px-3 text-sm text-gray-300"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
