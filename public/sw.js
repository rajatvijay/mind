const CACHE_NAME = "mind-v2";
const OFFLINE_URL = "/offline";

// App shell — cached on install
const APP_SHELL = [
  "/offline",
  "/login",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// ── Install: pre-cache app shell ─────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: strategy per request type ─────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (form submissions, API calls)
  if (request.method !== "GET") return;

  // Skip auth API, save API, and Next.js HMR/webpack
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack")
  ) {
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation requests (HTML pages): stale-while-revalidate
  // Serves cached article list instantly, refreshes in background
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});

// ── Caching strategies ───────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Fire off revalidation in the background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // If we have a cached version, return it immediately
  if (cached) return cached;

  // No cache — must wait for network
  const response = await fetchPromise;
  if (response) return response;

  // Network also failed — show offline page
  const offlinePage = await cache.match(OFFLINE_URL);
  if (offlinePage) return offlinePage;

  return new Response("Offline", {
    status: 503,
    headers: { "Content-Type": "text/plain" },
  });
}

// ── Listen for skip-waiting message from client ──────────────────────

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
