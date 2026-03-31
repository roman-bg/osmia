// Service Worker за PWA определител на земни пчели
// Хостван на: https://bumblebee.cv/

const CACHE_NAME = 'bumblebee-id-v2';
const OFFLINE_URL = '/offline.html';

// Ресурси за кеширане при инсталация
const urlsToCache = [
    '/',
'/index.html',
'/offline.html',
'/manifest.json',
'/icons/icon-48x48.png',
'/icons/icon-72x72.png',
'/icons/icon-96x96.png',
'/icons/icon-144x144.png',
'/icons/icon-192x192.png',
'/icons/icon-512x512.png'
];

// Инсталиране на Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Активиране - изчиства стари кешове
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Стратегия: Network first, fallback to cache, then offline page
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Пропускаме несъществените заявки
  if (event.request.method !== 'GET') {
    return;
  }
  
  // За навигационни заявки (HTML страници) - network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Кешираме успешните отговори
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Ако няма мрежа, търсим в кеша
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Ако няма в кеша, показваме офлайн страницата
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // За статични ресурси (css, js, изображения) - cache first, then network
  if (event.request.destination === 'style' || 
      event.request.destination === 'script' || 
      event.request.destination === 'image' ||
      requestUrl.pathname.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Обнови кеша на заден план
            fetch(event.request)
              .then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              })
              .catch(() => {});
            return cachedResponse;
          }
          return fetch(event.request)
            .then((networkResponse) => {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // За всички останали заявки - network first с fallback към кеш
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Пуш нотификации (опционално)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Нова информация за земни пчели',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification('🐝 Определител на земни пчели', options)
  );
});
