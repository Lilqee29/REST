
self.addEventListener('install', () => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event.data);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notificationData } = data;

    const options = {
      body: body || 'Une nouvelle notification',
      icon: icon || '/logo.png',
      badge: badge || '/logo-small.png',
      tag: tag || 'notification',
      requireInteraction: true, // Keep notification visible
      actions: [
        {
          action: 'view-order',
          title: 'Voir la commande',
          icon: '/icons/view.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/icons/close.png'
        }
      ],
      data: notificationData || {}
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Restaurant Express', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
    event.waitUntil(
      self.registration.showNotification('Restaurant Express', {
        body: event.data.text(),
        icon: '/logo.png'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'view-order' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window to orders page
        if (clients.openWindow) {
          return clients.openWindow('/myorders?notification=true');
        }
      })
    );
  }
});
