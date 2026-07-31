const CACHE_NAME = "progitpaie-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/offline",
  "/logo.png",
  "/manifest.json",
];

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

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Enregistrer la réponse dans le cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === "navigate") {
          return caches.match(OFFLINE_URL);
        }

        return new Response("Hors-ligne", { status: 503, statusText: "Service Unavailable" });
      })
  );
});
