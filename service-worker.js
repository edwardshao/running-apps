const APP_PREFIX = 'RunningCalculator_';
const VERSION = 'v1';
const CACHE_NAME = APP_PREFIX + VERSION;

const urlsToCache = [
    '/index.html',
    '/cadence.html',
    '/pace.html',
    '/css/styles.css',
    '/js/cadence.js',
    '/img/runner.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('Installing cache : ', CACHE_NAME);
            return cache.addAll(urlsToCache)
        })
    )
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting cache : ', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    console.log('Fetch event for ', e.request.url, ' mode: ', e.request.mode);
    if (urlsToCache.some(url => e.request.url.includes(url))) {
        e.respondWith(caches.open(CACHE_NAME).then((cache) => {
            console.log('Fetching from network first');
            return fetch(e.request.url).then((fetchedResponse) => {
                console.log('Putting in cache');
                cache.put(e.request, fetchedResponse.clone());

                return fetchedResponse;
            }).catch(() => {
                console.log('Network unavailable: fetching from cache');
                return cache.match(e.request.url);
            });
        }));
    } else {
        return;
    }
}
);