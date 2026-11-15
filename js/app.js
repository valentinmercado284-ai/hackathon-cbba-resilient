/* =========================================================
   Arranque de la app: idioma, clics en botones, conexión,
   instalación (service worker) y primera pantalla
   ========================================================= */

/** Pone los textos del idioma activo en los elementos con data-i / data-h / data-p / data-a */
function applyLang() {
  document.documentElement.lang = LANG;
  $$("[data-i]").forEach(function (e) { e.textContent = t(e.getAttribute("data-i")); });
  $$("[data-h]").forEach(function (e) { e.innerHTML = t(e.getAttribute("data-h")); });
  $$("[data-p]").forEach(function (e) { e.placeholder = t(e.getAttribute("data-p")); });
  $$("[data-a]").forEach(function (e) {
    var v = t(e.getAttribute("data-a"));
    e.setAttribute("aria-label", v);
    if (e.tagName === "BUTTON") e.title = v;
  });
  renderLangSwitch();
  renderNav();
}

function renderLangSwitch() {
  $("lang-sel").innerHTML = LANGS.map(function (l) {
    return '<option value="' + l[0] + '"' + (l[0] === LANG ? " selected" : "") + ">" + l[2] + "</option>";
  }).join("");
  $("lang-seg").innerHTML = LANGS.map(function (l) {
    return '<button type="button" data-act="lang" data-lang="' + l[0] + '" aria-pressed="' + (l[0] === LANG) + '" title="' + l[2] + '">' + l[1] + "</button>";
  }).join("");
}

function setLang(l) {
  if (!T[l] || l === LANG) return;
  var draft = CURRENT === "granja" ? readFarmForm() : null;
  LANG = l;
  ls("lang", l);
  if (CH.length === 1 && CH[0].hello) CH = [];   // el saludo se muestra en el idioma nuevo
  applyLang();
  var v = viewById(CURRENT);
  if (v) document.title = (CURRENT === "inicio" ? "" : t(v.title) + " · ") + "Cochabamba Resiliente";
  // Vuelve a dibujar la pantalla actual sin perder lo que el usuario estaba haciendo
  if (CURRENT === "granja") renderFarmForm(draft);
  else if (CURRENT === "mapa") { renderMapUI(); renderMapInfo(); draw(); }
  else if (CURRENT === "stats" && FS) { renderFarmTabs("tabs-stats", "stats"); $("stats").innerHTML = statsHtml(FS); }
  else if (CURRENT && VIEW_HOOKS[CURRENT]) VIEW_HOOKS[CURRENT]();
}

ACTIONS.lang = function (el) { setLang(el.getAttribute("data-lang")); };
$("lang-sel").addEventListener("change", function () { setLang(this.value); });

/* Un solo detector de clics para todos los botones con data-act="…" */
document.addEventListener("click", function (e) {
  var el = e.target.closest && e.target.closest("[data-act]");
  if (!el) return;
  var fn = ACTIONS[el.getAttribute("data-act")];
  if (fn) fn(el, e);
});

/* Menú: se cierra con Escape o al elegir una sección */
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
ACTIONS["menu-backdrop"] = function (el, e) {
  if (e.target === el || (e.target.closest && e.target.closest("a[href^='#/']"))) closeMenu();
};

/* Aviso cuando no hay internet */
function updateNet() { $("net").hidden = navigator.onLine !== false; }
window.addEventListener("offline", updateNet);
window.addEventListener("online", function () { updateNet(); toast(t("online"), "ok"); });

/* Instalable en el teléfono y usable sin internet: solo cuando la app está publicada (http/https).
   Al abrir index.html con doble clic (file://) no se activa, para evitar errores del navegador. */
if (/^https?:$/.test(location.protocol)) {
  var manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "manifest.webmanifest";
  document.head.appendChild(manifest);
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* sin service worker la app igual funciona */ });
    });
  }
}

applyLang();
updateNet();
showView(viewFromHash() || "inicio");
