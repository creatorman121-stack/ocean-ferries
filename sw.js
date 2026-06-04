const CACHE_NAME = 'oceanjet-portdesk-v95-online-systems';
const ASSETS = ['./', './index.html', './styles.css', './data.js', './online_config.js', './online-config.json', './app.js', './manifest.webmanifest', './v92_safe_baggage_qa_addon.js', './v95_online_modules.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/online-config.json')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request, {ignoreSearch:true}).then(hit => hit || caches.match('./online-config.json'))));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request, {ignoreSearch:true}).then(hit => hit || caches.match('./index.html'))));
});
