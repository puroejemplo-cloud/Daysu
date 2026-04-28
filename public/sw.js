const CACHE_NAME = "aura-vip-v1";

// Recursos del app shell que se cachean al instalar
const APP_SHELL = [
  "/",
  "/catalogo",
  "/reservar",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Instalar — cachear app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activar — borrar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — estrategia:
// - API y auth: siempre network
// - SVG/imágenes/fonts: cache-first
// - Resto: network-first con fallback a cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API, auth y rutas dinámicas → siempre network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/superadmin") ||
    url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Imágenes y SVGs → cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/) ||
    url.pathname.startsWith("/paquetes/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
      )
    );
    return;
  }

  // Resto → network-first, fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
