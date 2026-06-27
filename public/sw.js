// Zomet POS Service Worker
// Version auto-bumped on each deploy via /version.json
// If version.json changes, SW clears all caches and reloads

const STATIC_CACHE = 'zomet-static-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    fetch('/version.json?' + Date.now())
      .then(r => r.json())
      .then(v => {
        const ver = v.version || 'unknown';
        console.log('[SW] Version:', ver);
      })
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  // Check version and clear if different
  event.waitUntil(
    (async () => {
      // Claim all clients
      await self.clients.claim();

      // Fetch latest version.json
      try {
        const res = await fetch('/version.json?' + Date.now());
        const v = await res.json();
        const expectedVersion = v.version || 'unknown';

        // Get stored version from IndexedDB or just compare to cached
        const cacheKeys = await caches.keys();
        const staleCaches = cacheKeys.filter(k => !k.includes(expectedVersion));
        
        if (staleCaches.length > 0 && cacheKeys.length > 0) {
          // Version mismatch — clear everything
          await Promise.all(staleCaches.map(k => caches.delete(k)));
          // Cache version.json for future checks
          const cache = await caches.open('zomet-' + expectedVersion);
          cache.put('/version.json', new Response(JSON.stringify(v)));
        }
      } catch (e) {
        // No network — use existing cache
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/login' || url.pathname === '/dashboard') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match('/'));
      return cached || fetched;
    })
  );
});
