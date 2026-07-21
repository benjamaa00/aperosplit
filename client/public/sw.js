const CACHE_NAME = 'equilibra-v3';
const STATIC_CACHE = 'equilibra-static-v3';

const PING_URL = '/api/trpc/equilibra.getGroupData?input=%7B%7D';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([
      '/manifest.json',
      '/icon.svg',
    ]))
  );
});

// Keep-alive ping using setInterval (runs while SW is alive)
let pingTimer = null;
function startPing() {
  if (pingTimer) return;
  pingTimer = setInterval(() => {
    fetch(PING_URL, { cache: 'no-store' }).catch(() => {});
  }, PING_INTERVAL);
  // Also ping immediately on activation
  fetch(PING_URL, { cache: 'no-store' }).catch(() => {});
}

// Periodic Background Sync (Chrome/Edge - works even when app is closed)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'keep-alive') {
    event.waitUntil(
      fetch(PING_URL, { cache: 'no-store' }).catch(() => {})
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (tRPC, etc.)
  if (request.url.includes('/api/')) return;

  // Navigation requests: network-first (SPA shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets (JS, CSS, images): cache-first
  if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  startPing();
  // Register periodic sync if available
  if (self.registration.periodicSync) {
    self.registration.periodicSync.register('keep-alive', {
      minInterval: PING_INTERVAL,
    }).catch(() => {});
  }
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
