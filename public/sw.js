const CACHE_NAME = "aura-vip-v3";

const APP_SHELL = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Navegación de página → SIEMPRE red, nunca caché
  // Evita que el SW sirva HTML viejo al navegar entre páginas
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  // API, auth y assets de Next.js → siempre red
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/superadmin") ||
    url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Imágenes y SVGs → cache-first (estáticos, no cambian frecuentemente)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif)$/) ||
      url.pathname.startsWith("/paquetes/") ||
      url.pathname.startsWith("/icons/")) {
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

  // Resto (CSS, JS, fuentes) → network-first, fallback a caché
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
