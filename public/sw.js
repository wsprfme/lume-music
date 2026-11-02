/* Lume service worker — multi-strategy + skip-waiting */
const VERSION = 'lume-v3';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMG_CACHE = `${VERSION}-img`;

const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-mask-192.png',
  '/icon-mask-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept media or external streams.
  if (url.pathname.startsWith('/api/stream')) return;
  if (req.destination === 'audio' || req.destination === 'video') return;

  // Cross-origin artwork (Audius / SoundCloud CDNs): cache with stale-while-revalidate.
  if (url.origin !== self.location.origin) {
    if (req.destination === 'image') {
      event.respondWith(swr(req, IMG_CACHE, 7 * 24 * 60 * 60_000));
    }
    return;
  }

  // Same-origin navigation: network-first, fallback to cached "/" shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return r;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/'))),
    );
    return;
  }

  // Same-origin API: network-first.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return r;
        })
        .catch(() => caches.match(req).then((m) => m || new Response('{}', { headers: { 'content-type': 'application/json' } }))),
    );
    return;
  }

  // Static assets / next chunks: cache-first with revalidate.
  event.respondWith(swr(req, STATIC_CACHE));
});

async function swr(req, cacheName, maxAgeMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetcher = fetch(req)
    .then((r) => {
      if (r.ok) cache.put(req, r.clone()).catch(() => {});
      return r;
    })
    .catch(() => cached);

  if (cached) {
    if (maxAgeMs) {
      const dt = cached.headers.get('date');
      const age = dt ? Date.now() - new Date(dt).getTime() : 0;
      if (age > maxAgeMs) return fetcher;
    }
    return cached;
  }
  return fetcher;
}
