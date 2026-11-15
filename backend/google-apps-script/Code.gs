/**
 * =========================================================
 * Cochabamba Resiliente — servicio de alertas y chat
 * Google Apps Script (gratis, con una cuenta de Google).
 * Instrucciones de instalación: backend/README.md
 *
 * Lo que hace:
 *  GET  ?action=ping                 → comprobar que el servicio responde
 *  GET  ?action=subscribe&...        → guarda la suscripción en la hoja y envía un correo de bienvenida
 *  GET  ?action=test&...             → envía un correo de prueba con el pronóstico real de la granja
 *  GET  ?action=unsubscribe&...      → da de baja (enlace incluido en cada correo)
 *  POST {action:"chat", messages}    → responde el chat con IA (OpenAI); la clave queda en el servidor
 *  revisarAlertas()                  → se ejecuta todos los días: avisa de lluvia fuerte y helada
 * =========================================================
 */

var SHEET_NAME = "Suscriptores";
var HEADERS = ["fecha", "nombre", "correo", "whatsapp", "lat", "lon", "municipio", "cultivo", "idioma", "tipos", "token", "activo", "ultimo_envio"];
var COL = { fecha: 0, nombre: 1, correo: 2, whatsapp: 3, lat: 4, lon: 5, municipio: 6, cultivo: 7, idioma: 8, tipos: 9, token: 10, activo: 11, ultimo: 12 };
var TZ = "America/La_Paz";

/* ---------- Textos de los correos ---------- */
var TXT = {
  es: {
    welcomeSubject: "Cochabamba Resiliente: suscripción activada",
    welcome: function (name, types) { return "Hola" + (name ? " " + name : "") + ". Te avisaremos por correo cuando se espere en tu granja: " + types + "."; },
    testSubject: "Cochabamba Resiliente: alerta de prueba",
    alertSubject: "Cochabamba Resiliente: alerta para tu granja",
    weeklySubject: "Cochabamba Resiliente: resumen de la semana",
    none: "✅ En los próximos 2 días no se esperan lluvias fuertes ni heladas en tu granja.",
    rain: function (mm) { return "🌧️ Mañana se espera lluvia fuerte (≈" + mm + " mm). Limpia zanjas, protege semillas e insumos y no riegues."; },
    frost: function (t) { return "❄️ Se espera helada en los próximos días (mínima " + t + " °C). Cubre las plantas jóvenes esta noche."; },
    dry: "🌵 No se espera lluvia en los próximos 7 días y hará calor. Cuida el agua: riega temprano o al atardecer y cubre el suelo.",
    fire: "🔥 Semana seca y calurosa: alto riesgo de incendio. No quemes y abre cortafuegos.",
    week: function (rain, tmin, tmax) { return "📅 Próximos 7 días: " + rain + " mm de lluvia en total, mínima " + tmin + " °C, máxima " + tmax + " °C."; },
    types: { rain: "lluvia fuerte", frost: "helada", dry: "sequía", fire: "incendio" },
    farm: "Tu granja",
    source: "Pronóstico: Open-Meteo. Datos satelitales: NASA. Son avisos orientativos: confirma con tu alcaldía o un técnico agrónomo.",
    unsub: "Dejar de recibir estos correos",
    unsubDone: "Listo: ya no recibirás avisos de Cochabamba Resiliente.",
    unsubBad: "El enlace no es válido o ya fue usado."
  },
  en: {
    welcomeSubject: "Cochabamba Resiliente: subscription active",
    welcome: function (name, types) { return "Hello" + (name ? " " + name : "") + ". We will email you when this is expected on your farm: " + types + "."; },
    testSubject: "Cochabamba Resiliente: test alert",
    alertSubject: "Cochabamba Resiliente: alert for your farm",
    weeklySubject: "Cochabamba Resiliente: weekly summary",
    none: "✅ No heavy rain or frost expected on your farm in the next 2 days.",
    rain: function (mm) { return "🌧️ Heavy rain expected tomorrow (≈" + mm + " mm). Clear ditches, protect seeds and supplies and do not irrigate."; },
    frost: function (t) { return "❄️ Frost expected in the next days (minimum " + t + " °C). Cover young plants tonight."; },
    dry: "🌵 No rain expected in the next 7 days and it will be hot. Save water: irrigate early or at dusk and cover the soil.",
    fire: "🔥 Dry, hot week: high fire risk. Do not burn and open firebreaks.",
    week: function (rain, tmin, tmax) { return "📅 Next 7 days: " + rain + " mm of rain in total, minimum " + tmin + " °C, maximum " + tmax + " °C."; },
    types: { rain: "heavy rain", frost: "frost", dry: "drought", fire: "fire" },
    farm: "Your farm",
    source: "Forecast: Open-Meteo. Satellite data: NASA. These are guidance alerts: confirm with your municipality or an agronomist.",
    unsub: "Stop receiving these emails",
    unsubDone: "Done: you will no longer receive alerts from Cochabamba Resiliente.",
    unsubBad: "The link is not valid or was already used."
  }
};
function tx(lang) { return TXT[lang] || TXT.es; }

/* ---------- Entradas web ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    rememberWebAppUrl();
    switch (p.action) {
      case "ping": return json({ ok: true, service: "cochabamba-resiliente", url: webAppUrl(), ai: !!PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY") });
      case "subscribe": return json(subscribe(p));
      case "test": return json(sendTest(p));
      case "unsubscribe": return unsubscribePage(p);
      default: return json({ ok: false, error: "Acción desconocida" });
    }
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.action === "chat") return json(chat(body.messages));
    return json({ error: "Acción desconocida" });
  } catch (err) {
    return json({ error: String((err && err.message) || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Dirección pública del servicio (…/exec), para el enlace de baja de los correos.
   Se guarda sola la primera vez que la app llama al servicio; también se puede
   escribir a mano en la propiedad del script WEBAPP_URL. */
function rememberWebAppUrl() {
  var u = ScriptApp.getService().getUrl() || "";
  if (!/\/exec$/.test(u)) return;
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("WEBAPP_URL") !== u) props.setProperty("WEBAPP_URL", u);
}
function webAppUrl() {
  var saved = PropertiesService.getScriptProperties().getProperty("WEBAPP_URL");
  if (saved) return saved;
  var u = ScriptApp.getService().getUrl() || "";
  return /\/exec$/.test(u) ? u : "";
}

/* ---------- Hoja de suscriptores ---------- */
function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    // Script independiente (no creado desde una hoja): crea una hoja y recuerda su id
    var props = PropertiesService.getScriptProperties(), id = props.getProperty("SHEET_ID");
    ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create("Cochabamba Resiliente - Suscriptores");
    if (!id) props.setProperty("SHEET_ID", ss.getId());
  }
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

/** Texto seguro para la hoja: corto y sin fórmulas (=, +, -, @ al inicio) */
function clean(s, max) {
  s = String(s == null ? "" : s).replace(/[\r\n\t]+/g, " ").trim().slice(0, max || 120);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** Correo válido y sin caracteres que la hoja pueda tomar como fórmula (=, +, -, @ al inicio) */
function validEmail(s) { return /^[a-z0-9._%][a-z0-9._%+\-]*@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(s); }

/** Fecha guardada en la hoja → "aaaa-mm-dd" (la hoja a veces convierte el texto en fecha) */
function dayOf(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, "yyyy-MM-dd") : String(v || ""); }

function parseTypes(s) {
  var list = String(s || "rain,frost,dry,fire").split(","), out = {};
  ["rain", "frost", "dry", "fire"].forEach(function (k) { out[k] = list.indexOf(k) >= 0; });
  return out;
}

function today() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"); }

/* ---------- Suscripción ---------- */
function subscribe(p) {
  var email = String(p.email || "").trim().toLowerCase();
  if (!validEmail(email)) return { ok: false, error: "Correo no válido" };
  var lat = Number(p.lat), lon = Number(p.lon);
  if (!isFinite(lat) || !isFinite(lon)) return { ok: false, error: "Falta la ubicación de la granja" };
  var lang = p.lang === "en" ? "en" : "es";
  var types = clean(p.types || "rain,frost,dry,fire", 40);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var token;
  try {
    var sh = sheet(), data = sh.getDataRange().getValues(), row = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.correo]).toLowerCase() === email) { row = i + 1; token = data[i][COL.token]; break; }
    }
    token = token || Utilities.getUuid();
    var values = [new Date(), clean(p.name, 60), email, clean(p.wa, 30), lat, lon, clean(p.mun, 60), clean(p.crop, 20), lang, types, token, true,
      row > 0 ? data[row - 1][COL.ultimo] : ""];
    if (row > 0) sh.getRange(row, 1, 1, values.length).setValues([values]);
    else sh.appendRow(values);
  } finally {
    lock.releaseLock();
  }
  var t = tx(lang), tp = parseTypes(types);
  var names = Object.keys(tp).filter(function (k) { return tp[k]; }).map(function (k) { return t.types[k]; }).join(", ");
  sendMail(email, t.welcomeSubject, [t.welcome(clean(p.name, 60), names)], { mun: clean(p.mun, 60), lang: lang, token: token });
  return { ok: true };
}

function sendTest(p) {
  var email = String(p.email || "").trim().toLowerCase();
  if (!validEmail(email)) return { ok: false, error: "Correo no válido" };
  var lat = Number(p.lat), lon = Number(p.lon);
  if (!isFinite(lat) || !isFinite(lon)) return { ok: false, error: "Falta la ubicación de la granja" };
  // Máximo un correo de prueba cada 10 minutos por dirección
  var cache = CacheService.getScriptCache(), key = "test:" + email;
  if (cache.get(key)) return { ok: false, error: "Espera unos minutos antes de pedir otra prueba" };
  cache.put(key, "1", 600);
  var lang = p.lang === "en" ? "en" : "es", t = tx(lang);
  var f = forecast(lat, lon);
  var lines = buildAlerts(f, parseTypes(p.types), lang, true);
  if (!lines.length) lines = [t.none];
  lines.push(t.week(f.weekRain, f.weekMin, f.weekMax));
  sendMail(email, t.testSubject, lines, { mun: clean(p.mun, 60), lang: lang, token: findToken(email) });
  return { ok: true };
}

function findToken(email) {
  var data = sheet().getDataRange().getValues();
  for (var i = 1; i < data.length; i++) if (String(data[i][COL.correo]).toLowerCase() === email) return data[i][COL.token];
  return "";
}

function unsubscribePage(p) {
  var email = String(p.email || "").trim().toLowerCase(), token = String(p.token || "");
  var sh = sheet(), data = sh.getDataRange().getValues(), done = false, lang = "es";
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][COL.correo]).toLowerCase() === email && token && String(data[i][COL.token]) === token) {
      sh.getRange(i + 1, COL.activo + 1).setValue(false);
      lang = data[i][COL.idioma] === "en" ? "en" : "es";
      done = true;
      break;
    }
  }
  var t = tx(lang);
  return HtmlService.createHtmlOutput(
    '<div style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:24px;border-radius:16px;background:#e6f4e7;color:#1d5e22">' +
    "<h2 style=\"margin:0 0 8px\">🌱 Cochabamba Resiliente</h2><p>" + (done ? t.unsubDone : t.unsubBad) + "</p></div>"
  ).setTitle("Cochabamba Resiliente");
}

/* ---------- Pronóstico y alertas ---------- */
function forecast(lat, lon) {
  var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
    "&daily=precipitation_sum,temperature_2m_min,temperature_2m_max&forecast_days=7&timezone=auto";
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("Open-Meteo " + res.getResponseCode());
  var d = JSON.parse(res.getContentText()).daily;
  var rain = d.precipitation_sum.map(function (v) { return v || 0; });
  return {
    rainTomorrow: rain[1] || 0,
    min2days: Math.min(d.temperature_2m_min[1], d.temperature_2m_min[2]),
    weekRain: Math.round(rain.reduce(function (a, b) { return a + b; }, 0)),
    weekMin: Math.round(Math.min.apply(null, d.temperature_2m_min) * 10) / 10,
    weekMax: Math.round(Math.max.apply(null, d.temperature_2m_max) * 10) / 10
  };
}

/**
 * Alertas según el pronóstico.
 * - Todos los días: lluvia fuerte mañana (≥ 15 mm) y helada en 2 días (≤ 2 °C)
 * - Una vez por semana (o en la prueba): semana sin lluvia y calurosa (sequía / incendio)
 */
function buildAlerts(f, types, lang, weekly) {
  var t = tx(lang), out = [];
  if (types.rain && f.rainTomorrow >= 15) out.push(t.rain(Math.round(f.rainTomorrow)));
  if (types.frost && f.min2days <= 2) out.push(t.frost(Math.round(f.min2days * 10) / 10));
  if (weekly && f.weekRain < 1) {
    if (types.dry && f.weekMax >= 26) out.push(t.dry);
    if (types.fire && f.weekMax >= 30) out.push(t.fire);
  }
  return out;
}

/** Se ejecuta todos los días (ver instalarActivador) */
function revisarAlertas() {
  limpiarContadores();
  var sh = sheet(), data = sh.getDataRange().getValues(), day = today();
  var weekly = Utilities.formatDate(new Date(), TZ, "u") === "1";   // lunes
  var cache = {};
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[COL.activo]).toUpperCase() !== "TRUE") continue;
    if (dayOf(r[COL.ultimo]) === day) continue;   // ya se le envió hoy
    if (MailApp.getRemainingDailyQuota() < 1) break;
    try {
      var key = Number(r[COL.lat]).toFixed(2) + "," + Number(r[COL.lon]).toFixed(2);
      var f = cache[key] || (cache[key] = forecast(r[COL.lat], r[COL.lon]));
      var lang = r[COL.idioma] === "en" ? "en" : "es", t = tx(lang);
      var lines = buildAlerts(f, parseTypes(r[COL.tipos]), lang, weekly);
      if (!lines.length) continue;
      lines.push(t.week(f.weekRain, f.weekMin, f.weekMax));
      sendMail(r[COL.correo], weekly ? t.weeklySubject : t.alertSubject, lines, { mun: r[COL.municipio], lang: lang, token: r[COL.token] });
      sh.getRange(i + 1, COL.ultimo + 1).setValue("'" + day);   // el apóstrofo lo guarda como texto
    } catch (err) {
      console.error("Fila " + (i + 1) + ": " + err);
    }
  }
}

/** Ejecutar UNA vez desde el editor: programa revisarAlertas todos los días a las 6:00 */
function instalarActivador() {
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === "revisarAlertas") ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger("revisarAlertas").timeBased().everyDays(1).atHour(6).inTimezone(TZ).create();
  sheet();   // crea la hoja si no existe
}

/* ---------- Correo ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
}

function sendMail(to, subject, lines, o) {
  var t = tx(o.lang), url = webAppUrl();
  var unsub = url && o.token ? url + "?action=unsubscribe&email=" + encodeURIComponent(to) + "&token=" + encodeURIComponent(o.token) : "";
  var html = '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto;color:#1b2620">' +
    '<div style="background:#1b5e3a;color:#fff;padding:16px 20px;border-radius:14px 14px 0 0;font-size:18px;font-weight:700">🌱 Cochabamba Resiliente</div>' +
    '<div style="border:1px solid #e4dfd3;border-top:0;border-radius:0 0 14px 14px;padding:18px 20px;background:#fff">' +
    (o.mun ? '<p style="margin:0 0 12px;color:#5c675f">' + esc(t.farm) + ": <b>" + esc(o.mun) + "</b></p>" : "") +
    lines.map(function (l) { return '<p style="margin:0 0 10px;padding:12px 14px;border-radius:10px;background:#f4f2eb;font-size:16px">' + esc(l) + "</p>"; }).join("") +
    '<p style="margin:16px 0 0;font-size:13px;color:#5c675f">' + esc(t.source) + "</p>" +
    (unsub ? '<p style="margin:10px 0 0;font-size:13px"><a href="' + esc(unsub) + '" style="color:#1f6f43">' + esc(t.unsub) + "</a></p>" : "") +
    "</div></div>";
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: html, body: lines.join("\n\n") + (unsub ? "\n\n" + t.unsub + ": " + unsub : ""), name: "Cochabamba Resiliente" });
}

/* ---------- Chat con IA (OpenAI) ----------
   Propiedades del script (Configuración del proyecto → Propiedades del script):
   OPENAI_API_KEY (obligatoria), OPENAI_MODEL (opcional), CHAT_DAILY_LIMIT (opcional, 300 por defecto) */
var SERVER_PROMPT = "Eres «Cosecha», asistente de una app para agricultores de Cochabamba, Bolivia. " +
  "Solo hablas de agricultura, clima, riesgos (sequía, helada, lluvias, incendios), ganadería y uso de la app. " +
  "Si te piden otra cosa, explica con amabilidad que solo ayudas con temas del campo. " +
  "Habla muy sencillo, frases cortas, máximo 110 palabras. No inventes cifras, precios ni teléfonos.";

function chat(messages) {
  var props = PropertiesService.getScriptProperties(), key = props.getProperty("OPENAI_API_KEY");
  if (!key) return { error: "El chat con IA no está configurado (falta OPENAI_API_KEY)", code: "no_key" };
  if (!Array.isArray(messages) || !messages.length) return { error: "Mensaje vacío" };

  // Límite diario para cuidar el costo
  var limit = Number(props.getProperty("CHAT_DAILY_LIMIT") || 300), countKey = "chat_" + today();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var count = Number(props.getProperty(countKey) || 0);
    if (count >= limit) return { error: "Se alcanzó el límite diario del chat" };
    props.setProperty(countKey, String(count + 1));
  } finally {
    lock.releaseLock();
  }

  // El contexto que manda la app (idioma y datos de la granja) se agrega a las reglas del servidor
  var client = messages.filter(function (m) { return m && m.role === "system"; })[0];
  var convo = messages.filter(function (m) { return m && (m.role === "user" || m.role === "assistant"); }).slice(-10)
    .map(function (m) { return { role: m.role, content: String(m.content || "").slice(0, 2000) }; });
  if (!convo.length) return { error: "Mensaje vacío" };
  var sys = SERVER_PROMPT + (client ? "\n\nIndicaciones y contexto de la app:\n" + String(client.content || "").slice(0, 2500) : "");

  var res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + key },
    payload: JSON.stringify({ model: props.getProperty("OPENAI_MODEL") || "gpt-5.3-chat-latest", messages: [{ role: "system", content: sys }].concat(convo) }),
    muteHttpExceptions: true
  });
  var j = JSON.parse(res.getContentText() || "{}");
  if (j.error) return { error: j.error.message || "Error de OpenAI" };
  return { text: j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : "" };
}

/** Borra los contadores del chat de días anteriores (se llama desde revisarAlertas) */
function limpiarContadores() {
  var props = PropertiesService.getScriptProperties(), keep = "chat_" + today();
  Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf("chat_") === 0 && k !== keep) props.deleteProperty(k); });
}
