import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { apiTokens, articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidUrl, fetchMetadata } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  const [row] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.token, token))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Parse URL from body — handle JSON, form data, or plain text
  let url: string | null = null;
  let title: string | undefined;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    url = body?.url?.toString().trim() || null;
    title = body?.title;
  } else if (contentType.includes("form")) {
    const form = await req.formData().catch(() => null);
    url = form?.get("url")?.toString().trim() || null;
    title = form?.get("title")?.toString();
  } else {
    // Plain text — treat entire body as URL
    const text = await req.text().catch(() => "");
    url = text.trim() || null;
  }

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Save with full metadata
  const metadata = await fetchMetadata(url);

  await db.insert(articles).values({
    userId: row.userId,
    url,
    title: title || metadata.title,
    description: metadata.description,
    ogImage: metadata.ogImage,
    favicon: metadata.favicon,
    domain: metadata.domain,
  });

  return NextResponse.json({ ok: true });
}

// Also support GET for simpler shortcut setups
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();
  const [row] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.token, token))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url")?.trim();
  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const metadata = await fetchMetadata(url);
  const titleParam = req.nextUrl.searchParams.get("title");

  await db.insert(articles).values({
    userId: row.userId,
    url,
    title: titleParam || metadata.title,
    description: metadata.description,
    ogImage: metadata.ogImage,
    favicon: metadata.favicon,
    domain: metadata.domain,
  });

  return NextResponse.json({ ok: true });
}
