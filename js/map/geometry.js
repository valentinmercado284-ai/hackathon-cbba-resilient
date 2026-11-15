/* =========================================================
   Geometría del mapa
   - Proyección Web Mercator (la de los mosaicos del mapa), con coordenadas de 0 a 1
   - Contorno del departamento y zona de cada municipio
   ========================================================= */

/* Longitud/latitud ↔ Web Mercator (0–1) */
function mxl(lon) { return (lon + 180) / 360; }
function myl(lat) { var r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; }
function lxw(x) { return x * 360 - 180; }
function lyw(y) { return 180 / Math.PI * Math.atan(Math.sinh(Math.PI * (1 - 2 * y))); }

/* Píxel de la imagen integrada → [longitud, latitud] (calibración en data/geo.js) */
function p2ll(x, y) { return [LON0 + (x - DX) * KX, LAT0 - (y - DY) * KY]; }

/* Contorno del departamento: SL en [lon, lat], SW en Web Mercator.
   BB = rectángulo que lo contiene [x mín, y mín, x máx, y máx] */
var SL = SHP.map(function (p) { return p2ll(p[0], p[1]); });
var SW = SL.map(function (c) { return [mxl(c[0]), myl(c[1])]; });
var BB = [1, 1, 0, 0];
SW.forEach(function (p) {
  BB = [Math.min(BB[0], p[0]), Math.min(BB[1], p[1]), Math.max(BB[2], p[0]), Math.max(BB[3], p[1])];
});

/** ¿El punto [x, y] está dentro del polígono? (método del rayo) */
function pip(ll, poly) {
  var x = ll[0], y = ll[1], c = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var a = poly[i], b = poly[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}

/** Recorta el polígono con la mediatriz entre s y q, y se queda con el lado de s */
function clip(poly, s, q) {
  var nx = q[0] - s[0], ny = q[1] - s[1], mx = (s[0] + q[0]) / 2, my = (s[1] + q[1]) / 2, out = [];
  function side(p) { return (p[0] - mx) * nx + (p[1] - my) * ny; }
  for (var i = 0; i < poly.length; i++) {
    var a = poly[i], b = poly[(i + 1) % poly.length], da = side(a), db = side(b);
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      var k = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    }
  }
  return out;
}

/* Zona de cada municipio: celda de Voronoi (lo más cercano a su centro) dentro del contorno */
M.forEach(function (m) { m.w = [mxl(m[1]), myl(m[2])]; });
M.forEach(function (m) {
  var p = SW.slice();
  M.forEach(function (o) { if (o !== m && p.length) p = clip(p, m.w, o.w); });
  m.cell = p;
});

/** Índice del municipio cuyo centro está más cerca (distancias aproximadas en km) */
function near(lat, lon) {
  var best = 0, bestD = 1e9;
  M.forEach(function (m, i) {
    var d = Math.hypot((m[1] - lon) * 106, (m[2] - lat) * 111);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}
