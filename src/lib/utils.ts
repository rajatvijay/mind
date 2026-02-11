export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPrivateHostname(hostname: string): boolean {
  // Block localhost variants
  if (hostname === "localhost" || hostname === "[::1]") return true;

  // Block private IPv4 ranges
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true;         // 127.0.0.0/8 loopback
    if (a === 10) return true;           // 10.0.0.0/8 private
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
    if (a === 192 && b === 168) return true;           // 192.168.0.0/16 private
    if (a === 169 && b === 254) return true;           // 169.254.0.0/16 link-local
    if (a === 0) return true;            // 0.0.0.0/8
  }

  return false;
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
    const { hostname } = new URL(url);
    if (isPrivateHostname(hostname)) {
      return new URL(url).hostname;
    }

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
