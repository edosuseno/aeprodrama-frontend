// Basic Service Worker for AE PRO PWA
const CACHE_NAME = 'aepro-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Jangan intercept request video/media lintas domain untuk mencegah error CORS dan Range
  const url = new URL(event.request.url);
  if (
    event.request.destination === 'video' || 
    event.request.destination === 'audio' ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.origin !== self.location.origin
  ) {
    return; // Biarkan browser menangani secara native
  }

  // Simple pass-through untuk resource lokal
  event.respondWith(fetch(event.request));
});
