// ============================================================
// Service Worker - Data Santri Qiraati Surabaya
// ============================================================
const CACHE_NAME = 'qiraati-sby-v1';
const STATIC_ASSETS = [
    '/datasantri/',
    '/datasantri/index.html',
    '/datasantri/manifest.json'
];

// Install: cache file utama
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network first, fallback ke cache
self.addEventListener('fetch', event => {
    // Skip non-GET dan request ke Google Apps Script (selalu ambil live)
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('script.google.com')) return;
    if (event.request.url.includes('cdn.tailwindcss.com')) return;
    if (event.request.url.includes('cdn.jsdelivr.net')) return;
    if (event.request.url.includes('fonts.googleapis.com')) return;
    if (event.request.url.includes('cdnjs.cloudflare.com')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Simpan ke cache jika berhasil
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: coba dari cache
                return caches.match(event.request)
                    .then(cached => cached || caches.match('/datasantri/index.html'));
            })
    );
});
