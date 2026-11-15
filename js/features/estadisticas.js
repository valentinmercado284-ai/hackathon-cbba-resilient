/* =========================================================
   Datos NASA de la granja: indicadores, riesgos, gráfico de
   lluvia y recomendaciones (los cálculos están en services/nasa-power.js)
   ========================================================= */

async function showStats(force) {
  var el = $("stats");
  renderFarmTabs("tabs-stats", "stats");
  if (!hasLocation()) {
    el.innerHTML = emptyState("📍", t("sFirstT"), t("sFirst"), linkBtn("granja", "sprout", t("sGoFarm")) + linkBtn("mapa", "map", t("fB"), "btn-ghost"));
    return;
  }
  el.innerHTML = skeleton(t("sLoad") + " " + t("sLoadH"), 3);
  try {
    await loadStats(force);
  } catch (e) {
    el.innerHTML = errorBox(t("sFail", (e && e.message) || ""), "stats-retry");
    return;
  }
  if (CURRENT !== "stats") return;   // el usuario ya cambió de pantalla
  el.innerHTML = statsHtml(FS);
}

function statsHtml(s) {
  var l = s.lv, overall = Math.max(l.s, l.i, l.f, l.h), m = farmMun();
  var crop = FARM.k ? cropName(FARM.k) : null;
  var detail = [m[0], t("t_" + m[3]), crop, FARM.h ? num(+FARM.h, 1) + " ha" : null].filter(Boolean).join(" · ");
  var h = "";

  if (s.demo) h += '<div class="callout warn">' + esc(t("sDemo")) + "</div>";
  if (s.stale) h += '<div class="callout warn">' + icon("offline") + "<div><p>" + esc(t("sStale", fmtStamp(s.at))) + "</p></div></div>";

  // Encabezado
  h += '<div class="card"><div class="stats-head"><div>' +
    '<p class="eyebrow">' + icon("satellite") + esc(t("sAt", fmtDay(s.fecha))) + "</p>" +
    "<h2>" + (FARM.k ? CROP_ICON[FARM.k] + " " : "") + esc(farmName()) + "</h2>" +
    '<p class="sub">' + esc(detail) + "</p></div>" +
    '<button type="button" class="btn btn-ghost btn-sm" data-act="stats-refresh">' + icon("refresh") + esc(t("refresh")) + "</button></div>" +
    '<div class="overall">' + esc(t("sLvl")) + ": " + levelBadge(overall) + "</div></div>";

  // Riesgos
  h += '<h3 class="section-title" style="margin-top:6px">' + esc(t("sRisks")) + "</h3>" +
    '<div class="risk-grid" style="margin-bottom:16px">' + [0, 1, 2, 3].map(function (k) { return riskTile(k, l[KEYS[k]]); }).join("") + "</div>";

  // Indicadores principales
  h += '<div class="kpi-grid">' +
    kpi(t("kRain"), num(s.pr) + " <small>mm</small>", t("kVs", signedPct(s.prp)), toneFor(s.prp, -20, -5)) +
    kpi(t("kSoil"), num(s.sm) + " <small>%</small>", t("kVs", signedPct(s.smp)), toneFor(s.smp, -12, -3)) +
    kpi(t("kFrost"), num(s.fz), t("kFrostH"), s.fz >= 25 ? "bad" : s.fz >= 5 ? "warn" : "ok") +
    kpi(t("kAir"), num(s.rh) + " <small>%</small>", t("kAirH"), s.rh <= 40 ? "bad" : s.rh <= 55 ? "warn" : "ok") +
    "</div>";

  // Gráfico de lluvia
  var partial = isPartialMonth(s);
  // El gráfico se dibuja al ancho real de la pantalla para que el texto no se agrande
  var chartW = Math.max(300, Math.min(960, ($("stats").clientWidth || 360) - 40));
  h += '<div class="card"><h3>' + esc(t("sCh")) + "</h3>" + rainChart(s.ch, partial, chartW) +
    '<div class="chart-legend"><span><i class="lg-bar"></i>' + esc(t("sRainL")) + '</span><span><i class="lg-norm"></i>' + esc(t("sNorm")) + "</span></div>" +
    (partial ? '<p class="note" style="margin-top:6px">' + esc(t("sPartial")) + "</p>" : "") + "</div>";

  // Recomendaciones
  h += '<div class="card"><h3>' + esc(t("sRec")) + "</h3>" +
    (FARM.k ? "" : '<div class="callout info">' + icon("sprout") + "<div><p>" + esc(t("sNoCrop")) + "</p></div></div>") +
    '<ul class="rec-list">' + recommendations(s).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";

  // Estadísticas avanzadas
  var c = CROPS[FARM.k || "maiz"];
  h += '<details class="card"><summary>' + esc(t("sAdv")) + '</summary><div class="kpi-grid" style="margin-top:14px">' +
    kpi(t("k5"), num(s.t, 1) + " <small>°C</small>", "", "") +
    kpi(t("k6"), (s.tr > 0 ? "+" : "") + num(s.tr, 2) + " <small>°C</small>", "", "") +
    kpi(t("k7"), num(s.hv), "", "") +
    kpi(t("k8"), num(s.dry), "", "") +
    '</div><p class="note">' + esc(t("sNeed", c[0])) + "</p></details>";

  h += '<p class="note">' + esc(t("sSrc", fmtDay(s.fecha))) + "</p>";
  return h;
}

function kpi(label, valueHtml, sub, tone) {
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return '<div class="kpi' + (tone ? " tone-" + tone : "") + '"><span class="kpi-label">' + esc(label) + "</span>" +
    '<span class="kpi-val">' + valueHtml + "</span>" + (sub ? '<span class="kpi-delta">' + esc(sub) + "</span>" : "") + "</div>";
}

/** Tono según cuánto está por debajo de lo normal */
function toneFor(pct, bad, warn) {
  if (pct !== pct) return "";
  return pct <= bad ? "bad" : pct <= warn ? "warn" : "ok";
}

/** ¿El último mes del gráfico todavía no terminó? */
function isPartialMonth(s) {
  if (!/^\d{8}$/.test(s.fecha) || !s.ch.length) return false;
  var last = s.ch[s.ch.length - 1];
  return last.k === s.fecha.slice(0, 6) && +s.fecha.slice(6) < 28;
}

/* Escala «redonda» para el eje (10, 20, 50, 100, 150…) */
function niceMax(v) {
  if (v <= 0) return 10;
  var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
  return Math.ceil(v / p * 2) / 2 * p;
}

function monthLabel(k) {
  try {
    var s = new Date(+k.slice(0, 4), +k.slice(4, 6) - 1, 1).toLocaleDateString(locale(), { month: "short" }).replace(".", "");
    return s.charAt(0).toUpperCase() + s.slice(1, 3);
  } catch (e) { return k.slice(4); }
}

/** Gráfico de barras: lluvia de cada mes y línea de lo normal */
function rainChart(ch, partial, width) {
  var Wc = width || 360, Hc = Wc > 600 ? 190 : 150, left = 32, right = 6, top = 8, bottom = 22;
  var max = niceMax(Math.max.apply(null, ch.map(function (c) { return Math.max(c.v || 0, c.n === c.n ? c.n : 0); })));
  var cw = (Wc - left - right) / ch.length, bw = Math.min(cw - 8, 42), pad = (cw - bw) / 2;
  var labelSize = cw < 30 ? 9.5 : 11;
  function y(v) { return top + (Hc - top) * (1 - v / max); }
  var s = '<svg class="chart" viewBox="0 0 ' + Wc + " " + (Hc + bottom) + '" role="img" aria-label="' + esc(t("sCh")) + '">';
  [0, 0.5, 1].forEach(function (f) {
    var v = max * f, yy = y(v).toFixed(1);
    s += '<line class="ch-grid" x1="' + left + '" x2="' + (Wc - right) + '" y1="' + yy + '" y2="' + yy + '"/>' +
      '<text class="ch-ax" x="' + (left - 6) + '" y="' + (+yy + 3.5) + '" text-anchor="end">' + Math.round(v) + "</text>";
  });
  ch.forEach(function (c, i) {
    var x = left + i * cw, v = c.v || 0, last = i === ch.length - 1;
    var tip = monthLabel(c.k) + " " + c.k.slice(0, 4) + ": " + num(v) + " mm" + (c.n === c.n ? " · " + t("sNorm") + " " + num(c.n) + " mm" : "");
    s += '<rect class="ch-bar' + (partial && last ? " partial" : "") + '" x="' + (x + pad).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + bw.toFixed(1) +
      '" height="' + Math.max(0, Hc - y(v)).toFixed(1) + '" rx="3"><title>' + esc(tip) + "</title></rect>";
    if (c.n === c.n) {
      s += '<line class="ch-norm" x1="' + (x + pad - 3).toFixed(1) + '" x2="' + (x + pad + bw + 3).toFixed(1) + '" y1="' + y(c.n).toFixed(1) + '" y2="' + y(c.n).toFixed(1) + '"/>';
    }
    s += '<text class="ch-mo" x="' + (x + cw / 2).toFixed(1) + '" y="' + (Hc + 15) + '" style="font-size:' + labelSize + 'px">' + esc(monthLabel(c.k)) + "</text>";
  });
  return s + "</svg>";
}

/** Recomendaciones según el cultivo y los riesgos */
function recommendations(s) {
  var k = FARM.k || "maiz", c = CROPS[k], l = s.lv, r = [];
  var need = Math.round(c[0] * 90 / c[1]), balance = s.pr - need, name = cropName(k);
  r.push(balance < 0 ? t("rW1", num(s.pr), name, num(need), num(-balance)) : t("rW2", num(s.pr), name, num(need)));
  if (l.s >= 2) r.push(t("rS", t("l" + l.s).toLowerCase()));
  if (l.h >= 2 && c[2]) r.push(t("rH", s.fz));
  if (l.f >= 2) r.push(t("rF", s.hv));
  if (l.i >= 2) r.push(t("rI"));
  if (String(FARM.p) === "2") r.push(t("rSl"));
  [3, 0, 2, 1].forEach(function (i) { if (l[KEYS[i]] >= 2) r = r.concat(tl("a_" + KEYS[i])); });
  return r.slice(0, 9);
}

ACTIONS["stats-refresh"] = function () { showStats(true); };
ACTIONS["stats-retry"] = function () { showStats(true); };

VIEW_HOOKS.stats = function () { showStats(false); };
