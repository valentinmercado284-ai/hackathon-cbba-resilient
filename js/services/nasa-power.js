/* =========================================================
   NASA POWER: datos diarios de clima de la granja desde 2010
   - Descarga lluvia, temperatura, temperatura mínima, humedad del suelo y del aire
   - Calcula indicadores comparando con los mismos días de años anteriores
   - Guarda el resultado en el dispositivo (sirve sin internet)
   ========================================================= */

function sum(a) { return a.reduce(function (s, v) { return v === v ? s + v : s; }, 0); }
function avg(a) { var n = a.filter(function (v) { return v === v; }); return n.length ? sum(n) / n.length : NaN; }

/** Calcula los indicadores a partir de la respuesta de NASA POWER (properties.parameter) */
function calcStats(p) {
  var ks = Object.keys(p.PRECTOTCORR).sort();
  // NASA publica con unos días de retraso: se quitan los últimos días sin dato (-999)
  while (ks.length && !(p.PRECTOTCORR[ks[ks.length - 1]] > -990)) ks.pop();
  var n = ks.length;
  function series(k) {
    return ks.map(function (d) { var v = p[k] ? p[k][d] : NaN; return v == null || v < -990 ? NaN : v; });
  }
  var pr = series("PRECTOTCORR"), tt = series("T2M"), tm = series("T2M_MIN"), sm = series("GWETROOT"), rh = series("RH2M");

  // Últimos `len` días comparados con el mismo período de hasta 15 años anteriores
  function vsNormal(a, len, f) {
    var cur = f(a.slice(n - len)), past = [];
    for (var y = 1; y <= 15; y++) {
      var e = n - Math.round(365.25 * y), s = e - len;
      if (s < 0) break;
      past.push(f(a.slice(s, e)));
    }
    var m = avg(past);
    return { cur: cur, pct: m ? Math.round(100 * (cur - m) / Math.abs(m)) : NaN };
  }
  var r90 = vsNormal(pr, 90, sum), s30 = vsNormal(sm, 30, avg);

  // Racha más larga de días secos (< 1 mm) en los últimos 90 días
  var dry = 0, maxDry = 0;
  pr.slice(-90).forEach(function (v) { if (v < 1) { dry++; maxDry = Math.max(maxDry, dry); } else dry = 0; });

  // Lluvia por mes (últimos 12 meses y su valor normal) y temperatura por año
  var byMonth = {}, byYear = {};
  ks.forEach(function (d, i) {
    (byMonth[d.slice(0, 6)] = byMonth[d.slice(0, 6)] || []).push(pr[i]);
    (byYear[d.slice(0, 4)] = byYear[d.slice(0, 4)] || []).push(tt[i]);
  });
  var months = Object.keys(byMonth).sort(), last12 = months.slice(-12);
  var chart = last12.map(function (k) {
    var normals = months.filter(function (q) {
      return q.slice(4) === k.slice(4) && last12.indexOf(q) < 0 && byMonth[q].length > 27;
    }).map(function (q) { return sum(byMonth[q]); });
    return { k: k, v: sum(byMonth[k]), n: avg(normals) };
  });

  // Tendencia de temperatura en °C por década (regresión lineal con años completos)
  var years = Object.keys(byYear).filter(function (y) { return byYear[y].length > 360; }).map(Number), trend = NaN;
  if (years.length > 3) {
    var ya = years.map(function (y) { return avg(byYear[y]); }), mx = avg(years), my = avg(ya), nu = 0, de = 0;
    years.forEach(function (x, i) { nu += (x - mx) * (ya[i] - my); de += (x - mx) * (x - mx); });
    trend = +(10 * nu / de).toFixed(2);
  }

  return {
    pr: Math.round(r90.cur), prp: r90.pct,              // lluvia 90 días (mm) y % vs normal
    sm: +(s30.cur * 100).toFixed(0), smp: s30.pct,      // humedad del suelo 30 días (%) y % vs normal
    rh: Math.round(avg(rh.slice(-30))),                 // humedad del aire 30 días (%)
    fz: tm.slice(-365).filter(function (v) { return v <= 2; }).length,   // noches ≤ 2 °C en el año
    hv: pr.slice(-365).filter(function (v) { return v >= 20; }).length,  // días de lluvia fuerte en el año
    dry: maxDry,                                         // racha seca más larga (90 días)
    t: +avg(tt.slice(-365)).toFixed(1),                  // temperatura media del año
    tr: trend,                                           // tendencia por década
    ch: chart,                                           // lluvia mensual (12 meses)
    fecha: ks[n - 1]                                     // último día con datos (AAAAMMDD)
  };
}

/** Niveles de riesgo (0–3) de la granja a partir de los indicadores */
function riskLevels(s) {
  return {
    s: (s.prp <= -40 || s.smp <= -25) ? 3 : (s.prp <= -20 || s.smp <= -12) ? 2 : (s.prp <= -5 || s.smp <= -3) ? 1 : 0,
    i: (s.smp <= -15 && s.rh <= 40) ? 3 : (s.smp <= -8 || s.rh <= 45) ? 2 : s.rh <= 55 ? 1 : 0,
    f: s.hv >= 4 ? 3 : s.hv >= 2 ? 2 : s.hv >= 1 ? 1 : 0,
    h: s.fz >= 60 ? 3 : s.fz >= 25 ? 2 : s.fz >= 5 ? 1 : 0
  };
}

/** Datos de ejemplo para el modo demostración (CFG.DEMO) */
function demoStats() {
  var now = new Date(), ch = [], normal = [100, 90, 60, 20, 5, 2, 3, 8, 20, 35, 50, 80];
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1), m = d.getMonth();
    ch.push({ k: d.getFullYear() + ("0" + (m + 1)).slice(-2), v: Math.round(normal[m] * 0.65), n: normal[m] });
  }
  var s = { pr: 96, prp: -34, sm: 31, smp: -16, rh: 46, fz: 14, hv: 2, dry: 23, t: 17.9, tr: 0.3, ch: ch, fecha: "demo", demo: 1 };
  s.lv = riskLevels(s);
  s.at = Date.now();
  return s;
}

function statsKey() { return "nasa:" + farmKey(); }

/** Último resultado guardado para la granja actual: { at, s } o null */
function cachedStats() {
  if (!hasLocation()) return null;
  var c = lsGet(statsKey(), null);
  return c && c.s ? c : null;
}

function statsFromRecord(rec, stale) {
  var s = rec.s;
  s.at = rec.at;
  s.stale = !!stale;
  return s;
}

async function fetchPower() {
  var end = isoDay(-2).replace(/-/g, "");
  var url = "https://power.larc.nasa.gov/api/temporal/daily/point" +
    "?parameters=PRECTOTCORR,T2M,T2M_MIN,GWETROOT,RH2M&community=AG" +
    "&longitude=" + FARM.lon + "&latitude=" + FARM.lat + "&start=20100101&end=" + end + "&format=JSON";
  var ac = new AbortController(), timer = setTimeout(function () { ac.abort(); }, 45000);
  try {
    var r = await fetch(url, { signal: ac.signal });
    var j = await r.json();
    if (!r.ok || !j.properties || !j.properties.parameter) {
      throw new Error("NASA POWER " + r.status + (j.messages && j.messages.length ? ": " + j.messages[0] : ""));
    }
    return calcStats(j.properties.parameter);
  } catch (e) {
    if (e.name === "AbortError") throw new Error(t("timeout"));
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Carga los indicadores de la granja en FS.
 * Usa los datos guardados si son recientes; sin internet usa los últimos guardados.
 * @param {boolean} force  descargar de nuevo aunque haya datos recientes
 */
async function loadStats(force) {
  if (CFG.DEMO) return (FS = demoStats());
  var c = cachedStats();
  if (c && !force && Date.now() - c.at < CFG.CACHE_HOURS * 3600e3) return (FS = statsFromRecord(c));
  try {
    var s = await fetchPower();
    s.lv = riskLevels(s);
    var rec = { at: Date.now(), s: s };
    lsDropPrefix("nasa:", statsKey());
    lsSet(statsKey(), rec);
    return (FS = statsFromRecord(rec));
  } catch (e) {
    if (c) return (FS = statsFromRecord(c, true));
    throw e;
  }
}
