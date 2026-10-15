/* =====================================================================
   Kid Sudoku – Service Worker
   Cache version: kid-sudoku-v1
   Strategy: Cache-first with network fallback
   ===================================================================== */

const CACHE_NAME = 'kid-sudoku-v1';

const ASSETS_TO_CACHE = [
  './',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ── Install: pre-cache app shell (failures must not block installation) ─
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first strategy ────────────────────────────────────────
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve from cache, update in background
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse;
      }

      // Not in cache: fetch from network and store
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback for HTML pages
        if ((event.request.headers.get('accept') || '').includes('text/html')) {
          return caches.match('./');
        }
      });
    })
  );
});

// ── Background Sync support ────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    console.log('[SW] Background sync: sync-scores');
    // High scores are stored locally, nothing to sync to server
  }
});

// ── Push notifications (future) ────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Kid Sudoku';
  const options = {
    body: data.body || 'Come back and play! 🎮',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
