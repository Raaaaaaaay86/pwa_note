
var CACHE_STATIC_NAME = 'static-v2';
var CACHE_DYNAMIC_NAME = 'dynamic-v1';
const url = 'https://httpbin.org/ip';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/css/app.css',
  '/src/css/main.css',
  '/src/js/main.js',
  '/src/js/material.min.js',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        cache.addAll(STATIC_FILES);
      })
  )
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME) {
            return caches.delete(key);
          }
        }));
      })
  );
});

// Helper Function 驗證
const isInArray = (string, array) => {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    if (element === string) return true;
  }
  return false;
}

self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf(url) > -1 ) {
    event.respondWith( // Network Only ##
      caches.open(CACHE_DYNAMIC_NAME)
        .then(async (cache) => {
          const response = await fetch(event.request);
          cache.put(event.request.url, response.clone());
          return response;
        })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith( // Cache Only ##
      caches.match(event.request)
    );
  } else {
    event.respondWith( // Cache fallback Network ##
      caches.match(event.request)
        .then(async (existedCache) => {
          if (existedCache) return existedCache;

          try {
            const response = await fetch(event.request);
            const cache = await caches.open(CACHE_DYNAMIC_NAME);
            cache.put(event.request.url, response.clone());
            return response;
          } catch (error) {
            const routingCache = await caches.open(CACHE_STATIC_NAME);
            return routingCache.match('/index.html');
          }
        })
    )
  }
});

// Network fallback to Cache 必須要等網路Timeout 才可以取用cache
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(async (response) => {
//         const cache = await caches.open(CACHE_DYNAMIC_NAME); // fetch 到資料同時也存進Cache
//         cache.put(event.request.url, response.clone());
//         return response;
//       })
//       .catch(() => caches.match(event.request))
//   );
// });

// Cache Only##
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network Only##
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then((response) => response)
//   );
// });

// Cache fallback Network##
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request) // 查詢 Cache 是否存在
//       .then(async (existedCache) => {
//         if (existedCache) existedCache; // 是，優先取用 Cache

//         try { // 否，則 fetch
//           const response = await fetch(event.request);
//           const cache = await caches.open(CACHE_DYNAMIC_NAME);
//           cache.put(event.request.url, response.clone()); // 同時將 fetch 到的資料寫進 Cache
//           return response; // 記得 return fetch 結果
//         } catch (error) { // 若 fetch 失敗則 reutrn 靜態 cache 中的網頁。
//           const routingcache = await caches.open(CACHE_STATIC_NAME);
//           return routingcache.match('/offline.html');
//         }
//       })
//   );
// });