module.exports = {
  "globDirectory": "public\\",
  "globPatterns": [
    "**/*.{html,ico,json,css,png,jpg,js}",
    "src/images/*.{jpg, png}",
    "src/js/*.js",
  ],
  "swSrc": "public/sw-base.js",
  "swDest": "public/service-worker.js",
  "globIgnores": [
    "..\\workbox-cli-config.js",
    "404.html",
  ]
};
