const VERSION = "bagues-16";
const FICHIERS = [
  "./index.html",
  "./app.js",
  "./app.css",
  "./logic.js",
  "./especes.json",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cles = await caches.keys();
      await Promise.all(cles.filter((cle) => cle !== VERSION).map((cle) => caches.delete(cle)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      if (url.pathname.endsWith("/")) {
        const index = await caches.match("./index.html");
        if (index) return index;
      }
      try {
        return await fetch(event.request);
      } catch {
        return caches.match("./index.html");
      }
    })()
  );
});
