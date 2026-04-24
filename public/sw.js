// Plant Care Tracker — Service Worker

const CACHE_NAME = 'plant-tracker-v1';
const NOTIF_CONFIG_CACHE = 'notif-config-v1';
const NOTIF_CONFIG_KEY = 'notif://config';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== CACHE_NAME && n !== NOTIF_CONFIG_CACHE)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── Messages from app ──────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'STORE_NOTIF_CONFIG') {
    event.waitUntil(storeNotifConfig(event.data.config));
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: tag || 'plant-notification',
        renotify: true,
      })
    );
  }
});

// ── Periodic Background Sync ───────────────────────────────────────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-watering-notifications') {
    event.waitUntil(backgroundNotificationCheck());
  }
});

async function backgroundNotificationCheck() {
  const config = await getNotifConfig();
  if (!config || !config.enabled) return;

  const now = new Date();
  const [cfgHr, cfgMin] = config.time.split(':').map(Number);
  const totalNow = now.getHours() * 60 + now.getMinutes();
  const totalCfg = cfgHr * 60 + cfgMin;

  // Fire if within 30-minute window of configured time
  if (Math.abs(totalNow - totalCfg) > 30) return;

  const today = now.toISOString().slice(0, 10);
  const lastDate = await getFromConfigCache('last_bg_notif_date');
  if (lastDate === today) return;

  await putToConfigCache('last_bg_notif_date', today);
  await self.registration.showNotification('הגיע הזמן להשקות! 💧', {
    body: 'הצמחים שלך מחכים לגשם קטן...',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'daily-watering',
    renotify: true,
  });
}

// ── Notification click — open / focus app ──────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow('/');
      })
  );
});

// ── Config storage helpers (Cache API) ────────────────────────────────────

async function storeNotifConfig(config) {
  try {
    const cache = await caches.open(NOTIF_CONFIG_CACHE);
    await cache.put(
      new Request(NOTIF_CONFIG_KEY),
      new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json' } })
    );
  } catch (_) {}
}

async function getNotifConfig() {
  try {
    const cache = await caches.open(NOTIF_CONFIG_CACHE);
    const res = await cache.match(new Request(NOTIF_CONFIG_KEY));
    if (!res) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function putToConfigCache(key, value) {
  try {
    const cache = await caches.open(NOTIF_CONFIG_CACHE);
    await cache.put(
      new Request(`notif://${key}`),
      new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } })
    );
  } catch (_) {}
}

async function getFromConfigCache(key) {
  try {
    const cache = await caches.open(NOTIF_CONFIG_CACHE);
    const res = await cache.match(new Request(`notif://${key}`));
    if (!res) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}
