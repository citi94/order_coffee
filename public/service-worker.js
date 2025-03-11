/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    self.clients.claim();
  });
  
  // The precache manifest will be injected here during the build process
  self.__WB_MANIFEST;
  
  // Cache the app shell and static assets
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return caches.match('/index.html');
        })
      );
    } else if (
      event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.destination === 'image'
    ) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise, fetch from network and cache
          return fetch(event.request).then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response to use one for cache and one for browser
            const responseToCache = response.clone();
            
            caches.open('v1').then((cache) => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          });
        })
      );
    }
  });
  
  // Listen for push notifications
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Middle Street Coffee', options)
    );
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  });