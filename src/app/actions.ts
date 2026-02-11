"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { articles, apiTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidUrl, fetchMetadata } from "@/lib/utils";

export type ActionState = {
  message: string;
  status: "success" | "error" | "idle";
};

async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function addArticle(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSessionOrThrow();
  const rawUrl = formData.get("url");

  if (typeof rawUrl !== "string" || !rawUrl || !isValidUrl(rawUrl)) {
    return { message: "Please enter a valid URL", status: "error" };
  }

  const url = rawUrl.trim();

  // Check for duplicate
  const [existing] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.userId, session.user.id), eq(articles.url, url)))
    .limit(1);

  if (existing) {
    // Move to top by updating createdAt
    await db
      .update(articles)
      .set({ createdAt: new Date(), read: false })
      .where(eq(articles.id, existing.id));
    revalidatePath("/");
    return { message: "Already saved — moved to top", status: "success" };
  }

  const metadata = await fetchMetadata(url);

  await db.insert(articles).values({
    userId: session.user.id,
    url,
    title: metadata.title,
    description: metadata.description,
    ogImage: metadata.ogImage,
    favicon: metadata.favicon,
    domain: metadata.domain,
  });

  revalidatePath("/");
  return { message: `Saved — ${metadata.title}`, status: "success" };
}

export async function toggleRead(id: string, read: boolean) {
  const session = await getSessionOrThrow();

  await db
    .update(articles)
    .set({ read })
    .where(and(eq(articles.id, id), eq(articles.userId, session.user.id)));

  revalidatePath("/");
}

export async function deleteArticle(id: string) {
  const session = await getSessionOrThrow();

  await db
    .delete(articles)
    .where(and(eq(articles.id, id), eq(articles.userId, session.user.id)));

  revalidatePath("/");
}

export async function restoreArticle(data: {
  userId: string;
  url: string;
  title: string;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
  domain: string | null;
  read: boolean | null;
}) {
  const session = await getSessionOrThrow();
  if (session.user.id !== data.userId) throw new Error("Unauthorized");

  await db.insert(articles).values({
    userId: data.userId,
    url: data.url,
    title: data.title,
    description: data.description,
    ogImage: data.ogImage,
    favicon: data.favicon,
    domain: data.domain,
    read: data.read ?? false,
  });

  revalidatePath("/");
}

export async function generateApiToken() {
  const session = await getSessionOrThrow();

  const token = crypto.randomUUID();

  await db.insert(apiTokens).values({
    userId: session.user.id,
    token,
  });

  return token;
}
