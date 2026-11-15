/* =========================================================
   Datos de Cochabamba: municipios, cultivos y riesgos
   ========================================================= */

/* Municipios: [nombre, longitud, latitud, zona, riesgos, producción típica, mostrar nombre sin zoom]
   - zona: "valle" | "alto" | "seco" | "trop"
   - riesgos (0 ninguno … 3 alto): [sequía, incendio, inundación, helada]
     Estimación basada en SENAMHI, UMSA y CIPCA; con datos NASA se recalcula para tu granja. */
var M = [
  ["Cochabamba", -66.157, -17.394, "valle", [3, 2, 2, 1], ["hort", "p_flor"], 1],
  ["Sacaba", -66.04, -17.40, "valle", [3, 2, 1, 1], ["maiz", "papa", "hort"], 0],
  ["Tiquipaya", -66.22, -17.34, "valle", [3, 2, 2, 1], ["p_flor", "hort", "papa"], 0],
  ["Quillacollo", -66.28, -17.40, "valle", [3, 2, 2, 1], ["hort", "maiz", "p_leche"], 0],
  ["Sipe Sipe", -66.35, -17.45, "valle", [3, 2, 1, 1], ["maiz", "hort", "frut"], 0],
  ["Tapacarí", -66.40, -17.52, "alto", [3, 1, 1, 3], ["papa", "haba", "p_gan"], 0],
  ["Morochata", -66.37, -17.25, "alto", [3, 1, 1, 3], ["papa", "haba", "trigo"], 0],
  ["Independencia", -66.80, -17.08, "alto", [3, 1, 1, 3], ["papa", "trigo", "p_gan"], 1],
  ["Capinota", -66.26, -17.71, "valle", [3, 2, 1, 1], ["hort", "frut", "maiz"], 1],
  ["Arque", -66.40, -17.80, "alto", [3, 2, 1, 2], ["papa", "trigo", "maiz"], 0],
  ["Cliza", -65.93, -17.59, "valle", [3, 2, 1, 1], ["maiz", "papa", "p_leche"], 0],
  ["Punata", -65.83, -17.54, "valle", [3, 2, 1, 1], ["maiz", "papa", "p_leche"], 1],
  ["Tarata", -66.02, -17.61, "valle", [3, 2, 1, 1], ["maiz", "papa", "frut"], 0],
  ["Arani", -65.77, -17.57, "valle", [3, 2, 1, 1], ["maiz", "papa", "p_leche"], 0],
  ["Colomi", -65.35, -17.35, "alto", [2, 1, 2, 2], ["papa", "p_trucha"], 0],
  ["Totora", -65.18, -17.67, "seco", [3, 2, 1, 2], ["maiz", "papa", "p_gan"], 0],
  ["Mizque", -65.33, -17.94, "seco", [3, 2, 1, 2], ["maiz", "p_mani", "p_gan"], 0],
  ["Aiquile", -65.18, -18.20, "seco", [3, 2, 1, 2], ["maiz", "p_mani", "p_gan"], 1],
  ["Pojo", -64.88, -17.78, "seco", [3, 2, 1, 1], ["maiz", "papa", "p_gan"], 0],
  ["Villa Tunari", -65.42, -16.97, "trop", [2, 1, 3, 0], ["ban", "p_pina", "p_palmito"], 1],
  ["Shinahota", -65.30, -16.98, "trop", [2, 1, 3, 0], ["ban", "p_pina", "p_cit"], 0],
  ["Chimoré", -65.14, -16.99, "trop", [2, 1, 3, 0], ["ban", "p_pina", "p_cit"], 0],
  ["Puerto Villarroel", -64.80, -16.85, "trop", [2, 2, 3, 0], ["p_gan", "ban", "p_pesca"], 1]
];

/* Cultivos: [agua por temporada (mm), días de la temporada, sensible a helada (1 sí / 0 no)]
   Valores orientativos generales. */
var CROPS = {
  maiz: [650, 150, 1],
  papa: [550, 130, 1],
  trigo: [500, 130, 1],
  haba: [400, 120, 1],
  hort: [450, 100, 1],
  alfa: [1000, 365, 0],
  frut: [800, 365, 1],
  ban: [1400, 365, 0],
  gan: [700, 365, 0]
};
var CROP_ICON = { maiz: "🌽", papa: "🥔", trigo: "🌾", haba: "🌱", hort: "🥬", alfa: "🌿", frut: "🍑", ban: "🍌", gan: "🐄" };

/* Colores del mapa por nivel de riesgo (0 ninguno, 1 bajo, 2 medio, 3 alto)
   y claves de cada riesgo: s sequía, i incendio, f inundación, h helada */
var HC = ["#9aa0a6", "#2e7d32", "#d98200", "#c62828"];
var KEYS = ["s", "i", "f", "h"];
