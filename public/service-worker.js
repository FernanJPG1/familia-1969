const CACHE_NAME = 'barberpro-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through for real-time WebSocket and dynamic APIs
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
