// Service Worker for offline support
const CACHE_NAME = "nlwc-gallery-v1";
const OFFLINE_PAGE = "/offline";
const OFFLINE_FALLBACK = "/offline-fallback.html";

// Files to cache on install
const CACHE_FILES = [
  "/",
  "/offline",
  "/offline-fallback.html",
  "/about",
  "/contact",
  "/gallery",
  "/sermons",
  "/devotionals",
];

// Install event - cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to cache all files, but don't fail if some don't exist yet
      return Promise.allSettled(CACHE_FILES.map((url) => cache.add(url))).catch(
        (err) => {
          console.warn("Cache installation partial failure:", err);
        }
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle both online and offline scenarios
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const { destination, url } = event.request;
  const isNavigation =
    destination === "" || destination === "document" || destination === "frame";

  // Handle navigation requests (page loads)
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - try cached version
          return caches
            .match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }

              // No cached version - try cached offline page
              return caches
                .match(OFFLINE_PAGE)
                .then((offlinePage) => {
                  if (offlinePage) {
                    return offlinePage;
                  }

                  // Last resort - use static fallback
                  return caches
                    .match(OFFLINE_FALLBACK)
                    .then((fallback) => {
                      if (fallback) {
                        return fallback;
                      }

                      // Return a custom offline response
                      return new Response(
                        "<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>No Connection</h1><p>Please check your internet connection and refresh.</p></body></html>",
                        {
                          headers: {
                            "Content-Type": "text/html",
                          },
                          status: 503,
                        }
                      );
                    });
                });
            });
        })
    );
  } else {
    // For other resources (CSS, JS, images, etc.), try cache first, then network
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Cache successful responses for future use
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Return a blank response for failed resource requests
            // (images, stylesheets, etc.)
            return new Response("", { status: 204 });
          });
      })
    );
  }
});
