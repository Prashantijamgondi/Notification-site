self.addEventListener('push', function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = {
      title: 'New notification',
      body: event.data ? event.data.text() : 'You have a new update.',
    };
  }

  const title = data.title || 'Appointment update';
  const options = {
    body: data.body || 'There is an update for your appointment.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    data: {
      url: data.url || '/',
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});


//commit