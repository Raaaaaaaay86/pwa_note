const CACHE_STATIC_NAME = 'static-v1.0.2';
const CACHE_DYNAMIC_NAME = 'dynamic-v1.0.2';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', event);

  event.waitUntil( // 在 Promise 完成之前，install 不會完成
    caches.open(CACHE_STATIC_NAME) // 安裝新 SW 時，會先將需要預先存取的檔案存取於Cache Storage
    .then((cache) => {
      console.log('[Service Worker] Pre-caching App Shell...')
      cache.addAll([ // 在 Cache Storage 中加入以下指定的檔案路徑及 URL 的 Response
        '/',
        '/index.html',
        '/src/css/app.css',
        '/src/css/main.css',
        '/src/js/main.js',
        '/src/js/material.min.js',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', event);

  event.waitUntil( // 在 Promise 完成之前，activate 不會完成
    caches.keys() // 列出所有在當前網域的 Cache Storage Keys
      .then((keyList) => { // 如果 key 的版本名稱不等於當前的 CACHE_STATIC_NAME 和 CACHE_DYNAMIC_NAME，則映射( map )成 caches.delete(key) 返回 Pomise
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing Old Cache...');
            return caches.delete(key);
          }
        }))
      })
  )
})

// Cache 儲存方式
// { request(key): response(value) }

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request) // 檢查是否有已經緩存的請求(key)
      .then((response) => {
        if (response) return response; // true, 直接返回 Cache Storage 中儲存的資料
        return fetch(event.request) // false, SW 執行 fetch API 取得所需資料
          .then((res) => {
            return caches.open(CACHE_DYNAMIC_NAME)
              .then((cache) => {
                cache.put(event.request.url, res); // 取得後，將 response 儲存於 Cache Storage
                return res; // 存取於 Cache Storage 後，同時也返回給當前網頁，滿足使用者瀏覽需求
              })
          })
          .catch((err) => console.log(err));
      })
  )
});