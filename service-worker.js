const CACHE_CONFIG = {
    prefix: 'RunningCalculator_',
    version: 'v1',
    resources: [
        '/',
        '/index.html',
        '/cadence.html',
        '/pace.html',
        '/css/styles.css',
        '/js/cadence.js',
        '/js/main.js',
        '/img/runner.png'
    ]
};

const CACHE_NAME = CACHE_CONFIG.prefix + CACHE_CONFIG.version;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log(`Cache ${CACHE_NAME} being installed`);
                return cache.addAll(CACHE_CONFIG.resources);
            })
            .catch(error => console.error('Cache installation failed:', error))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith(CACHE_CONFIG.prefix) && cacheName !== CACHE_NAME) {
                        console.log(`Deleting cache ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            ))
    );
});

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin) ||
        event.request.method !== 'GET') {
        return;
    }

    const isResourceCached = CACHE_CONFIG.resources.some(
        resource => event.request.url.includes(resource)
    );

    if (!isResourceCached) return;

    event.respondWith(
        caches.open(CACHE_NAME)
            .then(cache =>
                cache.match(event.request)
                    .then(cachedResponse => {
                        const fetchPromise = fetch(event.request)
                            .then(networkResponse => {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });

                        // Return cached response immediately if available, otherwise wait for network
                        return cachedResponse || fetchPromise;
                    })
            )
    );
});