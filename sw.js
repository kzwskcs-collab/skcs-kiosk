// Service Worker for SKCS KIOSK
// オフラインキャッシュ・動画プリキャッシュ

const APP_CACHE = 'kiosk-app-v1';
const VIDEO_CACHE = 'kiosk-videos-v1';

// アプリ本体のキャッシュ対象
const APP_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ========== インストール：アプリ本体をキャッシュ ==========
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => {
      return cache.addAll(APP_ASSETS).catch(err => {
        console.log('[SW] Install cache error (非致命的):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ========== アクティベート：古いキャッシュを削除 ==========
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== APP_CACHE && k !== VIDEO_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ========== フェッチ：キャッシュ優先戦略 ==========
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 動画ファイル（mp4）→ キャッシュ優先、なければネット取得してキャッシュ
  if (url.pathname.endsWith('.mp4') || url.searchParams.has('video')) {
    event.respondWith(cacheFirstVideo(event.request));
    return;
  }

  // Notion API → ネット優先（オフライン時はスキップ）
  if (url.hostname.includes('notion.so') || url.hostname.includes('api.notion.com')) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  // アプリ本体 → キャッシュ優先
  event.respondWith(cacheFirstApp(event.request));
});

// キャッシュ優先（動画用）
async function cacheFirstVideo(request) {
  const cache = await caches.open(VIDEO_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    console.log('[SW] Video from cache:', request.url);
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      // 動画のみキャッシュ（容量節約のためRangeレスポンスは除く）
      const responseToCache = response.clone();
      if (response.status === 200) {
        cache.put(request, responseToCache);
        console.log('[SW] Video cached:', request.url);
      }
    }
    return response;
  } catch (err) {
    console.log('[SW] Video fetch failed:', err);
    return new Response('Offline - video not cached', { status: 503 });
  }
}

// キャッシュ優先（アプリ本体用）
async function cacheFirstApp(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // オフライン時はindex.htmlにフォールバック
    const fallback = await cache.match('/index.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

// ネットのみ（API用）
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ========== バックグラウンド動画プリキャッシュ ==========
// メインアプリから動画URLリストを受け取って事前ダウンロード
self.addEventListener('message', event => {
  if (event.data.type === 'PRECACHE_VIDEOS') {
    const urls = event.data.urls || [];
    console.log('[SW] Precaching', urls.length, 'videos...');
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
        if (response.ok && response.status === 200) {
          await cache.put(url, response);
          console.log('[SW] Precached:', url);
        }
      } catch (err) {
        console.log('[SW] Precache failed:', url, err);
      }
    }
  }
}
