/* =========================================================
   Mapa interactivo de Cochabamba
   - Fondos: imagen integrada (funciona sin internet), NASA GIBS, Esri y OpenStreetMap
   - Capas NASA: lluvia (GPM IMERG), humedad del suelo (SMAP), vegetación (MODIS), incendios (VIIRS)
   - Zonas de riesgo por municipio, zoom, arrastre, pellizco, teclado y GPS
   ========================================================= */

var MV = { cx: 0.3, cy: 0.5, z: 7 };   // centro (Web Mercator 0–1) y zoom
var W = 600, H = 400, ZMIN = 6;        // tamaño del mapa en píxeles y zoom mínimo
var BASE = "nasa";                     // fondo activo
var ON = {};                           // capas NASA activas
var HS = 0;                            // riesgo coloreado: 0 sequía, 1 incendio, 2 inundación, 3 helada
var ZON = true;                        // mostrar zonas de riesgo
var D = isoDay(-3);                    // fecha de las imágenes NASA (las más recientes tardan unos días)
var TC = {}, TE = {}, TO = {};         // mosaicos en pantalla, errores y cargas correctas por capa
var MAPOK = false;

function scale() { return 256 * Math.pow(2, MV.z); }
function sx(x) { return (x - MV.cx) * scale() + W / 2; }
function sy(y) { return (y - MV.cy) * scale() + H / 2; }
function inv(px, py) { var s = scale(); return [(px - W / 2) / s + MV.cx, (py - H / 2) / s + MV.cy]; }

/* Mosaicos de NASA GIBS para una capa y la fecha elegida */
function gibs(layer, maxLevel, ext) {
  return function (z, x, y) {
    return "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/" + layer + "/default/" + D +
      "/GoogleMapsCompatible_Level" + maxLevel + "/" + z + "/" + y + "/" + x + "." + ext;
  };
}

/* u: dirección de cada mosaico · mz: zoom máximo · o: opacidad · nasa: depende de la fecha */
var TL = {
  nasa: { u: gibs("MODIS_Terra_CorrectedReflectance_TrueColor", 9, "jpg"), mz: 9, o: 1, nasa: true },
  esri: { u: function (z, x, y) { return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/" + z + "/" + y + "/" + x; }, mz: 16, o: 1 },
  osm: { u: function (z, x, y) { return "https://tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png"; }, mz: 17, o: 1 },
  rain: { u: gibs("IMERG_Precipitation_Rate", 6, "png"), mz: 6, o: 0.7, nasa: true },
  sm: { u: gibs("SMAP_L4_Analyzed_Surface_Soil_Moisture", 6, "png"), mz: 6, o: 0.7, nasa: true },
  ndvi: { u: gibs("MODIS_Terra_NDVI_8Day", 9, "png"), mz: 9, o: 0.7, nasa: true },
  fire: { u: gibs("VIIRS_SNPP_Thermal_Anomalies_375m_All", 9, "png"), mz: 9, o: 1, nasa: true }
};
var BASES = [["img", "bi"], ["nasa", "bn"], ["esri", "be"], ["osm", "bo"]];
var OVERLAYS = ["rain", "sm", "ndvi", "fire"];

/* ---------- Vista ---------- */
function sizeUp() { var r = $("mp").getBoundingClientRect(); W = r.width || 600; H = r.height || 400; }

/** Encuadra todo el departamento */
function fit(redraw) {
  sizeUp();
  var zx = Math.log(W / ((BB[2] - BB[0]) * 256 * 1.1)) / Math.LN2;
  var zy = Math.log(H / ((BB[3] - BB[1]) * 256 * 1.1)) / Math.LN2;
  MV.z = Math.min(zx, zy);
  ZMIN = MV.z - 0.4;
  MV.cx = (BB[0] + BB[2]) / 2;
  MV.cy = (BB[1] + BB[3]) / 2;
  if (redraw) draw();
}

function clampV() {
  MV.z = Math.max(ZMIN, Math.min(13, MV.z));
  MV.cx = Math.max(BB[0] - 0.05, Math.min(BB[2] + 0.05, MV.cx));
  MV.cy = Math.max(BB[1] - 0.05, Math.min(BB[3] + 0.05, MV.cy));
}

/** Zoom manteniendo fijo el punto (px, py) de la pantalla */
function zoomAt(px, py, dz) {
  var a = inv(px, py);
  MV.z = Math.max(ZMIN, Math.min(13, MV.z + dz));
  var s = scale();
  MV.cx = a[0] - (px - W / 2) / s;
  MV.cy = a[1] - (py - H / 2) / s;
  clampV();
  draw();
}
function zb(dz) { zoomAt(W / 2, H / 2, dz); }

function centerOn(lat, lon, minZoom) {
  MV.cx = mxl(lon);
  MV.cy = myl(lat);
  MV.z = Math.max(MV.z, minZoom);
  clampV();
}

/* ---------- Dibujo ---------- */
function path(poly) {
  var s = "";
  for (var i = 0; i < poly.length; i++) s += (i ? "L" : "M") + sx(poly[i][0]).toFixed(1) + "," + sy(poly[i][1]).toFixed(1);
  return s + "Z";
}

function draw() {
  if (!MAPOK) return;
  // Imagen integrada, ubicada según su calibración
  var a = p2ll(0, 0), b = p2ll(IMGW, IMGH), x0 = sx(mxl(a[0])), y0 = sy(myl(a[1])), im = $("im0");
  im.setAttribute("x", x0);
  im.setAttribute("y", y0);
  im.setAttribute("width", sx(mxl(b[0])) - x0);
  im.setAttribute("height", sy(myl(b[1])) - y0);
  tiles();

  // Oscurece lo que está fuera del departamento
  var s = '<path fill-rule="evenodd" fill="rgba(0,0,0,.58)" d="M0,0H' + W + "V" + H + "H0Z" + path(SW) + '"/>';
  if (ZON) {
    M.forEach(function (m) {
      s += '<path d="' + path(m.cell) + '" fill="' + HC[riskLevel(m, HS)] + '" fill-opacity=".34" stroke="#fff" stroke-opacity=".75" stroke-width="1"/>';
    });
  }
  var fm = farmMun();
  if (fm) s += '<path d="' + path(fm.cell) + '" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 4"/>';
  s += '<path d="' + path(SW) + '" fill="none" stroke="#ffeb3b" stroke-width="3" stroke-linejoin="round"/>';
  M.forEach(function (m) {
    if (m[6] || MV.z > 8.8 || m === fm) {
      s += '<text x="' + sx(m.w[0]).toFixed(1) + '" y="' + (sy(m.w[1]) + 4).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" ' +
        'font-family="system-ui,sans-serif" fill="#fff" stroke="#000" stroke-opacity=".7" stroke-width="3" paint-order="stroke">' + esc(m[0]) + "</text>";
    }
  });
  // Marcador de la granja
  if (hasLocation()) {
    var fx = sx(mxl(FARM.lon)), fy = sy(myl(FARM.lat));
    s += '<g transform="translate(' + fx.toFixed(1) + "," + fy.toFixed(1) + ')">' +
      '<ellipse cx="0" cy="0" rx="7" ry="3" fill="rgba(0,0,0,.35)"/>' +
      '<path d="M0,0C-10,-14 -14,-22 -14,-28a14,14 0 1 1 28,0C14,-22 10,-14 0,0Z" fill="#1565c0" stroke="#fff" stroke-width="2.5"/>' +
      '<circle cy="-28" r="5.5" fill="#fff"/></g>';
  }
  $("sv").innerHTML = s;
}

/** Coloca los mosaicos visibles de cada capa activa y quita los que ya no se ven */
function tiles() {
  var need = {}, act = [];
  if (BASE !== "img") act.push(BASE);
  OVERLAYS.forEach(function (k) { if (ON[k]) act.push(k); });
  act.forEach(function (key, li) {
    var L = TL[key], zt = Math.max(0, Math.min(L.mz, Math.round(MV.z))), n = Math.pow(2, zt);
    var a = inv(0, 0), c = inv(W, H);
    var x0 = Math.max(0, Math.floor(a[0] * n)), x1 = Math.min(n - 1, Math.floor(c[0] * n));
    var y0 = Math.max(0, Math.floor(a[1] * n)), y1 = Math.min(n - 1, Math.floor(c[1] * n));
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 80) return;
    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
        var id = key + "|" + D + "|" + zt + "|" + x + "|" + y, im = TC[id];
        need[id] = 1;
        if (!im) im = TC[id] = makeTile(key, L.u(zt, x, y), L.o, li);
        var size = scale() / n;
        im.style.width = im.style.height = (size + 0.7) + "px";
        im.style.left = sx(x / n).toFixed(1) + "px";
        im.style.top = sy(y / n).toFixed(1) + "px";
      }
    }
  });
  Object.keys(TC).forEach(function (id) { if (!need[id]) { TC[id].remove(); delete TC[id]; } });
}

function makeTile(key, src, opacity, z) {
  var im = new Image();
  im.alt = "";
  im.draggable = false;
  im.onerror = function () { im.style.display = "none"; TE[key] = (TE[key] || 0) + 1; tileFailed(key); };
  im.onload = function () { TO[key] = (TO[key] || 0) + 1; };
  im.src = src;
  im.style.opacity = opacity;
  im.style.zIndex = z;
  $("tl").appendChild(im);
  return im;
}

/** Si una capa no carga (sin internet), avisa; si es el fondo, cambia a la imagen integrada */
function tileFailed(key) {
  if (TO[key] || TE[key] < 3) return;
  if (key === BASE) { BASE = "img"; renderMapUI(); draw(); }
  banner(t("noweb"));
}

function banner(msg) { var e = $("mbn"); e.textContent = msg; e.hidden = false; }

/* ---------- Controles ---------- */
function renderMapUI() {
  $("bases").innerHTML = BASES.map(function (b) {
    return '<button type="button" class="seg-btn" data-act="map-base" data-k="' + b[0] + '" aria-pressed="' + (BASE === b[0]) + '">' + esc(t(b[1])) + "</button>";
  }).join("");
  $("ovs").innerHTML = OVERLAYS.map(function (k) {
    return '<button type="button" class="chip" data-act="map-layer" data-k="' + k + '" aria-pressed="' + !!ON[k] + '">' + esc(t("ov_" + k)) + "</button>";
  }).join("") + '<button type="button" class="chip" data-act="map-zones" aria-pressed="' + ZON + '">' + esc(t("zones")) + "</button>";
  $("hzs").innerHTML = [0, 1, 2, 3].map(function (k) {
    return '<button type="button" class="chip" data-act="map-hazard" data-k="' + k + '" aria-pressed="' + (HS === k) + '">' + esc(t("h" + k)) + "</button>";
  }).join("");
  // La fecha solo importa para las imágenes de la NASA
  $("date-row").hidden = !(TL[BASE] && TL[BASE].nasa) && !OVERLAYS.some(function (k) { return ON[k]; });
  renderLegend();
}

function renderLegend() {
  var el = $("legend");
  el.hidden = !ZON;
  el.innerHTML = "<b>" + esc(t("h" + HS)) + "</b>" + [0, 1, 2, 3].map(function (l) {
    return '<span><i style="background:' + HC[l] + '"></i>' + esc(t("l" + l)) + "</span>";
  }).join("");
}

ACTIONS["map-base"] = function (el) {
  BASE = el.getAttribute("data-k");
  TE[BASE] = 0;
  $("mbn").hidden = true;
  renderMapUI();
  draw();
};
ACTIONS["map-layer"] = function (el) { var k = el.getAttribute("data-k"); ON[k] = !ON[k]; renderMapUI(); draw(); };
ACTIONS["map-zones"] = function () { ZON = !ZON; renderMapUI(); draw(); };
ACTIONS["map-hazard"] = function (el) { HS = +el.getAttribute("data-k"); ZON = true; renderMapUI(); draw(); };
ACTIONS["map-zoom-in"] = function () { zb(0.7); };
ACTIONS["map-zoom-out"] = function () { zb(-0.7); };
ACTIONS["map-fit"] = function () { fit(true); };
ACTIONS.gps = function () { gps(); };

/* ---------- Gestos ---------- */
function bindMap() {
  var mp = $("mp"), P = {}, gesture = { moved: 0, start: 0 };
  function onControls(e) { return e.target.closest && e.target.closest(".map-ctrl, .map-legend, .map-banner"); }

  mp.addEventListener("pointerdown", function (e) {
    if (onControls(e)) return;
    P[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(P).length === 1) gesture = { moved: 0, start: Date.now() };
    try { mp.setPointerCapture(e.pointerId); } catch (x) { /* algunos navegadores no lo permiten */ }
  });

  mp.addEventListener("pointermove", function (e) {
    var o = P[e.pointerId];
    if (!o) return;
    var ids = Object.keys(P);
    if (ids.length === 1) {
      // Arrastrar
      var dx = e.clientX - o.x, dy = e.clientY - o.y;
      gesture.moved += Math.abs(dx) + Math.abs(dy);
      MV.cx -= dx / scale();
      MV.cy -= dy / scale();
      o.x = e.clientX;
      o.y = e.clientY;
      clampV();
      draw();
    } else if (ids.length === 2) {
      // Pellizcar para acercar o alejar
      var other = P[ids[0] === String(e.pointerId) ? ids[1] : ids[0]];
      var d0 = Math.hypot(o.x - other.x, o.y - other.y);
      o.x = e.clientX;
      o.y = e.clientY;
      var d1 = Math.hypot(o.x - other.x, o.y - other.y), r = mp.getBoundingClientRect();
      if (d0 > 0 && d1 > 0) zoomAt((o.x + other.x) / 2 - r.left, (o.y + other.y) / 2 - r.top, Math.log(d1 / d0) / Math.LN2);
      gesture.moved = 99;
    }
  });

  // Un toque corto sin arrastrar marca la granja
  mp.addEventListener("pointerup", function (e) {
    if (!P[e.pointerId]) return;
    var single = Object.keys(P).length === 1;
    delete P[e.pointerId];
    if (single && gesture.moved < 8 && Date.now() - gesture.start < 700) {
      var r = mp.getBoundingClientRect();
      tap(e.clientX - r.left, e.clientY - r.top);
    }
  });
  mp.addEventListener("pointercancel", function (e) { delete P[e.pointerId]; });

  mp.addEventListener("wheel", function (e) {
    e.preventDefault();
    var r = mp.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 0.5 : -0.5);
  }, { passive: false });

  mp.addEventListener("dblclick", function (e) {
    if (onControls(e)) return;
    var r = mp.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, 1);
  });

  // Teclado: flechas para moverse, + y − para el zoom
  mp.addEventListener("keydown", function (e) {
    var step = 80 / scale(), k = e.key;
    if (k === "+" || k === "=") zb(0.5);
    else if (k === "-" || k === "_") zb(-0.5);
    else if (k === "ArrowLeft") MV.cx -= step;
    else if (k === "ArrowRight") MV.cx += step;
    else if (k === "ArrowUp") MV.cy -= step;
    else if (k === "ArrowDown") MV.cy += step;
    else return;
    e.preventDefault();
    clampV();
    draw();
  });

  $("dt").addEventListener("change", function () { if (this.value) { D = this.value; draw(); } });

  window.addEventListener("resize", function () { if (!$("v-mapa").hidden) { sizeUp(); draw(); } });
}

/* ---------- Granja en el mapa ---------- */
function tap(px, py) {
  var w = inv(px, py), ll = [lxw(w[0]), lyw(w[1])];
  if (pip(ll, SL)) setFarm(ll[1], ll[0]);
  else toast(t("out"));
}

/** Guarda la ubicación de la granja (desde el mapa o el GPS) */
function setFarm(lat, lon) {
  FARM.lat = +lat.toFixed(5);
  FARM.lon = +lon.toFixed(5);
  FARM.mun = near(lat, lon);
  FARM.approx = false;
  FS = null;
  FC = null;
  saveFarmState();
  if (MAPOK) draw();
  if (CURRENT === "mapa") renderMapInfo();
  if (CURRENT === "granja") renderLocBox();
  toast(t("mPinOk", M[FARM.mun][0]), "ok");
}

/** Ubica la granja con el GPS del teléfono; `after` se ejecuta si sale bien */
function gps(after) {
  if (!navigator.geolocation) { toast(t("gpsno"), "err"); return; }
  toast(t("gpsWait"));
  navigator.geolocation.getCurrentPosition(function (r) {
    var la = r.coords.latitude, lo = r.coords.longitude;
    if (!pip([lo, la], SL)) { toast(t("gpsout"), "err"); return; }
    setFarm(la, lo);
    if (MAPOK) { centerOn(la, lo, 10); draw(); }
    if (after) after();
  }, function () {
    toast(t("gpsno"), "err");
  }, { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true });
}

/** Ficha del municipio de la granja, debajo del mapa */
function renderMapInfo() {
  var el = $("minfo"), m = farmMun();
  if (!m) {
    el.innerHTML = '<div class="callout info">' + icon("pin") + "<div><b>" + esc(t("mTapT")) + "</b><p>" + esc(t("mTapH")) + "</p>" +
      '<div class="actions"><button type="button" class="btn btn-secondary btn-sm" data-act="gps">' + icon("locate") + esc(t("useGps")) + "</button></div></div></div>";
    return;
  }
  var zone = m[3];
  var top2 = [0, 1, 2, 3].filter(function (k) { return m[4][k] >= 2; }).sort(function (a, b) { return m[4][b] - m[4][a]; }).slice(0, 2);
  var acts = [];
  top2.forEach(function (k) { acts = acts.concat(tl("a_" + KEYS[k])); });
  el.innerHTML = '<article class="card mun-card">' +
    '<p class="eyebrow">' + icon("pin") + esc(t("mYourFarm")) + "</p>" +
    "<h3>" + esc(m[0]) + " · " + esc(t("t_" + zone)) + "</h3>" +
    '<p class="sub">' + esc(t("mi_p", m[5].map(cropName).join(", "))) + "</p>" +
    "<h4>" + esc(t("mi_r")) + "</h4>" +
    '<div class="risk-grid">' + [0, 1, 2, 3].map(function (k) { return riskTile(k, riskLevel(m, k)); }).join("") + "</div>" +
    "<h4>" + esc(t("mi_d")) + "</h4>" +
    '<ul class="check-list">' + acts.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
    "<p>" + esc(t("mi_c", t("e_" + zone))) + "</p>" +
    '<p class="note">' + esc(t("mi_n")) + "</p>" +
    '<div class="actions">' + (farmReady() ? linkBtn("stats", "chart", t("mGoStats")) : linkBtn("granja", "sprout", t("mGoCrop"))) + "</div>" +
    "</article>";
}

function initMap() {
  if (!MAPOK) {
    MAPOK = true;
    $("im0").setAttribute("href", IMG);
    if (CFG.DEMO || navigator.onLine === false) BASE = "img";
    bindMap();
  }
  $("dt").value = D;
  $("dt").max = isoDay(-1);
  renderMapUI();
  fit(false);
  if (hasLocation()) centerOn(FARM.lat, FARM.lon, 8.5);
  draw();
  if (CFG.DEMO) banner(t("noweb"));
  renderMapInfo();
}

VIEW_HOOKS.mapa = initMap;
