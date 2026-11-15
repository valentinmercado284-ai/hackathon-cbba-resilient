/* =========================================================
   Motor de idiomas
   - t("clave", a, b) devuelve el texto y reemplaza {0}, {1}…
   - tl("clave") devuelve una lista (textos separados por "|")
   - Si un texto falta en un idioma, se usa el español.
   ========================================================= */
var LANGS = [["es", "ES", "Español"], ["en", "EN", "English"], ["qu", "QU", "Runasimi"]];

var LANG = ls("lang") || ((navigator.language || "es").slice(0, 2) === "en" ? "en" : "es");
if (!T[LANG]) LANG = "es";

function t(k) {
  var s = T[LANG][k] !== undefined ? T[LANG][k] : T.es[k];
  if (s === undefined) return k;
  for (var i = 1; i < arguments.length; i++) s = s.split("{" + (i - 1) + "}").join(arguments[i]);
  return s;
}

function tl(k) { return t(k).split("|"); }

/** Configuración regional para fechas y números (el quechua usa la de Bolivia) */
function locale() { return LANG === "en" ? "en-US" : "es-BO"; }
