/* =========================================================
   Service worker: permite abrir la app sin internet e instalarla
   en el teléfono. Solo funciona cuando la app está publicada (https).
   Estrategia: primero la red (siempre lo más nuevo); si no hay
   conexión, se usa lo guardado. Las APIs y los mapas externos van
   directo a internet (la app guarda sus datos por su cuenta).
   Si agregas archivos nuevos, súmalos a CORE y cambia la versión.
   ========================================================= */
var CACHE = "cbba-resiliente-v1";
var CORE = [
  "./", "index.html", "manifest.webmanifest",
  "css/base.css", "css/layout.css", "css/components.css", "css/views.css",
  "js/config.js", "js/core/utils.js",
  "js/i18n/es.js", "js/i18n/en.js", "js/i18n/qu.js", "js/i18n/i18n.js",
  "js/data/geo.js", "js/data/municipios.js", "js/data/conocimiento.js",
  "js/core/state.js", "js/core/ui.js", "js/core/router.js",
  "js/services/nasa-power.js", "js/services/forecast.js", "js/services/backend.js",
  "js/map/geometry.js", "js/map/map.js",
  "js/features/inicio.js", "js/features/granja.js", "js/features/estadisticas.js",
  "js/features/alertas.js", "js/features/chat.js", "js/features/aprende.js", "js/features/compartir.js",
  "js/app.js",
  "assets/img/cochabamba-satelite.webp",
  "assets/icons/icon.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match("index.html"); });
    })
  );
});
