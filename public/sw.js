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
        },
      );
    }),
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
        }),
      );
    }),
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
          // Network failed - try cached version of the requested page
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Page not cached - PRIMARY FALLBACK: use static fallback HTML
            // This works even on first visit with no internet
            return caches.match(OFFLINE_FALLBACK).then((fallback) => {
              if (fallback) {
                return fallback;
              }

              // SECONDARY FALLBACK: try cached offline React page
              return caches.match(OFFLINE_PAGE).then((offlinePage) => {
                if (offlinePage) {
                  return offlinePage;
                }

                // LAST RESORT: return minimal HTML response
                return new Response(
                  "<!DOCTYPE html><html><head><title>Offline</title><meta name='viewport' content='width=device-width, initial-scale=1'></head><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f3f4f6'><div style='text-align:center;max-width:500px;padding:20px'><h1>No Connection</h1><p>Please check your internet connection and refresh.</p><button onclick='location.reload()' style='padding:10px 20px;margin-top:20px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px'>Try Again</button></div></body></html>",
                  {
                    headers: {
                      "Content-Type": "text/html",
                    },
                    status: 503,
                  },
                );
              });
            });
          });
        }),
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
      }),
    );
  }
});
