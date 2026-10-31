/* NullVoid service worker: önce ağ, olmazsa önbellek (çevrimdışı açılış). */
var V = 'nv-v1';
var SHELL = ['./', 'index.html', 'extras.css', 'plus.css', 'news.js', 'extras.js', 'plus.js', 'logo.png', 'favicon.png', 'data/news.json'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  var key = u.origin + u.pathname; /* ?_=zaman damgası önbelleği şişirmesin */
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var c = res.clone(); caches.open(V).then(function (ch) { ch.put(key, c); }); }
    return res;
  }).catch(function () { return caches.match(key).then(function (m) { return m || caches.match('index.html'); }); }));
});
