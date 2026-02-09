import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { apiTokens, articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidUrl, fetchTitle } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const [row] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.token, token))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.url || !isValidUrl(body.url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const title = body.title || (await fetchTitle(body.url));

  await db.insert(articles).values({
    userId: row.userId,
    url: body.url,
    title,
  });

  return NextResponse.json({ ok: true });
}
