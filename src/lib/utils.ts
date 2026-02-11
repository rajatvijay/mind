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

export type OgMetadata = {
  title: string;
  description: string | null;
  ogImage: string | null;
  favicon: string | null;
  domain: string;
};

function extractMetaContent(html: string, property: string): string | null {
  // Match both property= and name= attributes
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const match = html.match(regex);
  const value = match?.[1] || match?.[2];
  return value?.trim() || null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  // Look for <link rel="icon"> or <link rel="shortcut icon">
  const match = html.match(
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i
  );
  if (match?.[1]) {
    try {
      return new URL(match[1], baseUrl).href;
    } catch {
      return null;
    }
  }
  // Fallback to Google's favicon service
  try {
    const { origin } = new URL(baseUrl);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return null;
  }
}

export async function fetchMetadata(url: string): Promise<OgMetadata> {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace("www.", "");
  const fallback: OgMetadata = {
    title: domain,
    description: null,
    ogImage: null,
    favicon: null,
    domain,
  };

  try {
    if (isPrivateHostname(parsedUrl.hostname)) {
      return fallback;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mind-ReadLater/1.0" },
    });
    clearTimeout(timeout);
    const html = await res.text();

    // Extract title
    const ogTitle = extractMetaContent(html, "og:title");
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = ogTitle || titleMatch?.[1]?.trim() || domain;

    // Extract description
    const description =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "description");

    // Extract OG image
    let ogImage = extractMetaContent(html, "og:image");
    if (ogImage) {
      try {
        ogImage = new URL(ogImage, url).href;
      } catch {
        ogImage = null;
      }
    }

    // Extract favicon
    const favicon = extractFavicon(html, url);

    return { title, description, ogImage, favicon, domain };
  } catch {
    return fallback;
  }
}

// Keep backward-compatible fetchTitle for share page
export async function fetchTitle(url: string): Promise<string> {
  const metadata = await fetchMetadata(url);
  return metadata.title;
}
