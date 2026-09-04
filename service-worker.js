const CACHE_NAME = 'sardor-ai-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

const isApiRequest = (url) =>
  url.pathname.includes('/chat') ||
  url.pathname.includes('/generate-image');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((error) => {
        console.error('Cache install error:', error);
      })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Faqat GET
  if (request.method !== 'GET') return;

  // API/backend so'rovlarini umuman cache qilmaymiz
  if (isApiRequest(url)) return;

  // Faqat o'z saytimiz resurslari
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Faqat muvaffaqiyatli javoblarni cache qilamiz
        if (response.ok) {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      });
    })
  );
});
