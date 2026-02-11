"use client";

import {
  useOptimistic,
  startTransition,
  useActionState,
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
  memo,
} from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Article } from "@/db/schema";
import {
  addArticle,
  toggleRead,
  deleteArticle,
  type ActionState,
} from "@/app/actions";
import { KeyboardHelp } from "./keyboard-help";
import { Swipeable } from "./swipeable";
import { FirstTimeEmptyState, AllCaughtUpState, NoResultsState, NoReadState } from "./empty-states";
import { RelativeTime } from "./relative-time";

// ── Types ────────────────────────────────────────────────────────────

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string };

type Tab = "all" | "unread" | "read";
type Sort = "newest" | "oldest" | "domain";

// ── Submit Button (uses useFormStatus) ───────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-500/90 px-4 py-2 text-sm font-medium transition-all hover:bg-blue-400/90 active:scale-[0.98] disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

// ── Add Article Form ─────────────────────────────────────────────────

function AddArticleForm({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const initialState: ActionState = { message: "", status: "idle" };
  const [state, formAction] = useActionState(addArticle, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const prevState = useRef(state);

  useEffect(() => {
    if (state && state !== prevState.current && state.status !== "idle") {
      if (state.status === "success") {
        toast.success(state.message);
        formRef.current?.reset();
      } else if (state.status === "error") {
        toast.error(state.message);
      }
      prevState.current = state;
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mb-8 flex gap-2">
      <input
        ref={inputRef}
        type="url"
        name="url"
        placeholder="Paste a URL..."
        required
        className="flex-1 rounded-lg border border-border-subtle bg-surface-1 px-4 py-2 text-sm text-gray-100 placeholder-gray-400 focus-visible:border-blue-500 focus-visible:outline-none"
      />
      <SubmitButton />
    </form>
  );
}

// ── Article Card ─────────────────────────────────────────────────────

const ArticleCard = memo(function ArticleCard({
  article,
  onToggleRead,
  onDelete,
  focused,
}: {
  article: Article;
  onToggleRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
  focused: boolean;
}) {
  const hostname = article.domain || new URL(article.url).hostname.replace("www.", "");
  const [imgError, setImgError] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (focused) {
      liRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [focused]);

  return (
    <li
      ref={liRef}
      tabIndex={0}
      className={`group relative flex items-start gap-3 rounded-xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all cursor-pointer ${
        focused
          ? "border-blue-500/50 bg-surface-3"
          : "border-border-subtle bg-surface-2 hover:bg-surface-3 hover:border-border-default"
      }`}
    >
      {/* Stretched link — makes the entire card clickable */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-0"
        aria-label={article.title || article.url}
      />

      {/* OG Image thumbnail */}
      {article.ogImage && !imgError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.ogImage}
          alt=""
          onError={() => setImgError(true)}
          className="relative z-0 h-16 w-16 shrink-0 rounded-lg object-cover bg-surface-3"
        />
      )}

      <div className="relative z-0 min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-100 group-hover:text-blue-400 line-clamp-2">
          {article.title || article.url}
        </span>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
          {article.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.favicon}
              alt=""
              className="h-3.5 w-3.5 rounded-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span>{hostname}</span>
          {article.createdAt && (
            <>
              <span className="text-gray-500">&middot;</span>
              <span className="text-gray-500">
                <RelativeTime date={article.createdAt} />
              </span>
            </>
          )}
        </div>
        {article.description && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">
            {article.description}
          </p>
        )}
      </div>

      {/* Action buttons — elevated above the stretched link */}
      <div className="relative z-10 flex shrink-0 gap-1">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleRead(article.id, !article.read); }}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-surface-3 hover:text-white"
          aria-label={article.read ? "Mark as unread" : "Mark as read"}
        >
          {article.read ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19V5a2 2 0 012-2h14a2 2 0 012 2v14l-9-4-9 4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(article.id); }}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-surface-3 hover:text-red-400"
          aria-label="Delete article"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  );
});

// ── Main Feed Component ──────────────────────────────────────────────

export function ArticleFeed({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL params
  const [tab, setTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "all"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<Sort>(
    (searchParams.get("sort") as Sort) || "newest"
  );
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);

  const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const searchRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (sort !== "newest") params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [tab, debouncedSearch, sort, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  // Optimistic state
  const [optimisticArticles, dispatch] = useOptimistic(
    articles,
    (current: Article[], action: OptimisticAction) => {
      switch (action.type) {
        case "toggle":
          return current.map((a) =>
            a.id === action.id ? { ...a, read: !a.read } : a
          );
        case "delete":
          return current.filter((a) => a.id !== action.id);
      }
    }
  );

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = optimisticArticles;

    if (tab === "unread") result = result.filter((a) => !a.read);
    if (tab === "read") result = result.filter((a) => a.read);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.url.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === "oldest") {
      result = [...result].sort(
        (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
      );
    } else if (sort === "domain") {
      result = [...result].sort((a, b) => {
        const domainA = a.domain || new URL(a.url).hostname;
        const domainB = b.domain || new URL(b.url).hostname;
        const cmp = domainA.localeCompare(domainB);
        if (cmp !== 0) return cmp;
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      });
    }
    // "newest" is already the default order from the server

    return result;
  }, [optimisticArticles, tab, debouncedSearch, sort]);

  const unreadCount = optimisticArticles.filter((a) => !a.read).length;
  const readCount = optimisticArticles.filter((a) => a.read).length;

  function handleToggleRead(id: string, read: boolean) {
    startTransition(async () => {
      dispatch({ type: "toggle", id });
      await toggleRead(id, read);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => {
      dispatch({ type: "delete", id });
    });

    toast("Article deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          const timer = pendingDeletes.current.get(id);
          if (timer) {
            clearTimeout(timer);
            pendingDeletes.current.delete(id);
          }
          window.location.reload();
        },
      },
      duration: 5000,
      onAutoClose: () => {
        pendingDeletes.current.delete(id);
        deleteArticle(id);
      },
      onDismiss: () => {
        pendingDeletes.current.delete(id);
        deleteArticle(id);
      },
    });

    const timer = setTimeout(() => {
      pendingDeletes.current.delete(id);
    }, 6000);
    pendingDeletes.current.set(id, timer);
  }

  // Cleanup pending deletes on unmount
  useEffect(() => {
    const deletes = pendingDeletes.current;
    return () => {
      deletes.forEach((timer, id) => {
        clearTimeout(timer);
        deleteArticle(id);
      });
    };
  }, []);

  // Reset focus when filtered list changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [tab, debouncedSearch, sort]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape always works
      if (e.key === "Escape") {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (isTyping) {
          (target as HTMLInputElement).blur();
          return;
        }
        if (search) {
          setSearch("");
          return;
        }
        setFocusedIndex(-1);
        return;
      }

      if (isTyping) return;

      switch (e.key) {
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "n":
          e.preventDefault();
          urlInputRef.current?.focus();
          break;
        case "j":
          e.preventDefault();
          setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "k":
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case "o":
        case "Enter":
          if (focusedIndex >= 0 && focusedIndex < filtered.length) {
            e.preventDefault();
            window.open(filtered[focusedIndex].url, "_blank");
          }
          break;
        case "e":
          if (focusedIndex >= 0 && focusedIndex < filtered.length) {
            const article = filtered[focusedIndex];
            handleToggleRead(article.id, !article.read);
          }
          break;
        case "Backspace":
        case "#":
          if (focusedIndex >= 0 && focusedIndex < filtered.length) {
            e.preventDefault();
            const article = filtered[focusedIndex];
            handleDelete(article.id);
            // Move focus to next article (or previous if last)
            setFocusedIndex((i) =>
              i >= filtered.length - 1 ? Math.max(0, i - 1) : i
            );
          }
          break;
        case "?":
          e.preventDefault();
          setShowHelp((s) => !s);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, focusedIndex, search, showHelp]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: optimisticArticles.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: readCount },
  ];

  const sortOptions: { key: Sort; label: string }[] = [
    { key: "newest", label: "Newest" },
    { key: "oldest", label: "Oldest" },
    { key: "domain", label: "By site" },
  ];

  return (
    <>
      <AddArticleForm inputRef={urlInputRef} />

      {/* Search + Sort row */}
      {optimisticArticles.length > 0 && (
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search articles... ( / )"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-1 py-2 pl-10 pr-8 text-sm text-gray-100 placeholder-gray-400 focus-visible:border-blue-500 focus-visible:outline-none"
              aria-label="Search articles"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-gray-300 focus-visible:border-blue-500 focus-visible:outline-none"
            aria-label="Sort articles"
          >
            {sortOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter tabs */}
      {optimisticArticles.length > 0 && (
        <div
          className="mb-6 flex gap-1 rounded-lg bg-surface-1 p-1"
          role="tablist"
          aria-label="Filter articles"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key
                  ? "bg-surface-3 text-gray-100"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {t.label}
              {t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Article list */}
      {filtered.length > 0 ? (
        <ul className="space-y-2" role="feed" aria-label="Articles">
          {filtered.map((article, i) => (
            <Swipeable
              key={article.id}
              onSwipeLeft={() => handleDelete(article.id)}
              onSwipeRight={() => handleToggleRead(article.id, !article.read)}
              rightLabel={article.read ? "Unread" : "Read"}
            >
              <ArticleCard
                article={article}
                onToggleRead={handleToggleRead}
                onDelete={handleDelete}
                focused={i === focusedIndex}
              />
            </Swipeable>
          ))}
        </ul>
      ) : optimisticArticles.length === 0 ? (
        <FirstTimeEmptyState />
      ) : debouncedSearch ? (
        <NoResultsState query={debouncedSearch} onClear={() => setSearch("")} />
      ) : tab === "unread" ? (
        <AllCaughtUpState />
      ) : tab === "read" ? (
        <NoReadState />
      ) : null}

      {/* Keyboard shortcut hint */}
      {optimisticArticles.length > 0 && (
        <p className="mt-6 text-center text-xs text-gray-500">
          Press <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">?</kbd> for keyboard shortcuts
        </p>
      )}

      <KeyboardHelp open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
