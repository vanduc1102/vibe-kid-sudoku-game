/* =====================================================================
   Kid Sudoku – Service Worker
   Cache version: kid-sudoku-v1
   Strategy: Cache-first with network fallback
   ===================================================================== */

const CACHE_NAME = 'kid-sudoku-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/sudoku.js',
  './src/game.js',
  './src/ui.js',
  './src/sounds.js',
  './assets/styles/main.css',
  './assets/icons/icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// ── Install: pre-cache all assets ──────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing Kid Sudoku v1…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
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
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
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
    icon: './assets/icons/icon.svg',
    badge: './assets/icons/icon.svg'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
