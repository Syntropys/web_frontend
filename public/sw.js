const CACHE_NAME = 'agrolytics-cache-v1';

// Static resources to cache immediately during installation
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/hero-desktop.webp',
  '/hero-mobile.webp',
  '/fonts/fraunces-regular.woff2',
  '/fonts/fraunces-500.woff2',
  '/fonts/fraunces-600.woff2',
  '/fonts/fraunces-italic.woff2',
  '/fonts/inter-regular.woff2',
  '/fonts/inter-500.woff2',
  '/fonts/inter-600.woff2',
  '/fonts/jetbrains-mono-regular.woff2'
];

// Installation event: cache all vital static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static app shell');
      return cache.addAll(STATIC_RESOURCES);
    })
  );
  self.skipWaiting();
});

// Activation event: clean up older caches if any
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: intercept network requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass caching for Supabase queries and API calls to ML backend
  if (
    url.origin !== self.location.origin || 
    url.pathname.startsWith('/api') || 
    url.pathname.includes('supabase')
  ) {
    return;
  }

  // 1. Cache-First Strategy for fonts, hero images, and favicon (rarely change)
  if (
    url.pathname.startsWith('/fonts/') || 
    url.pathname.endsWith('.webp') || 
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate Strategy for HTML, JS, CSS, and GeoJSON files
  // Allows immediate loading from cache while fetching updates in the background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Silence network errors when offline
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
