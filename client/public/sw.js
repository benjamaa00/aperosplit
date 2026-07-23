const CACHE_NAME = 'equilibra-v3';
const STATIC_CACHE = 'equilibra-static-v3';

const PING_URL = '/api/trpc/equilibra.getGroupData?input=%7B%7D';
const PING_INTERVAL = 60 * 1000; // 1 minute

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
  fetch(PING_URL, { cache: 'no-store' }).catch(() => {});
}

// ── Push Notification Handler ──
self.addEventListener('push', (event) => {
  let data = { title: 'AperoSplit', body: '', url: '/', tag: 'equilibra', icon: '/icon.svg' };
  try {
    if (event.data) {
      const json = event.data.json();
      data = { ...data, ...json };
    }
  } catch {
    try { data.body = event.data ? event.data.text() : ''; } catch {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: '/icon.svg',
      tag: data.tag || 'equilibra',
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
      data: { url: data.url || '/', timestamp: data.timestamp || Date.now() },
      actions: [
        { action: 'open', title: 'Ouvrir' },
      ],
    }).then(() => {
      // Play notification sound via AudioContext for maximum compatibility
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch {}
    })
  );
});

// ── Notification Click Handler ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          if (client.navigate) client.navigate(url);
          return;
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ── Push Subscription Change Handler ──
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Notify the app about the new subscription
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: subscription.toJSON() });
        }
      });
    })
  );
});

// ── Periodic Background Sync (Chrome/Edge) ──
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'keep-alive') {
    event.waitUntil(
      fetch(PING_URL, { cache: 'no-store' }).catch(() => {})
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

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

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
  startPing();
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
