// =============================================================================
// SERVICE WORKER - MORPHEUS ECHO
// =============================================================================
// This cache name is automatically updated by the build script.
const CACHE_NAME = 'morpheus-echo-v1715893800000';

// Install event - immediately take over
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients & delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Smart Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for API requests, WebSockets, cross-origin, or non-GET methods
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.includes('socket.io') || url.hostname !== self.location.hostname) {
    return;
  }

  // 1. Cache-First for images and media (Lightning fast UI loading)
  if (request.destination === 'image' || request.destination === 'audio' || request.destination === 'video') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Network-First for HTML/JS/CSS (Always pulls the newest code from GitHub/Vercel deployment)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return networkResponse;
      })
      .catch(() => caches.match(request)) // Offline fallback
  );
});