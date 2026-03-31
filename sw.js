const CACHE_NAME = 'bumblebee-id-v3';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'icon-48x48.png',
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-144x144.png',
  'icon-192x192.png',
  'icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
