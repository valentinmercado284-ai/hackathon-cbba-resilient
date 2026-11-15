/* =========================================================
   Pronóstico del tiempo para la granja (Open-Meteo)
   La NASA no publica pronósticos por punto, por eso se usa Open-Meteo.
   Se guarda 1 hora en el dispositivo.
   ========================================================= */

/* Códigos del tiempo (WMO) → icono y texto (wx0…wx8 en los idiomas) */
var WX = [
  [[0], "☀️", 0], [[1, 2], "⛅", 1], [[3], "☁️", 2], [[45, 48], "🌫️", 3],
  [[51, 53, 55, 56, 57], "🌦️", 4], [[61, 63, 65, 66, 67], "🌧️", 5],
  [[71, 73, 75, 77, 85, 86], "🌨️", 6], [[80, 81, 82], "🌦️", 7], [[95, 96, 99], "⛈️", 8]
];
function wxInfo(code) {
  for (var i = 0; i < WX.length; i++) if (WX[i][0].indexOf(code) >= 0) return { ic: WX[i][1], label: t("wx" + WX[i][2]) };
  return { ic: "🌡️", label: "" };
}

function forecastKey() { return "fc:" + farmKey(); }

function forecastFromRecord(rec, stale) {
  var f = rec.f;
  f.at = rec.at;
  f.stale = !!stale;
  return f;
}

/**
 * Carga el pronóstico de 7 días en FC.
 * @param {boolean} force  descargar de nuevo aunque haya uno reciente
 */
async function loadForecast(force) {
  var key = forecastKey(), c = lsGet(key, null);
  if (c && c.f && !force && Date.now() - c.at < 3600e3) return (FC = forecastFromRecord(c));
  var ac = new AbortController(), timer = setTimeout(function () { ac.abort(); }, 20000);
  try {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + FARM.lat + "&longitude=" + FARM.lon +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max" +
      "&forecast_days=7&timezone=auto";
    var r = await fetch(url, { signal: ac.signal });
    if (!r.ok) throw new Error("Open-Meteo " + r.status);
    var d = (await r.json()).daily;
    var f = {
      days: d.time.map(function (day, i) {
        return {
          date: day,
          code: d.weather_code[i],
          tmax: d.temperature_2m_max[i],
          tmin: d.temperature_2m_min[i],
          rain: d.precipitation_sum[i],
          prob: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null
        };
      })
    };
    var rec = { at: Date.now(), f: f };
    lsDropPrefix("fc:", key);
    lsSet(key, rec);
    return (FC = forecastFromRecord(rec));
  } catch (e) {
    if (c && c.f) return (FC = forecastFromRecord(c, true));
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Alertas del pronóstico: lluvia fuerte mañana (≥ 15 mm) y helada en los próximos 2 días (≤ 2 °C) */
function forecastAlerts(f) {
  var out = [], d = f.days;
  if (d[1] && d[1].rain >= 15) {
    out.push({ kind: "rain", level: d[1].rain >= 30 ? 3 : 2, text: t("aRain", Math.round(d[1].rain)) });
  }
  var mins = [d[1], d[2]].filter(Boolean).map(function (x) { return x.tmin; }).filter(function (v) { return v != null; });
  if (mins.length) {
    var mn = Math.min.apply(null, mins);
    if (mn <= 2) out.push({ kind: "frost", level: mn <= 0 ? 3 : 2, text: t("aFrost", num(mn, 1)) });
  }
  return out;
}
