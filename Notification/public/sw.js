importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v22';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })
// }

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function (cache) {
        console.log('[Service Worker] Precaching App Shell');
        cache.addAll(STATIC_FILES);
      })
  )
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function (keyList) {
        return Promise.all(keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    // console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', function (event) {

  var url = 'https://pwapractice-177e2.firebaseio.com/posts';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData('posts', data[key])
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(function (res) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function (cache) {
                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch(function (err) {
                return caches.open(CACHE_STATIC_NAME)
                  .then(function (cache) {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html');
                    }
                  });
              });
          }
        })
    );
  }
});

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing...', event);

  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new post...');

    event.waitUntil(
      readAllData('sync-posts')
        .then((dataList) => {
          dataList.forEach((data) => {
            const { id, title, location } = data;

            fetch('https://us-central1-pwapractice-177e2.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                id,
                title,
                location,
                image: 'https://firebasestorage.googleapis.com/v0/b/pwapractice-177e2.appspot.com/o/2019-08-20.jpg?alt=media&token=dca0cc16-e6fd-4fa7-a061-a2a38a5945f1',
              }),
            })
              .then((res) => {
                console.log('~/sw.js: Sent data', res);
                if (res.ok) {
                  res.json()
                    .then((resData) => {
                      deleteItemFromData('sync-posts', resData.id);
                    })
                }
              })
              .catch((err) => {
                console.log('Error while sending Data', err);
              })
          })
        })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll() // clients.matchAll() 列出所有此 serviceWorker 正在打開的網頁
        .then((clientList) => {
          const client = clientList.find((c)  => c.visibilityState === 'visible'); // 找出第一個正在開啟的(visible)網頁

          if (client !== undefined) { // 如果有找到則將當前網頁導向指定網址
            client.navigate(notification.data.url);
            client.focus();
          } else { // 若都沒有網頁開啟則幫使用者打開一個新的視窗或分頁，並導向指定網址
            clients.openWindow(notification.data.url);
          }
          notification.close(); // 結束，關閉通知
        })
    );
  }
});

// notificationclose 事件對於網站分析相當重要，可以了解使用者關閉的 timestamp 或是統計何種推播通知會被忽略。
self.addEventListener('notificationclose', (event) => {
  console.log('Notification was closed', event);
});

self.addEventListener('push', (event) => { // 監聽從 server push 過來的通知訊息
  console.log('Push Notification Recived', event);

  let data = { // Server 回傳的 Data 範例
    title: '',
    content: '',
    url: '/',
  };


  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl,
    },
  }

  console.log('options', options)
  event.waitUntil(
    self.registration.showNotification(data.title, options) // 由 serviceWorker 推播的通知
  )
});
