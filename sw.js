'use strict';

var name = 'mws';
var version = name + '-v1-';

var assets = [
  '/',
  '/css/styles.css',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(version + 'assets')
      .then(function (cache) {
        return cache.addAll(assets);
      })
  );
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET' || requestUrl.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(function (cached) {
        var networked = fetch(event.request)
          .then(fetchedFromNetwork);

        return cached || networked;

        function fetchedFromNetwork(response) {
          var cacheCopy = response.clone();

          var fileName = new URL(event.request.url).pathname;
          if (!assets.includes(fileName)) {
            caches
              .open(version + 'pages')
              .then(function add(cache) {
                return cache.put(event.request, cacheCopy);
              });
          }

          return response;
        }
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.startsWith(name) && !key.startsWith(version);
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
  );
});