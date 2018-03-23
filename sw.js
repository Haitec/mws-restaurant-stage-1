'use strict';

var name = 'mws';
var version = name + '-v1-';

var assets = [
  '/',
  'css/styles.css',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(version + 'assets')
      .then(function (cache) {
        return cache.addAll(assets);
      })
      .then(function () {
        console.log('[SW] installed.');
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

        console.log('[SW] fetch ', cached ? '(cached)' : '(network)', event.request.url);
        return cached || networked;

        function fetchedFromNetwork(response) {
          var cacheCopy = response.clone();

          console.log('[SW] fetch response from network.', event.request.url);

          caches
            .open(version + 'pages')
            .then(function add(cache) {
              return cache.put(event.request, cacheCopy);
            })
            .then(function () {
              console.log('[SW] fetch response stored in cache.', event.request.url);
            });

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
      .then(function () {
        console.log('[SW] activated.');
      })
  );
});