'use strict'

var name = 'mws'
var version = name + '-v1-'
var idbVersion = 1
var tmpReviewsName = 'tmpReviews'
var idbStoreNames = ['restaurants', 'reviews', tmpReviewsName]

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

self.addEventListener('load', function () {
  self.addEventListener('online', flushQueue)
})

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

  if (requestUrl.hostname !== location.hostname) {
    return
  }

  // Same hostname

  var path = requestUrl.pathname.split('/')[1]

  if (event.request.method === 'POST') {

    var request = event.request.clone()
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return request
            .clone()
            .json()
            .then(review => {
              review.createdAt = Date.now()
              review.updatedAt = review.createdAt
              var json = JSON.stringify(review)
              var response = new Response(json, {
                headers: { 'Content-Type': 'application/json' }
              })
              return enqueue(request)
                .then(function () {
                  return response
                })
            })
        })
    )
    return
  }

  if (event.request.method !== 'GET') {
    return
  }

  if (idbStoreNames.includes(path)) {
    var key = requestUrl.pathname + requestUrl.search
    var store = path
    event.respondWith(
      cacheIn(store, key, event)
    )
  }

  if (requestUrl.origin !== location.origin) {
    return
  }

  // Same origin

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

/***********
 * Helpers *
 ***********/

function enqueue(request) {
  return serialize(request)
    .then(function (serialized) {
      IDBSet(tmpReviewsName, Date.now(), serialized)
    })
}

function flushQueue() {
  return IDBGetAllKeys(tmpReviewsName)
    .then(function (queue) {
      queue = queue || []

      if (!queue.length) {
        return Promise.resolve()
      }

      // Else, send the requests in order...
      return sendInOrder(queue)
    })
}

// https://github.com/mozilla/serviceworker-cookbook/tree/master/request-deferrer

// Send the requests inside the queue in order. Waiting for the current before
// sending the next one.
function sendInOrder(requests) {
  // The `reduce()` chains one promise per serialized request, not allowing to
  // progress to the next one until completing the current.
  var sending = requests.reduce(function (prevPromise, requestKey) {
    return IDBGet(tmpReviewsName, requestKey)
      .then(function (serialized) {
        return prevPromise.then(function () {
          return deserialize(serialized)
            .then(function (request) {
              return fetch(request)
                .then(function () {
                  IDBDelete(tmpReviewsName, requestKey)
                })
            })
        })
      })
  }, Promise.resolve())
  return sending
}

// Serialize is a little bit convolved due to headers is not a simple object.
function serialize(request) {
  var headers = {}
  // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
  // notation as well and this is the only way of retrieving all the headers.
  for (var entry of request.headers.entries()) {
    headers[entry[0]] = entry[1]
  }
  var serialized = {
    url: request.url,
    headers: headers,
    method: request.method,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  }

  // Only if method is not `GET` or `HEAD` is the request allowed to have body.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return request.clone().text().then(function (body) {
      serialized.body = body
      return Promise.resolve(serialized)
    })
  }
  return Promise.resolve(serialized)
}

// Compared, deserialize is pretty simple.
function deserialize(data) {
  return Promise.resolve(new Request(data.url, data))
}

/*************
 * IndexedDB *
 *************/

function openIDB() {
  var open = indexedDB.open(name, idbVersion)

  open.onupgradeneeded = function () {
    var db = open.result
    idbStoreNames.forEach(function (store) {
      db.createObjectStore(store)
    })
  }

  return open
}

function IDBGet(storeName, id) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(storeName, 'readonly')
      var store = tx.objectStore(storeName)

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

function IDBGetAllKeys(storeName) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(storeName, 'readonly')
      var store = tx.objectStore(storeName)

      store.getAllKeys().onsuccess = function (req) {
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

function IDBGetAll(storeName) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(storeName, 'readonly')
      var store = tx.objectStore(storeName)

      store.getAll().onsuccess = function (req) {
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

function IDBSet(storeName, id, value) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(storeName, 'readwrite')
      var store = tx.objectStore(storeName)

      store.put(value, id).onsuccess = function (req) {
        resolve(value)
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

function IDBDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    var open = openIDB()
    open.onsuccess = function () {
      var db = open.result
      var tx = db.transaction(storeName, 'readwrite')
      var store = tx.objectStore(storeName)

      store.delete(id).onsuccess = function (req) {
        resolve(req)
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

function cacheIn(storeName, key, event) {
  return IDBGet(storeName, key)
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
            IDBSet(storeName, key, JSON.stringify(json))
            return json
          })

        return response
      }
    })
}