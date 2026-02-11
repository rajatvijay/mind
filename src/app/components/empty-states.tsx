"use client";

// ── First-time empty state (zero articles ever) ─────────────────────

export function FirstTimeEmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      {/* Bookmark illustration */}
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
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>

      <h2 className="mb-2 text-lg font-medium text-gray-200">
        Your reading list starts here
      </h2>
      <p className="mb-8 max-w-sm text-sm text-gray-400">
        Save articles from anywhere and read them when you have time.
        No distractions, no algorithms.
      </p>

      <div className="grid w-full max-w-md gap-3">
        <OnboardingCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.006" />
            </svg>
          }
          title="Paste a URL"
          description="Drop any link in the box above"
        />
        <OnboardingCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          }
          title="Share from your phone"
          description="Use the Share menu in Safari or Chrome"
        />
        <OnboardingCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          }
          title="Connect via API"
          description="Set up an iOS Shortcut for one-tap saving"
        />
      </div>
    </div>
  );
}

function OnboardingCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3 text-left">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-200">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}

// ── All caught up state ─────────────────────────────────────────────

export function AllCaughtUpState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <svg
        className="mb-4 h-10 w-10 text-green-500/60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h2 className="mb-1 text-base font-medium text-gray-200">
        All caught up
      </h2>
      <p className="text-sm text-gray-400">
        Nothing unread. Enjoy the quiet.
      </p>
    </div>
  );
}

// ── No search results state ─────────────────────────────────────────

export function NoResultsState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <svg
        className="mb-4 h-10 w-10 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <p className="mb-2 text-sm text-gray-400">
        No articles matching &ldquo;{query}&rdquo;
      </p>
      <button
        onClick={onClear}
        className="text-sm text-blue-400 hover:underline"
      >
        Clear search
      </button>
    </div>
  );
}

// ── No read articles state ──────────────────────────────────────────

export function NoReadState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <svg
        className="mb-4 h-10 w-10 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
      <p className="text-sm text-gray-400">
        No read articles yet. Start reading!
      </p>
    </div>
  );
}
