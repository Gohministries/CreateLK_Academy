const CACHE_NAME = "createlk-academy-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json"
];


/* =========================
INSTALL
========================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())

  );

});


/* =========================
ACTIVATE
========================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))

        );

      })
      .then(() => self.clients.claim())

  );

});


/* =========================
FETCH
========================= */

self.addEventListener("fetch", event => {

  /*
   * Only handle GET requests.
   */
  if(event.request.method !== "GET"){
    return;
  }

  /*
   * Don't interfere with API,
   * login, payment or external requests.
   */
  const url = new URL(event.request.url);

  if(url.origin !== self.location.origin){
    return;
  }

  /*
   * Navigation requests:
   * Network first, then cached page.
   */
  if(event.request.mode === "navigate"){

    event.respondWith(

      fetch(event.request)
        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, copy));

          return response;

        })
        .catch(() => {

          return caches.match("/index.html");

        })

    );

    return;
  }


  /*
   * Other local files:
   * Cache first, then network.
   */
  event.respondWith(

    caches.match(event.request)
      .then(cached => {

        if(cached){
          return cached;
        }

        return fetch(event.request)
          .then(response => {

            if(
              response &&
              response.status === 200 &&
              response.type === "basic"
            ){

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache =>
                  cache.put(event.request, copy)
                );

            }

            return response;

          });

      })

  );

});