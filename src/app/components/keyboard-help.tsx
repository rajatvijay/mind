"use client";

import { useEffect, useRef } from "react";

const shortcuts = [
  { key: "/", action: "Focus search" },
  { key: "n", action: "Focus URL input" },
  { key: "j", action: "Next article" },
  { key: "k", action: "Previous article" },
  { key: "o", action: "Open article" },
  { key: "e", action: "Toggle read/unread" },
  { key: "⌫", action: "Delete article" },
  { key: "Esc", action: "Clear / close" },
  { key: "?", action: "This help" },
];

export function KeyboardHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto h-fit w-full max-w-sm rounded-xl border border-border-default bg-surface-4 p-0 text-gray-100 shadow-2xl backdrop:bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{action}</span>
              <kbd className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-gray-300">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
