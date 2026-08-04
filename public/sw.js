const CACHE_NAME = "progitpaie-v2-public-only";
const STATIC_ASSETS = [
  "/login",
  "/offline",
  "/logo.png",
  "/manifest.json",
];

const PUBLIC_ASSET_PREFIXES = ["/_next/static/", "/_next/image/"];

function isPublicAsset(requestUrl) {
  const url = new URL(requestUrl);
  if (url.origin !== self.location.origin) return false;
  if (STATIC_ASSETS.includes(url.pathname)) return true;
  return PUBLIC_ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

// Installation du Service Worker et mise en cache des assets statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("⚡ [SW] Mise en cache des ressources statiques");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 [SW] Nettoyage ancien cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes HTTP (Network First avec Fallback Cache/Offline)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!isPublicAsset(event.request.url)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        return new Response("Hors-ligne", { status: 503, statusText: "Service Unavailable" });
      })
  );
});
