/* مِرصد التليمترى — service worker */
var VERSION = "2.00";
var CACHE = "mwri-telemetry-monitor-v" + VERSION;
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./favicon.ico",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).catch(function () {}));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = e.request.url;
  /* NEVER_CACHE — network-first: بيانات القاعدة والخطوط تمرّ مباشرة — لا تُخزَّن حتى لا يُعرض رقم بائت كأنه حىّ */
  if (url.indexOf("firebasedatabase.app") > -1 || url.indexOf("fonts.g") > -1) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match("./index.html"); });
    })
  );
});
