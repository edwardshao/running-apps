// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('ServiceWorker registered successfully:', registration.scope);
        })
        .catch(error => {
            console.error('ServiceWorker registration failed:', error);
        });
}

// IFrame height adjustment
const adjustIframeHeight = (event) => {
    const iframe = document.getElementById('contentFrame');
    if (iframe && event.data && typeof event.data.height === 'number') {
        iframe.style.height = `${Math.max(400, event.data.height)}px`;
    }
};

window.addEventListener('message', adjustIframeHeight);
