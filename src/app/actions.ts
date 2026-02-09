"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { articles, apiTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidUrl, fetchTitle } from "@/lib/utils";

async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function addArticle(formData: FormData) {
  const session = await getSessionOrThrow();
  const url = formData.get("url") as string;

  if (!url || !isValidUrl(url)) return;

  const title = await fetchTitle(url);

  await db.insert(articles).values({
    userId: session.user.id,
    url,
    title,
  });

  revalidatePath("/");
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

export async function generateApiToken() {
  const session = await getSessionOrThrow();

  const token = crypto.randomUUID();

  await db.insert(apiTokens).values({
    userId: session.user.id,
    token,
  });

  return token;
}
