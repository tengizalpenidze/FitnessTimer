const CACHE_NAME = 'just-hiit-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Handle background timer messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TIMER_TICK') {
    // Keep the service worker alive during timer operation
    event.waitUntil(
      self.registration.showNotification('HIIT Timer', {
        body: event.data.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        silent: true,
        actions: [
          {
            action: 'stop',
            title: 'Stop Timer'
          }
        ]
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'stop') {
    // Send message back to main thread to stop timer
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'STOP_TIMER' });
        });
      })
    );
  } else {
    // Focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients.length > 0) {
          return clients[0].focus();
        }
        return self.clients.openWindow('/');
      })
    );
  }
});
