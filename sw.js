const CACHE_NAME = 'blogapp-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/reads.html',
  '/post.html',
  '/styles/reads.css',
  '/styles/post.css',
  '/styles/style.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve cached assets, but always fetch JS/Firestore from network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Always fetch JS files and Firebase API requests from network
  if (
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.origin.includes('firebase.googleapis.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for other static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});