// Service Worker — Cache-first for offline PWA
const CACHE_NAME = 'signal-circuit-v37';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/gates.js',
  '/js/wires.js',
  '/js/simulation.js',
  '/js/levels.js',
  '/js/audio.js',
  '/js/achievements.js',
  '/js/canvas.js',
  '/js/ui.js',
  '/js/tutorial.js',
  '/js/main.js',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
