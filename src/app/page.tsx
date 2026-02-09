import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { addArticle, toggleRead, deleteArticle } from "./actions";
import { SignOutButton, GenerateTokenSection } from "./client";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const items = await db
    .select()
    .from(articles)
    .where(eq(articles.userId, session.user.id))
    .orderBy(desc(articles.createdAt));

  const unread = items.filter((a) => !a.read);
  const read = items.filter((a) => a.read);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-gray-950 px-4 py-8 text-white">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mind</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Add article form */}
      <form action={addArticle} className="mb-8 flex gap-2">
        <input
          type="url"
          name="url"
          placeholder="Paste a URL..."
          required
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-500"
        >
          Save
        </button>
      </form>

      {/* Unread articles */}
      {unread.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
            Unread ({unread.length})
          </h2>
          <ul className="space-y-2">
            {unread.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </ul>
        </section>
      )}

      {/* Read articles */}
      {read.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
            Read ({read.length})
          </h2>
          <ul className="space-y-2">
            {read.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 && (
        <p className="text-center text-gray-500">
          No articles yet. Paste a URL above or share from your phone.
        </p>
      )}

      {/* Settings */}
      <hr className="my-8 border-gray-800" />
      <GenerateTokenSection />
    </div>
  );
}

function ArticleRow({
  article,
}: {
  article: {
    id: string;
    url: string;
    title: string;
    read: boolean | null;
    createdAt: Date | null;
  };
}) {
  const hostname = new URL(article.url).hostname.replace("www.", "");

  return (
    <li className="group flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3">
      <div className="min-w-0 flex-1">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-sm font-medium text-white hover:text-blue-400"
        >
          {article.title || article.url}
        </a>
        <span className="text-xs text-gray-500">{hostname}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        <form
          action={async () => {
            "use server";
            await toggleRead(article.id, !article.read);
          }}
        >
          <button
            type="submit"
            className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
            title={article.read ? "Mark unread" : "Mark read"}
          >
            {article.read ? (
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
                  d="M3 19V5a2 2 0 012-2h14a2 2 0 012 2v14l-9-4-9 4z"
                />
              </svg>
            ) : (
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </form>
        <form
          action={async () => {
            "use server";
            await deleteArticle(article.id);
          }}
        >
          <button
            type="submit"
            className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-red-400"
            title="Delete"
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
        </form>
      </div>
    </li>
  );
}
