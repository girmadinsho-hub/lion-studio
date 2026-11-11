/* ==========================================
   LION STUDIO — sw.js
   ⚠️ RITUAL LAW: every deploy = version +1
   ========================================== */
var CACHE_NAME = 'lion-studio-v2';
var ASSETS = [
  './',
  './index.html',
  './app.js',
  './auth.js',
  './studio.js',
  './config.js',
  './manifest.json',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){
      return caches.match(e.request, { ignoreSearch: true })
        .then(function(r){ return r || Response.error(); });
    })
  );
});
