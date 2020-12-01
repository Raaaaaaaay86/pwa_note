importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'google-fonts',
    cacheExpiration: {
      maxEntries: 5,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  })
);

workboxSW.router.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'material-css',
  })
);

workboxSW.router.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  workboxSW.strategies.staleWhileRevalidate({
    cacheName: 'posts-image',
  })
);

workboxSW.router.registerRoute(
  'https://pwapractice-177e2.firebaseio.com/posts.json',
  async (args) => {
    const response = await fetch(args.event.request);
    const resJSON = await response.clone().json();
    await clearAllData('posts');
    for (let key in resJSON) {
      writeData('posts', resJSON[key]);
    }
    return response;
  }
);

workboxSW.router.registerRoute(
  (routeData) => {
    return (routeData.event.request.headers.get('accept').includes('text/html'))
  },
  async (args) => {
    const existCache = await caches.match(args.event.request);
    if (existCache) return existCache;

    try {
      const response = await fetch(args.event.request)
      const cache = await caches.open('dynamic');
      cache.put(args.event.request.url, response.clone());
      return response;
    } catch (error) {
      return (await caches.match('/offline.html'))
    }
  }
);


self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');

    event.waitUntil(
      readAllData('sync-posts')
        .then(async (data) => {
          for (let dt of data) {
            const postData = new FormData();
            postData.append('id', dt.id);
            postData.append('title', dt.title);
            postData.append('location', dt.location);
            postData.append('rawLocationLat', dt.rawLocation.lat);
            postData.append('rawLocationLng', dt.rawLocation.lng);
            postData.append('file', dt.picture, `${dt.id}.png`);

            try {
              const response = await fetch('https://us-central1-pwapractice-177e2.cloudfunctions.net/storePostData', {
                method: 'POST',
                body: postData,
              });

              console.log('sent data:', response);
              if (response.ok) deleteItemFromData('sync-posts', (await response.json()).id );
            } catch (error) {
              console.log('Error while sending post', error);
            }
          }
        })
    )
  }
});

self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const action = event.action;
  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then((clientList) => {
          const client = clientList.find((c) => {
            return c.visibilityState === 'visible';
          });

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed', event);
});

self.addEventListener('push', function(event) {
  console.log('Push Notification received', event);

  let data = {title: 'New!', content: 'Something new happened!', openUrl: '/'};

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});


workboxSW.precache([]); // static cache
