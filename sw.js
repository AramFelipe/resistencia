/* Troque a versão a cada atualização do index.html para os celulares baixarem a nova. */
const VERSAO = 'resistencia-v8';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

/* cache:'reload' na instalação: sem isso o navegador pode entregar a cópia antiga
   que o GitHub Pages deixa guardada por 10 minutos (max-age=600). */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c =>
    c.addAll(ARQUIVOS.map(u => new Request(u, {cache: 'reload'})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))));
  self.clients.claim();
});

/* Rede primeiro, sempre conferindo com o servidor (cache:'no-cache' revalida em vez de
   usar a cópia de 10 minutos do navegador). Sem internet, usa o que está guardado. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const mesmoSite = new URL(e.request.url).origin === self.location.origin;
  const req = mesmoSite ? new Request(e.request, {cache: 'no-cache'}) : e.request;
  e.respondWith(
    fetch(req).then(r => {
      const copia = r.clone();
      caches.open(VERSAO).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
