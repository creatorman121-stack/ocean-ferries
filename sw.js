const CACHE = 'oceanjet-v47-stability-efficiency-cache';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => caches.match(event.request))
      .then(r => r || caches.match('./index.html'))
      .then(r => r || new Response('OceanJet V47 offline fallback unavailable.', { status: 504, headers: { 'Content-Type': 'text/plain' } }))
  );
});
