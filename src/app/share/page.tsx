import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { extractUrl, fetchTitle } from "@/lib/utils";

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

  const title = params.title || (await fetchTitle(url));

  await db.insert(articles).values({
    userId: session.user.id,
    url,
    title,
  });

  redirect("/");
}
