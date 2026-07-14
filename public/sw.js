const CACHE_NAME = "polish-first-v7";
const APP_SHELL = ["./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const indexUrl = new URL("./", self.registration.scope).href;
  const response = await fetch(indexUrl, { cache: "reload" });
  await cache.put(indexUrl, response.clone());
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], indexUrl))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href);
  const staticShell = APP_SHELL.map((path) => new URL(path, indexUrl).href);
  await cache.addAll([...new Set([...staticShell, ...assets])]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(new URL("./", self.registration.scope).href, copy));
          return response;
        })
        .catch(() => caches.match(new URL("./", self.registration.scope).href)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })),
  );
});
