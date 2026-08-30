const CACHE = "teranga-pwa-v2";

const ORIGIN = self.location.origin;

function shouldCache(request) {
  const url = new URL(request.url);
  // Never cache API, auth, session, data or RSC streaming endpoints.
  if (url.origin !== ORIGIN) return false;
  if (url.pathname.startsWith("/api/")) return false;
  // Never cache HTML document navigations or dynamic RSC streams (they can
  // contain per-user, authenticated data which must stay fresh).
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) return false;
  if (url.searchParams.has("_rsc") || url.pathname.includes("/_next/data")) return false;
  // Only cache versioned static assets (js/css/images/fonts) which are safe.
  if (!/\.(js|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)(\?|$)/.test(url.pathname)) return false;
  return true;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Never intercept auth/API/data requests: always hit the network so session
  // state and authenticated pages are never served stale from cache.
  if (!shouldCache(request)) return;

  // Stale-while-revalidate for safe static assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
