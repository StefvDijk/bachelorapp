const CACHE_NAME = 'jelle-lasttime-v3';
const urlsToCache = [
  '/',
  '/player/Jelle',
  '/simply-wild', 
  '/deal-makers-shop',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - network-first for navigations, cache-first for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isNavigation = req.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match('/')
      })
    );
  } else {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 