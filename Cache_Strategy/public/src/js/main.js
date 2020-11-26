
var box = document.querySelector('.box');
var button = document.querySelector('button');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function() {
      console.log('Registered Service Worker!');
    });
}

button.addEventListener('click', function(event) {
  if (box.classList.contains('visible')) {
    box.classList.remove('visible');
  } else {
    box.classList.add('visible');
  }
});

const url = 'https://httpbin.org/ip';
let networkResponseRecived = false;

fetch('https://httpbin.org/ip')
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log(data.origin, 'From Network', data);
    networkResponseRecived = true;
    box.style.height = (data.origin.substr(0, 2) * 5) + 'px';
  });

if ('caches' in window) {
  caches.match(url)
    .then((response) => {
      if (response) return response.json();
    })
    .then((data) => {
      console.log('From Cache', data);
      if (!networkResponseRecived) {
        box.style.height = (data.origin.substr(0, 2) * 20) + 'px';
      }
    })
}
//ok 1) Identify the strategy we currently use in the Service Worker (for caching)
//ok 2) Replace it with a "Network only" strategy => Clear Storage (in Dev Tools), reload & try using your app offline
//ok 3) Replace it with a "Cache only" strategy => Clear Storage (in Dev Tools), reload & try using your app offline
//ok 4) Replace it with "Network, cache fallback" strategy =>  => Clear Storage (in Dev Tools), reload & try using your app offline
// 5) Replace it with a "Cache, then network" strategy => Clear Storage (in Dev Tools), reload & try using your app offline
// 6) Add "Routing"/ URL Parsing to pick the right strategies: Try to implement "Cache, then network", "Cache with network fallback" and "Cache only" (all of these, with appropriate URL selection)

// Important: Clear your Application Storage first to get rid of the old SW & Cache from the Main Course Project!