const CACHE='oceanjet-v46-reviewed-ar-real-pdf';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(resp=>{
    try{const copy=resp.clone();if(new URL(event.request.url).origin===self.location.origin)caches.open(CACHE).then(c=>c.put(event.request,copy));}catch(e){}
    return resp;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')).then(r=>r||new Response('<!doctype html><title>OceanJet Offline</title><body style="font-family:sans-serif;background:#030816;color:white;padding:24px"><h1>OceanJet Offline</h1><p>The app is offline and no cached page is available yet.</p></body>',{headers:{'Content-Type':'text/html'}}))));
});
