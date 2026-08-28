// Cache only the same-origin application shell. Ledger data must always come
// directly from Supabase; caching API responses can resurrect deleted rows.
const CACHE_PREFIX = 'rajmudra-';
const CACHE_NAME = 'rajmudra-shell-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

const STATIC_DESTINATIONS = new Set(['document', 'script', 'style', 'image', 'font', 'manifest']);

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Remove the old v2 cache, which may contain stale Supabase
// GET responses, while leaving unrelated applications' caches alone.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

function isSupabaseRequest(request, url) {
  // Hosted Supabase requests are cross-origin. The path/header checks also
  // protect a same-origin reverse proxy should one be added later.
  return url.origin !== self.location.origin ||
    /^\/(?:rest|auth|functions|storage)\/v1(?:\/|$)/.test(url.pathname) ||
    request.headers.has('apikey') ||
    request.headers.has('authorization');
}

function isCacheableAppRequest(request, url) {
  return request.method === 'GET' &&
    url.origin === self.location.origin &&
    STATIC_DESTINATIONS.has(request.destination) &&
    !isSupabaseRequest(request, url);
}

async function cacheFirstAppShell(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Fetch Event - Supabase and every cross-origin request are deliberately left
// to the browser's network stack. Only same-origin static app assets use the
// Cache Storage API.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Exclude chrome extensions or non-http requests.
  if (!url.protocol.startsWith('http')) return;

  if (!isCacheableAppRequest(event.request, url)) return;

  event.respondWith(cacheFirstAppShell(event.request));
});
