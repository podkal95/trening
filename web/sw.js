/* Offline support: app shell cached; the page itself is network-first so updates arrive. */
const V = 'trening-3.16';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CDN = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const cacheFirst = req => caches.match(req).then(r => r || fetch(req).then(n => {
  if (n && (n.ok || n.type === 'opaque')) { const c = n.clone(); caches.open(V).then(x => x.put(req, c)); }
  return n;
}));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html')) {
      e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('./index.html', c)); return r; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(cacheFirst(req));
    return;
  }
  if (CDN.includes(u.hostname)) e.respondWith(cacheFirst(req));
});
