// Keeps the site shell and content available offline once visited.
// Bump VERSION whenever shell files change so visitors get the new copy.
const VERSION = "udha-v3";
const SHELL = [
  "./", "index.html", "place.html", "essentials.html", "itineraries.html",
  "css/style.css", "js/app.js", "js/config.js", "js/commons.js",
  "data/places.json", "data/essentials.json", "data/itineraries.json", "manifest.webmanifest", "icons/icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin only: network first so content stays fresh, cache as the offline fallback.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: /(place|itineraries)\.html$/.test(url.pathname) }))
  );
});
