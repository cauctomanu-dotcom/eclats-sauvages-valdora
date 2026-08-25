const VERSION = 'v118-pwa-10';
const SHELL_CACHE = `valdora-shell-${VERSION}`;
const ASSET_CACHE = `valdora-assets-${VERSION}`;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa.js?v=118-pwa-6',
  './VALDORA_SAVE_V118.js?v=118-save-3',
  './VALDORA_MOBILE_UI_V118.js?v=118-mobile-5',
  './VALDORA_MOBILE_AUDIO_V118.js?v=118-mobile-audio-1',
  './assets/audio/valdora_mobile_theme_v118.wav?v=118-theme-1',
  './assets/orbes/orbe_eclat_v105u.png',
  './assets/title_valdora_v106r.png',
  './V109V_INTERIEUR_REWRITE.js?v=118-stable-1',
  './V109W_CORRECTIFS_GAMEPLAY.js?v=118-clean-1',
  './VALDORA_STABLE_V110.js',
  './VALDORA_PRO_V111.js?v=118-clean-1',
  './VALDORA_BIOMES_V112.js?v=115-base-2',
  './VALDORA_POLISH_V113.js?v=114-final',
  './VALDORA_ROUTES_BIOMES_V114.js?v=115-base-2',
  './VALDORA_BIOMES_AUDIO_V115.js?v=118-audio-2',
  './VALDORA_SANCTUARIES_V117.js?v=117-stable-1',
  './VALDORA_LIVING_WORLD_V118.js?v=118-living-14'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('valdora-') && ![SHELL_CACHE, ASSET_CACHE].includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return (await caches.match(request)) || caches.match('./index.html');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === 'video') return;
  if (request.destination === 'audio') {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
