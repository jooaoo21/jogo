// Service worker: guarda tudo em cache para o jogo funcionar offline.
// Ao atualizar o jogo, muda a versão abaixo para os telemóveis receberem a novidade.
const CACHE = 'jogo-desejo-v13';
const FILES = [
  './', './index.html', './jogo.enc', './manifest.webmanifest',
  './v2-icon-192.png', './v2-icon-512.png',
  './v2-icon-maskable-512.png', './v2-apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // licencas.json: tenta sempre a rede (para códigos novos funcionarem), cache só se estiver offline
  if (new URL(e.request.url).pathname.endsWith('/licencas.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(r => { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => h || Response.error()))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).catch(() =>
        e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
      );
    })
  );
});
