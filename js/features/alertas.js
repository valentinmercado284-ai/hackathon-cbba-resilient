/* =========================================================
   Alertas: pronóstico de 7 días, alertas de hoy y
   suscripción a avisos por correo
   ========================================================= */

var ALERT_TYPES = ["rain", "frost", "dry", "fire"];
var subTypes = [1, 1, 1, 1];   // tipos de aviso elegidos (1 sí / 0 no)
var lastAlerts = [];           // textos de las alertas de hoy (para el correo de prueba)

async function showAlerts(force) {
  renderSubscription();
  var m = farmMun();
  $("a-farm").textContent = m ? farmName() + " · " + m[0] : "";
  if (!m) {
    $("forecast").innerHTML = emptyState("📍", t("aNoT"), t("aNo"), linkBtn("mapa", "pin", t("hMark")));
    $("fc-src").textContent = "";
    $("als").innerHTML = '<p class="sub">' + esc(t("aNo")) + "</p>";
    return;
  }
  $("forecast").innerHTML = '<div class="loading-row"><span class="spinner" aria-hidden="true"></span><span>' + esc(t("aWait")) + "</span></div>";
  $("als").innerHTML = '<div class="skel skel-line" style="width:80%"></div><div class="skel skel-line" style="width:60%"></div>';

  var out = [];
  if (CFG.DEMO) {
    out = [{ kind: "rain", level: 2, text: t("aDemo") + t("aRain", 18) }, { kind: "dry", level: 2, text: t("aDemo") + t("aDry") }];
    $("forecast").innerHTML = "";
  } else {
    try {
      await loadForecast(force);
      renderForecast(FC);
      var fa = forecastAlerts(FC);
      out = out.concat(fa.length ? fa : [{ kind: "ok", level: 0, text: t("aOk") }]);
    } catch (e) {
      $("forecast").innerHTML = errorBox(t("aFail"), "alerts-refresh");
      $("fc-src").textContent = "";
      out.push({ kind: "err", level: 1, text: t("aFail") });
    }
    try {
      await loadStats(false);
      if (FS.lv.s >= 2) out.push({ kind: "dry", level: FS.lv.s, text: t("aDry") });
      if (FS.lv.i >= 2) out.push({ kind: "fire", level: FS.lv.i, text: t("aFire") });
    } catch (e) { /* sin datos NASA: solo se muestra el pronóstico */ }
  }
  if (CURRENT !== "alertas") return;
  out.sort(function (a, b) { return b.level - a.level; });
  lastAlerts = out.map(function (a) { return a.text; });
  $("als").innerHTML = out.map(function (a) {
    return '<div class="alert-item l' + a.level + (a.kind === "err" ? " err" : "") + '">' + esc(a.text) + "</div>";
  }).join("");
}

/* Tarjetas de los próximos 7 días */
function renderForecast(f) {
  $("forecast").innerHTML = '<div class="forecast">' + f.days.map(function (d, i) {
    var w = wxInfo(d.code), frost = d.tmin != null && d.tmin <= 2, heavy = d.rain >= 15;
    var name = i === 0 ? t("today") : i === 1 ? t("tomorrow") :
      parseDay(d.date).toLocaleDateString(locale(), { weekday: "short" }).replace(".", "");
    return '<div class="day' + (i === 0 ? " today" : "") + '">' +
      '<span class="day-name">' + esc(name) + "</span>" +
      '<span class="day-ic" role="img" aria-label="' + esc(w.label) + '" title="' + esc(w.label) + '">' + w.ic + "</span>" +
      '<span class="day-t">' + num(d.tmax) + '° <span class="min' + (frost ? " frost" : "") + '">' + num(d.tmin) + "°</span></span>" +
      '<span class="day-rain">💧 ' + num(d.rain, d.rain > 0 && d.rain < 1 ? 1 : 0) + " mm" + (d.prob != null ? " · " + d.prob + "%" : "") + "</span>" +
      (frost ? '<span class="day-flag frost">❄️ ' + esc(t("h3").replace(/^\S+\s/, "")) + "</span>" : "") +
      (heavy && !frost ? '<span class="day-flag rain">🌧️ ' + esc(t("fcHeavy")) + "</span>" : "") +
      "</div>";
  }).join("") + "</div>";
  $("fc-src").textContent = (f.stale ? t("sStale", fmtStamp(f.at)) + " " : "") + t("fcSrc", fmtStamp(f.at));
}

/* ---------- Suscripción por correo ---------- */
function savedSub() { return lsGet("sub", null); }

function renderSubscription() {
  var s = savedSub();
  if (s && s.types !== undefined) {
    subTypes = ALERT_TYPES.map(function (c) { return String(s.types).split(",").indexOf(c) >= 0 ? 1 : 0; });
  }
  if (s) {
    if (!$("s-n").value) $("s-n").value = s.name || "";
    if (!$("s-e").value) $("s-e").value = s.email || "";
    if (!$("s-w").value) $("s-w").value = s.wa || "";
  }
  $("sub-state").innerHTML = s ? '<div class="callout ok">' + icon("check") + "<div><p>" + esc(t("sSaved", s.email)) + "</p>" +
    (apiUrl() ? "" : '<p class="note" style="color:inherit">' + esc(t("sLocal")) + "</p>") + "</div></div>" : "";
  renderSubTypes();
  $("api").value = ls("api") || "";
}

function renderSubTypes() {
  $("s-t").innerHTML = ALERT_TYPES.map(function (c, i) {
    return '<button type="button" class="chip" data-act="sub-type" data-n="' + i + '" aria-pressed="' + !!subTypes[i] + '">' + esc(t("t_" + c)) + "</button>";
  }).join("");
}

function subData() {
  var m = farmMun();
  return {
    name: $("s-n").value.trim(),
    email: $("s-e").value.trim(),
    wa: $("s-w").value.trim(),
    lat: FARM.lat, lon: FARM.lon,
    mun: m ? m[0] : "",
    crop: FARM.k || "",
    lang: LANG,
    types: ALERT_TYPES.filter(function (c, i) { return subTypes[i]; }).join(",")
  };
}

/** Revisa el formulario; devuelve un mensaje de error o "" */
function subProblem(s) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return t("sBad");
  if (!hasLocation()) return t("sFarm");
  if (!s.types) return t("sNone");
  return "";
}

function subMsg(text, kind) {
  var m = $("s-m");
  m.textContent = text;
  m.className = "form-msg" + (kind ? " " + kind : "");
}

async function onSubscribe(e) {
  e.preventDefault();
  var s = subData(), problem = subProblem(s);
  if (problem) { subMsg(problem, "err"); return; }
  lsSet("sub", s);
  if (!apiUrl()) {
    subMsg(t("sNoApi"), "");
    renderSubscription();
    return;
  }
  subMsg(t("aWait"), "");
  try {
    var r = await api("subscribe", s);
    if (r.ok) subMsg(t("sSent"), "ok"); else subMsg(t("sErr", r.error || "?"), "err");
  } catch (err) {
    subMsg(t("sErr", err.message), "err");
  }
  renderSubscription();
}

ACTIONS["sub-type"] = function (el) {
  var i = +el.getAttribute("data-n");
  subTypes[i] = subTypes[i] ? 0 : 1;
  renderSubTypes();
};

ACTIONS["sub-test"] = async function () {
  var s = subData(), problem = subProblem(s);
  if (problem) { subMsg(problem, "err"); return; }
  if (!apiUrl()) {
    // Sin servicio: abre la aplicación de correo con las alertas de hoy
    subMsg(t("sMailto"), "");
    var body = (lastAlerts.length ? lastAlerts : [t("aOk")]).join("\n\n");
    location.href = "mailto:" + encodeURIComponent(s.email) + "?subject=" + encodeURIComponent("Cochabamba Resiliente") + "&body=" + encodeURIComponent(body);
    return;
  }
  subMsg(t("aWait"), "");
  try {
    var r = await api("test", s);
    if (r.ok) subMsg(t("sSent"), "ok"); else subMsg(t("sErr", r.error || "?"), "err");
  } catch (err) {
    subMsg(t("sErr", err.message), "err");
  }
};

/* Guarda la dirección del servicio y comprueba que responde */
ACTIONS["api-save"] = async function () {
  var v = $("api").value.trim();
  if (v && !/^https:\/\//.test(v)) { toast(t("apiBad"), "err"); return; }
  ls("api", v || null);
  ls("apiAi", null);
  renderSubscription();
  if (!v) { toast(t("saved"), "ok"); return; }
  toast(t("aWait"));
  try {
    var r = await api("ping", {});
    if (r && r.ok) { rememberServiceAi(!!r.ai); toast(t("apiOk"), "ok"); }
    else toast(t("apiErr", (r && r.error) || "?"), "err");
  } catch (e) {
    toast(t("apiErr", e.message), "err");
  }
};

ACTIONS["alerts-refresh"] = function () { showAlerts(true); };

$("sub-form").addEventListener("submit", onSubscribe);

VIEW_HOOKS.alertas = function () { showAlerts(false); };
