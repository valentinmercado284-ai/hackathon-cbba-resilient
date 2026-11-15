/* =========================================================
   Estado compartido de la app
   - FARM: la granja guardada en este dispositivo
   - FS:   indicadores NASA POWER de la granja (services/nasa-power.js)
   - FC:   pronóstico de 7 días (services/forecast.js)
   ========================================================= */

/* Campos de FARM:
   lat, lon  ubicación        mun  índice del municipio en M     approx  true si es el centro del municipio
   n nombre   k cultivo        h hectáreas      r riego (índice)  p pendiente  s suelo
   a altitud  d fecha de siembra  w agua para riego (litros/semana)  saved fecha de guardado */
var FARM = lsGet("farm", {}) || {};
var FS = null;
var FC = null;

function saveFarmState() { lsSet("farm", FARM); }

function hasLocation() { return typeof FARM.lat === "number" && typeof FARM.lon === "number"; }

/** La granja está completa cuando tiene ubicación y cultivo */
function farmReady() { return hasLocation() && !!FARM.k; }

/** Municipio de la granja (o null) */
function farmMun() { return hasLocation() && M[FARM.mun] ? M[FARM.mun] : null; }

/** Clave corta de la ubicación, para guardar datos descargados */
function farmKey() { return FARM.lat.toFixed(3) + "," + FARM.lon.toFixed(3); }

function farmName() { return FARM.n || t("vg"); }

/** Nombre de un cultivo o producto (maiz, p_leche…) en el idioma activo */
function cropName(k) { return t(CROPS[k] ? "c_" + k : k); }

/** Nivel de riesgo k (0 sequía … 3 helada) para un municipio.
    Si es el municipio de la granja y hay datos NASA, usa el cálculo de la granja. */
function riskLevel(m, k) {
  var mine = FS && FS.lv && hasLocation() && M[FARM.mun] === m;
  return mine ? FS.lv[KEYS[k]] : m[4][k];
}
