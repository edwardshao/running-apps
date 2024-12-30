const GITHUB_PAGE_PATH = '/running-apps';
const CACHE_CONFIG = {
    prefix: 'RunningCalculator_',
    version: 'v1',
    resources: [
        `${GITHUB_PAGE_PATH}/`,
        `${GITHUB_PAGE_PATH}/index.html`,
        `${GITHUB_PAGE_PATH}/cadence.html`,
        `${GITHUB_PAGE_PATH}/pace.html`,
        `${GITHUB_PAGE_PATH}/css/styles.css`,
        `${GITHUB_PAGE_PATH}/js/cadence.js`,
        `${GITHUB_PAGE_PATH}/js/main.js`,
        `${GITHUB_PAGE_PATH}/img/runner.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-48x48.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-72x72.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-96x96.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-128x128.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-144x144.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-152x152.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-192x192.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-256x256.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-384x384.png`,
        `${GITHUB_PAGE_PATH}/icons/icon-512x512.png`
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

    const requestURL = new URL(event.request.url);
    const relativePath = requestURL.pathname;

    if (!CACHE_CONFIG.resources.includes(relativePath)) return;

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