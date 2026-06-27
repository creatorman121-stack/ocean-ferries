/* Ocean Fast Ferries · Baggage Pro V300 — Service Worker */
const CACHE = 'off-v300-cache';
const ASSETS = ['/','/index.html','/styles.css','/app.js','/data.js','/utils.js','/map.js','/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isAppAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname === '/';
  if (isAppAsset) {
    /* Network-first for app assets — ensures users get updates */
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const cl = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    );
  } else {
    /* Cache-first for CDN resources (Leaflet, Chart.js, etc.) */
    e.respondWith(
      caches.match(e.request).then(r =>
        r || fetch(e.request).then(res => {
          if (res.ok) { const cl = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
          return res;
        }).catch(() => caches.match('/index.html'))
      )
    );
  }
});
