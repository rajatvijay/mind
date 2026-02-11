"use client";

import {
  useOptimistic,
  startTransition,
  useActionState,
  useRef,
  useEffect,
  useMemo,
  useState,
  memo,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Article } from "@/db/schema";
import {
  addArticle,
  toggleRead,
  deleteArticle,
  type ActionState,
} from "@/app/actions";

// ── Types ────────────────────────────────────────────────────────────

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string };

type Tab = "all" | "unread" | "read";

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

function AddArticleForm() {
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
}: {
  article: Article;
  onToggleRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const hostname = article.domain || new URL(article.url).hostname.replace("www.", "");
  const [imgError, setImgError] = useState(false);

  return (
    <li className="group flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-2 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:bg-surface-3 hover:border-border-default">
      {/* OG Image thumbnail */}
      {article.ogImage && !imgError && (
        <img
          src={article.ogImage}
          alt=""
          onError={() => setImgError(true)}
          className="h-16 w-16 shrink-0 rounded-lg object-cover bg-surface-3"
        />
      )}

      <div className="min-w-0 flex-1">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium text-gray-100 hover:text-blue-400 line-clamp-2"
        >
          {article.title || article.url}
        </a>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
          {article.favicon && (
            <img
              src={article.favicon}
              alt=""
              className="h-3.5 w-3.5 rounded-sm"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <span>{hostname}</span>
        </div>
        {article.description && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">
            {article.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onToggleRead(article.id, !article.read)}
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
          onClick={() => onDelete(article.id)}
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
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

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

  // Filter + search
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

    return result;
  }, [optimisticArticles, tab, debouncedSearch]);

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

    // Show undo toast — actual delete happens after toast expires
    toast("Article deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          // Cancel the pending delete
          const timer = pendingDeletes.current.get(id);
          if (timer) {
            clearTimeout(timer);
            pendingDeletes.current.delete(id);
          }
          // Revalidate to restore the article from server state
          window.location.reload();
        },
      },
      duration: 5000,
      onAutoClose: () => {
        // Actually delete on server when toast expires
        pendingDeletes.current.delete(id);
        deleteArticle(id);
      },
      onDismiss: () => {
        pendingDeletes.current.delete(id);
        deleteArticle(id);
      },
    });

    // Track the pending delete
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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: optimisticArticles.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: readCount },
  ];

  return (
    <>
      <AddArticleForm />

      {/* Search */}
      {optimisticArticles.length > 0 && (
        <div className="mb-4">
          <div className="relative">
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
              type="search"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-1 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-400 focus-visible:border-blue-500 focus-visible:outline-none"
              aria-label="Search articles"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-200"
              >
                <svg
                  className="h-4 w-4"
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
            )}
          </div>
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
          {filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : optimisticArticles.length === 0 ? (
        <p className="py-12 text-center text-gray-400">
          No articles yet. Paste a URL above or share from your phone.
        </p>
      ) : debouncedSearch ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No articles matching &ldquo;{debouncedSearch}&rdquo;.{" "}
          <button
            onClick={() => setSearch("")}
            className="text-blue-400 hover:underline"
          >
            Clear search
          </button>
        </p>
      ) : tab === "unread" ? (
        <p className="py-8 text-center text-sm text-gray-400">
          All caught up. Nothing unread.
        </p>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          No read articles yet.
        </p>
      )}
    </>
  );
}
