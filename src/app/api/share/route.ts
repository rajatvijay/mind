import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { extractUrl, fetchMetadata } from "@/lib/utils";

// Handle POST from PWA share_target (multipart/form-data)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    let urlParam = "";
    try {
      const form = await req.formData();
      const rawUrl = form.get("url")?.toString() || "";
      const rawText = form.get("text")?.toString() || "";
      urlParam = extractUrl(rawUrl, rawText) || "";
    } catch {
      // ignore parse errors
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "next",
      `/share?url=${encodeURIComponent(urlParam)}`
    );
    return NextResponse.redirect(loginUrl);
  }

  let url: string | null = null;
  let titleParam: string | undefined;

  try {
    const form = await req.formData();
    const rawUrl = form.get("url")?.toString();
    const rawText = form.get("text")?.toString();
    titleParam = form.get("title")?.toString();
    url = extractUrl(rawUrl, rawText);
  } catch {
    // Fall through to redirect
  }

  if (!url) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const metadata = await fetchMetadata(url);

  await db.insert(articles).values({
    userId: session.user.id,
    url,
    title: titleParam || metadata.title,
    description: metadata.description,
    ogImage: metadata.ogImage,
    favicon: metadata.favicon,
    domain: metadata.domain,
  });

  return NextResponse.redirect(new URL("/", req.url));
}
