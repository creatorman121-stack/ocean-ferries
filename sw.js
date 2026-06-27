/* Ocean Fast Ferries · Baggage Pro V301 — Service Worker */
const CACHE = 'off-v301-cache';
const APP_VERSION = 'V301';
const BASE = '/ocean-ferries';
const ASSETS = [BASE+'/', BASE+'/index.html', BASE+'/styles.css', BASE+'/app.js', BASE+'/data.js', BASE+'/utils.js', BASE+'/map.js', BASE+'/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  /* Delete ALL old caches — forces complete cache clear on version bump */
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
        });
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  /* Ignore non-GET and chrome-extension requests */
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  const isAppAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') ||
                     url.pathname.endsWith('.html') || url.pathname === '/' ||
                     url.pathname.endsWith('/manifest.json');

  if (isAppAsset) {
    /* Network-first for app assets — ensures users always get the latest code */
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const cl = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, cl));
        }
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match(BASE+'/index.html')))
    );
  } else {
    /* Stale-while-revalidate for CDN resources — serve cache instantly, update in background */
    const cached = caches.match(e.request);
    const fetched = fetch(e.request).then(res => {
      if (res.ok) {
        const cl = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cl));
      }
      return res;
    }).catch(() => caches.match(BASE+'/index.html'));
    e.respondWith(
      cached.then(r => r || fetched)
    );
  }
});

/* Listen for force-clear message from the app */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'FORCE_CLEAR_CACHE') {
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))));
  }
});
