// ===== SERVICE WORKER - UMKM Mudah PWA =====
var CACHE_NAME = 'umkm-mudah-v2.1.0';
var ASSETS_TO_CACHE = [
    './',
    './index.html',
    './login.html',
    './style.css',
    './script.js',
    './auth.js',
    './calculator.js',
    './finance.js',
    './invoice.js',
    './stock.js',
    './confirm-logout.js',
    './chart-dashboard.js',
    './search-feature.js',
    './logo.png'
];

// Install - cache assets
self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[SW] Caching app assets');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(name) {
                    return name !== CACHE_NAME;
                }).map(function(name) {
                    console.log('[SW] Deleting old cache:', name);
                    return caches.delete(name);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', function(event) {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase/external API requests
    var url = event.request.url;
    if (url.indexOf('firebasestorage') !== -1 ||
        url.indexOf('googleapis.com') !== -1 ||
        url.indexOf('gstatic.com') !== -1 ||
        url.indexOf('firebaseapp.com') !== -1 ||
        url.indexOf('discord.com') !== -1) {
        return;
    }

    event.respondWith(
        fetch(event.request).then(function(response) {
            // Cache successful responses
            if (response && response.status === 200) {
                var responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        }).catch(function() {
            // Fallback to cache when offline
            return caches.match(event.request).then(function(cachedResponse) {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // For navigation requests, return index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});