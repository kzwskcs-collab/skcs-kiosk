// Service Worker for SKCS KIOSK v3
// Plan G' (2026-04-25): VIDEO_CACHE を v1→v2 に bump、APP_CACHE を v2→v3 に bump
// 旧キャッシュ（kiosk-app-v2, kiosk-videos-v1）は activate 時に自動削除される
const APP_CACHE = 'kiosk-app-v3';
const VIDEO_CACHE = 'kiosk-videos-v2';

const APP_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache =>
      cache.addAll(APP_ASSETS).catch(err => console.log('[SW] Install error:', err))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== APP_CACHE && k !== VIDEO_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // MP4動画 → キャッシュ優先（オフライン再生のため）
  if (url.pathname.endsWith('.mp4')) {
    event.respondWith(cacheFirstVideo(event.request));
    return;
  }

  // Notion/VdoCipher API → ネットのみ
  if (url.hostname.includes('notion') || url.hostname.includes('vdocipher') || url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  // アプリ本体 → ネット優先（常に最新版を取得・オフライン時はキャッシュ）
  event.respondWith(networkFirstApp(event.request));
});

// ネット優先（アプリ本体用）→ 常に最新版を使用
async function networkFirstApp(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || cache.match('/index.html') || new Response('Offline', { status: 503 });
  }
}

// キャッシュ優先（MP4動画用）
async function cacheFirstVideo(request) {
  const cache = await caches.open(VIDEO_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Video not cached', { status: 503 });
  }
}

// ネットのみ
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 動画プリキャッシュ
self.addEventListener('message', event => {
  if (event.data.type === 'PRECACHE_VIDEOS') {
    const urls = event.data.urls || [];
    precacheVideos(urls).then(() => {
      event.source.postMessage({ type: 'PRECACHE_DONE', count: urls.length });
    });
  }
});

async function precacheVideos(urls) {
  const cache = await caches.open(VIDEO_CACHE);
  for (const url of urls) {
    const existing = await cache.match(url);
    if (!existing) {
      try {
        const response = await fetch(url);
        if (response.ok && response.status === 200) await cache.put(url, response);
      } catch (err) {
        console.log('[SW] Precache failed:', url, err);
      }
    }
  }
}
