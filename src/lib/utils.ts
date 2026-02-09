export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractUrl(urlParam?: string, textParam?: string): string | null {
  // Some Android apps put the URL in "text" instead of "url"
  for (const raw of [urlParam, textParam]) {
    if (!raw) continue;
    // Try to find a URL anywhere in the string
    const match = raw.match(/https?:\/\/[^\s]+/);
    if (match && isValidUrl(match[0])) return match[0];
    if (isValidUrl(raw)) return raw;
  }
  return null;
}

export async function fetchTitle(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mind-ReadLater/1.0" },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : new URL(url).hostname;
  } catch {
    return new URL(url).hostname;
  }
}
