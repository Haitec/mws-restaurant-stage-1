'use strict'

var name = 'mws'
var version = name + '-v1-'
var idbVersion = 1
var idbStoreName = 'restaurants'

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
]

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(version + 'assets')
      .then(function (cache) {
        return cache.addAll(assets)
      })
  )
})

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url)

  if (event.request.method !== 'GET') {
    return
  }

  if (requestUrl.origin !== location.origin) {
    if (requestUrl.hostname === location.hostname && requestUrl.pathname.startsWith('/restaurants')) {
      var key = requestUrl.pathname

      event.respondWith(
        IDBGet(key)
          .then(cached => {
            var networked = fetch(event.request)
              .then(fetchedFromNetwork)
              .catch()

            if (cached) {
              return new Response(cached, {
                headers: { 'Content-Type': 'application/json' }
              })
            }
            return networked

            function fetchedFromNetwork(response) {
              response.clone()
                .json()
                .then(json => {
                  IDBSet(key, JSON.stringify(json))
                  return json
                })

              return response
            }
          })
      )
    }
    return
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(function (cached) {
        var networked = fetch(event.request)
          .then(fetchedFromNetwork)

        return cached || networked

        function fetchedFromNetwork(response) {
          var cacheCopy = response.clone()

          var fileName = new URL(event.request.url).pathname
          if (!assets.includes(fileName)) {
            caches
              .open(version + 'pages')
              .then(function add(cache) {
                return cache.put(event.request, cacheCopy)
              })
          }

          return response
        }
      })
  )
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.startsWith(name) && !key.startsWith(version)
            })
            .map(function (key) {
              return caches.delete(key)
            })
        )
      })
  )
})

function openIDB() {
  var open = indexedDB.open(name, idbVersion)

  open.onupgradeneeded = function () {
    var db = open.result
    db.createObjectStore(idbStoreName)
  }

  return open
}

function IDBGet(id) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(idbStoreName, 'readonly')
      var store = tx.objectStore(idbStoreName)

      store.get(id).onsuccess = function (req) {
        resolve(req.target.result)
      }

      tx.oncomplete = function () {
        db.close()
      }
    }
    open.onerror = function (error) {
      reject(error)
    }
  })
}

function IDBSet(id, value) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(idbStoreName, 'readwrite')
      var store = tx.objectStore(idbStoreName)

      store.put(value, id).onsuccess = function (req) {
        resolve()
      }

      tx.oncomplete = function () {
        db.close()
      }
    }
    open.onerror = function (error) {
      reject(error)
    }
  })
}