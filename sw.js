const CACHE = 'nocturne-v9-encounters';
const LOCAL = ['./','./index.html','./styles.css','./src/game.js','./src/encounter.js','./src/premium-graphics.js','./src/city-v4.js','./src/vehicles.js','./src/hero.js','./src/actors.js','./assets/models/soldier.glb','./assets/models/cesium-man.glb','./assets/premium-ui.css','./assets/icon.svg','./manifest.webmanifest'];
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
const CDN_PREFIX='https://cdn.jsdelivr.net/npm/three@0.164.1/';
const CDN_ASSETS=[
  THREE_CDN,
  CDN_PREFIX+'examples/jsm/loaders/GLTFLoader.js',
  CDN_PREFIX+'examples/jsm/utils/SkeletonUtils.js',
  CDN_PREFIX+'examples/jsm/utils/BufferGeometryUtils.js'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(LOCAL);
      // Cache the 3D engine when possible, without blocking PWA installation offline.
      await Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)));
    })
  );
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.href.startsWith(CDN_PREFIX)) {
    event.respondWith(caches.match(event.request).then(cached => cached ||
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
    ));
    return;
  }
  if (url.origin !== location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
