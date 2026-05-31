const CACHE='oceanjet-command-os-v47-reviewed-20260531';
const CORE=['./','./index.html','./manifest.webmanifest','./oj47-command.css','./oj47-command.js','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE).catch(()=>null)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&/^oceanjet/i.test(k)).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(res=>{try{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}catch(e){}return res;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')).then(r=>r||new Response('OceanJet offline cache unavailable',{status:504,statusText:'Offline'}))));
});
