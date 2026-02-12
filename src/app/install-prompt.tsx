"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptType = "android" | "ios" | null;

function useInstallPrompt() {
  const [promptType, setPromptType] = useState<PromptType>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed as PWA
    const isStandalone =
      (navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // User previously dismissed
    if (localStorage.getItem("install-dismissed")) return;

    // Detect iOS Safari
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIOS) {
      setPromptType("ios");
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPromptType("android");
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return { promptType, deferredPrompt };
}

// Safari share icon (square with arrow up)
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M12 2.25v12m0-12 3 3m-3-3-3 3"
      />
    </svg>
  );
}

export function InstallPrompt() {
  const { promptType, deferredPrompt } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!promptType || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("install-dismissed", "1");
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3 shadow-lg">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-100">Install Mind</p>
        {promptType === "ios" ? (
          <p className="text-xs text-gray-400">
            Tap <ShareIcon className="inline h-4 w-4 align-text-bottom text-blue-400" /> then &quot;Add to Home Screen&quot;
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            Add to your home screen for quick access
          </p>
        )}
      </div>
      {promptType === "android" && (
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-blue-500/90 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-400/90 active:scale-[0.98]"
        >
          Install
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-gray-400 hover:text-gray-200"
        aria-label="Dismiss"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
