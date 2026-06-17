/**
 * ProCible Service Worker v2
 * ---------------------------
 * Performance strategy:
 *   - Pre-cache the app shell (/, /manifest.json, /icon-192.png, /logo.svg) on install
 *   - Cache-first + immutable for /_next/static/* (hashed chunks → safe to cache forever)
 *   - Stale-while-revalidate for /_next/static/* if not yet cached (don't block first load)
 *   - Network-first for HTML navigations (always the latest version)
 *   - Network-first with cache fallback + 4s timeout for /api/* calls
 *
 * This makes repeat visits nearly instant: chunks load from cache in <10ms,
 * only the HTML and API calls go to the network.
 */

const CACHE_VERSION = 'procible-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

// App shell — pre-cached on install. Keep this list small (under 1MB).
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/logo.svg',
];

// Maximum entries to keep in the runtime cache (LRU eviction).
const RUNTIME_CACHE_MAX_ENTRIES = 60;
// API responses cached for at most this many seconds.
const API_CACHE_MAX_AGE_SECONDS = 300; // 5 min

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !name.startsWith(CACHE_VERSION))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Trim a cache to its max entries (LRU-ish — uses last-access order from Cache API).
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete the oldest entries (first inserted → first evicted).
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only — let cross-origin requests (e.g. Google Fonts, OpenRouter) go to the network.
  if (url.origin !== self.location.origin) return;

  // ── 1. Static assets (_next/static/*) — cache-first, immutable ──
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone).then(() => trimCache(RUNTIME_CACHE, RUNTIME_CACHE_MAX_ENTRIES));
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ── 2. API calls — network-first with cache fallback + 4s timeout ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('api-timeout')), 4000)
        ),
      ])
        .then((response) => {
          // Only cache successful GET responses (don't cache errors or POST/PUT).
          if (response && response.status === 200 && request.method === 'GET') {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone).then(() => trimCache(API_CACHE, 30));
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ offline: true, error: 'network-error' }), {
                headers: { 'Content-Type': 'application/json' },
              })
          )
        )
    );
    return;
  }

  // ── 3. HTML navigations — network-first (always fresh), cache fallback ──
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // ── 4. Other same-origin GETs (icons, manifest, etc.) — stale-while-revalidate ──
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone).then(() => trimCache(RUNTIME_CACHE, RUNTIME_CACHE_MAX_ENTRIES));
            });
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ── Push notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ProCible';
  const options = {
    body: data.body || 'Nouveaux prospects trouvés !',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
