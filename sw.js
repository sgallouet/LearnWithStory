const OFFLINE_CACHE_NAME = "learn-with-story-offline-v1";
const CACHE_PREFIX = "learn-with-story-offline-";
const APP_SHELL = ["./", "index.html", "app.js", "styles.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== OFFLINE_CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(fetchOrCache(request));
});

async function fetchOrCache(request) {
  const cache = await caches.open(OFFLINE_CACHE_NAME);

  try {
    return await fetch(request);
  } catch {
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      return cache.match("index.html");
    }

    throw new Error(`No offline cache match for ${request.url}`);
  }
}
