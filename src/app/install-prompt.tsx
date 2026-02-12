"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user previously dismissed
    if (sessionStorage.getItem("install-dismissed")) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("install-dismissed", "1");
    setDeferredPrompt(null);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3 shadow-lg">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-100">Install Mind</p>
        <p className="text-xs text-gray-400">
          Add to your home screen for quick access
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 rounded-lg bg-blue-500/90 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-400/90 active:scale-[0.98]"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-gray-400 hover:text-gray-200"
        aria-label="Dismiss"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
