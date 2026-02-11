"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <svg
        className="mb-6 h-16 w-16 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414"
        />
      </svg>
      <h1 className="mb-2 text-xl font-semibold text-gray-200">
        You&apos;re offline
      </h1>
      <p className="mb-6 max-w-xs text-sm text-gray-400">
        Check your connection and try again. Your saved articles will be here
        when you&apos;re back.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-blue-500/90 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-400/90 active:scale-[0.98]"
      >
        Try again
      </button>
    </main>
  );
}
