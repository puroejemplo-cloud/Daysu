const CACHE_NAME = "aura-vip-v4";

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

  // Navegación de página → no interceptar (Safari iOS falla con fetch en navigate mode)
  if (event.request.mode === "navigate") {
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

  // Imágenes y SVGs → cache-first
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

  // Resto → network-first, fallback a caché
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

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Daysu.vip", {
      body:    data.body   ?? "",
      icon:    "/api/icon?size=192",
      badge:   "/api/icon?size=96",
      tag:     data.tag    ?? "daysu-event",
      data:    { url: data.url ?? "/admin/calendario" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/admin/calendario";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(target); }
      else           clients.openWindow(target);
    })
  );
});
