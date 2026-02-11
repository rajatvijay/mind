import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { extractUrl, fetchMetadata } from "@/lib/utils";

// Handles GET share targets (backward compat + direct links)
export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
}) {
  const params = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const url = extractUrl(params.url, params.text);

  if (!session) {
    const loginUrl = `/login?next=/share?url=${encodeURIComponent(url || "")}`;
    redirect(loginUrl);
  }

  if (!url) {
    redirect("/");
  }

  const metadata = await fetchMetadata(url);

  await db.insert(articles).values({
    userId: session.user.id,
    url,
    title: params.title || metadata.title,
    description: metadata.description,
    ogImage: metadata.ogImage,
    favicon: metadata.favicon,
    domain: metadata.domain,
  });

  redirect("/");
}
