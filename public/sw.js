/*
 * Golden Anchor Finance — Service Worker
 * v0.6.0 — 2026-05-15
 *
 * Strategy:
 *   - Cache-first for static assets (icons, manifest, favicon) so the app icon
 *     and install metadata work offline.
 *   - Network-first for the app shell (/, /index.html, /assets/*) so users
 *     always pick up the latest Vercel deploy without forcing a hard refresh.
 *   - PASS-THROUGH (no caching, no interception) for any request whose URL
 *     contains "supabase" — D-2 says no caching of sensitive PII.
 *   - PASS-THROUGH for any non-GET request (POST/PUT/DELETE/PATCH).
 *
 * If anything goes wrong inside the worker, fall through to fetch().
 * A broken SW must never block the app.
 */

const SW_VERSION = "ga-sw-v0.6.0-2026-05-15";
const STATIC_CACHE = `${SW_VERSION}-static`;

const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
  "/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        // Don't fail install if a single asset 404s — log and continue.
        console.warn("[ga-sw] addAll failed:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k.startsWith("ga-sw-") && k !== STATIC_CACHE) {
            return caches.delete(k);
          }
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Pass through anything that isn't a GET (D-2: no caching of writes either).
  if (req.method !== "GET") return;

  // Pass through Supabase / any third-party API — never cache sensitive PII.
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("stripe") ||
    url.hostname.includes("resend")
  ) {
    return;
  }

  // Only handle same-origin requests for the rest of the strategy.
  if (url.origin !== self.location.origin) return;

  // Static assets → cache-first.
  const isStatic =
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/assets/") ||
    /\.(png|jpg|jpeg|svg|woff2?|ttf|ico)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            // Only cache 200 responses with a basic type.
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
    return;
  }

  // App shell (HTML navigation) → network-first.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/index.html")))
    );
    return;
  }

  // Everything else → pass through.
});

// Allow the page to ping the SW to force a skipWaiting (post-deploy refresh hint).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
