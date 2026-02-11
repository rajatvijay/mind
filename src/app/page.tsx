import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SignOutButton, GenerateTokenSection } from "./client";
import { ArticleFeed } from "./components/article-feed";

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

  return (
    <main id="main-content" className="relative z-10 mx-auto min-h-screen max-w-2xl px-4 py-8 text-gray-100">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mind</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <ArticleFeed articles={items} />

      {/* Settings */}
      <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      <GenerateTokenSection />
    </main>
  );
}
