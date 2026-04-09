const CACHE_NAME = "batman-ultra-cache-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(networkRes => {
          if (!networkRes || networkRes.status !== 200 || networkRes.type === "opaque") {
            return networkRes;
          }
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return networkRes;
        })
        .catch(() => {
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
