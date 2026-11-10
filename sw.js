/* Ledger — offline helper (V4.27). Upload next to index.html.
   Page: network first, so a new upload always wins; the saved copy is only used
   when there is no connection. Libraries (pinned versions on CDNs): saved copy first.
   Everything else — sign-in, cloud sync, exchange rates — is left alone. */
const CACHE = 'ledger-shell-v1';
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/', 'https://www.gstatic.com/firebasejs/'];

self.addEventListener('install', ()=> self.skipWaiting());
self.addEventListener('activate', e=> e.waitUntil(
  caches.keys().then(keys=> Promise.all(keys.filter(k=> k !== CACHE && k.startsWith('ledger-shell-')).map(k=> caches.delete(k))))
    .then(()=> self.clients.claim())));

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = url.origin === self.location.origin && (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  if(isPage){
    e.respondWith(
      fetch(req).then(res=>{
        if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=> c.put('page', copy)); }
        return res;
      }).catch(()=> caches.open(CACHE).then(c=> c.match('page')).then(hit=> hit || Response.error())));
    return;
  }
  if(LIBS.some(p=> req.url.startsWith(p))){
    e.respondWith(caches.open(CACHE).then(c=> c.match(req.url).then(hit=> hit || fetch(req).then(res=>{
      if(res && (res.ok || res.type === 'opaque')) c.put(req.url, res.clone());
      return res;
    }))));
  }
});
