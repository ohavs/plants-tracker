// Firebase Cloud Messaging background service worker
// Config is injected at build time via public/__env.js
importScripts('/__env.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

try {
  firebase.initializeApp(self.__FIREBASE_CONFIG__);
  const messaging = firebase.messaging();

  // Called when a push arrives while the app is in the background or closed
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'הגיע הזמן להשקות! 💧';
    const body  = payload.notification?.body  || payload.data?.body  || 'הצמחים שלך מחכים להשקיה';
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url: payload.data?.url || '/' },
    });
  });
} catch (e) {
  console.error('[firebase-messaging-sw] init error:', e);
}

// Open / focus the app when the user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
