/**
 * LOGMAS service worker.
 *
 * Hand written on purpose. The PWA plugins most Next.js templates reach
 * for are built for the Pages Router or pin the build to Webpack, and this
 * project runs Next 16 on Turbopack. A small explicit worker is easier to
 * audit than a generated one: what it caches is exactly what is listed
 * below.
 *
 * What it does:
 * - Precaches the app shell so the app OPENS with no network. Without
 *   this, an offline queue is useless, because the officer could store
 *   records but never reach the screens that create them.
 * - Serves static assets (scripts, styles, images, fonts) from cache
 *   while refreshing them in the background.
 * - For page navigations, tries the network first and falls back to the
 *   cached page, so officers keep working in the field.
 * - NEVER caches API responses. Application data must always be fresh
 *   from the server, and a cached payment or invoice response would be a
 *   bug, not a feature.
 *
 * What it does not do: run the queue sync itself. Sync needs the officer's
 * auth token, which lives in the page context. On a background sync event
 * the worker wakes any open page and that page runs the sync engine.
 */

const CACHE_VERSION = "logmas-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

// The field officer working set: dashboard, the services catalogue, the
// permits screen (where violations are logged), the offline queue and the
// login page. Individual service form pages cannot be listed here because
// their URLs carry service ids only the API knows; the app warms those
// into this same cache from the dashboard while online (see
// src/lib/offline/warm.ts), so a network drop before an officer ever
// opened a form still leaves the form available.
const SHELL_URLS = [
  "/",
  "/dashboard",
  "/dashboard/services",
  "/dashboard/permits",
  "/dashboard/offline-queue",
  "/login",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Cache what we can. A URL that is not reachable right now (for
      // example a page that redirects to login) must not fail the install.
      await Promise.allSettled(
        SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { credentials: "same-origin" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // Offline during install: the runtime caching below will fill
            // the shell on the next online visit.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/favicon_io/") ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API traffic is never cached. This includes every payment, invoice and
  // application endpoint.
  if (url.pathname.startsWith("/api/")) return;
  // The backend lives on a different origin in production, but if a
  // deployment ever proxies it under /backend, keep hands off it too.
  if (url.pathname.includes("/uploads/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const cached =
            (await cache.match(request)) ||
            (await cache.match("/dashboard")) ||
            (await cache.match("/"));
          if (cached) return cached;
          return new Response(
            "<h1>You are offline</h1><p>LOGMAS has no saved copy of this page yet. Reconnect once, open the pages you need for field work, and they will be available offline afterwards.</p>",
            { status: 503, headers: { "Content-Type": "text/html" } },
          );
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);
        return cached || (await network) || Response.error();
      })(),
    );
  }
});

// Background Sync: when the browser regains network it can fire this even
// if the tab was idle. The worker cannot sync by itself (no auth token),
// so it wakes open pages and the page-side sync engine does the work.
self.addEventListener("sync", (event) => {
  if (event.tag === "logmas-offline-sync") {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          client.postMessage({ type: "LOGMAS_SYNC_REQUESTED" });
        }
      })(),
    );
  }
});
