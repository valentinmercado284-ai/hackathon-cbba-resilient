/* =========================================================
   Navegación entre pantallas
   - Cada pantalla tiene una ruta con #: index.html#/mapa
     (así funcionan el botón «atrás» y los enlaces directos)
   - VIEW_HOOKS[id] se ejecuta cada vez que se muestra la pantalla
   ========================================================= */

/* nav: texto corto del menú · title/desc: tarjetas · tab: pestaña inferior · top: menú superior */
var VIEWS = [
  { id: "inicio", nav: "nInicio", title: "vi", icon: "home", tab: true, top: true },
  { id: "mapa", nav: "nMapa", title: "vm", desc: "dm", icon: "map", tab: true, top: true },
  { id: "granja", nav: "nGranja", title: "vg", desc: "dg", icon: "sprout", tab: true, top: true },
  { id: "stats", nav: "vs", title: "vs", desc: "ds", icon: "chart", parent: "granja" },
  { id: "alertas", nav: "nAlertas", title: "va", desc: "da", icon: "bell", tab: true, top: true },
  { id: "chat", nav: "nChat", title: "vc", desc: "dc", icon: "chat", tab: true, top: true },
  { id: "aprende", nav: "nAprende", title: "vl", desc: "dl", icon: "book", top: true },
  { id: "compartir", nav: "nCompartir", title: "vh", desc: "dh", icon: "share", top: true }
];
var VIEW_HOOKS = {};
var CURRENT = null;

function viewById(id) {
  for (var i = 0; i < VIEWS.length; i++) if (VIEWS[i].id === id) return VIEWS[i];
  return null;
}

function viewFromHash() {
  var id = (location.hash || "").replace(/^#\/?/, "");
  return viewById(id) ? id : null;
}

/** «Mi granja» abre los datos NASA si la granja ya está guardada */
function navTarget(v) {
  return v.id === "granja" && farmReady() ? "stats" : v.id;
}

/** Ir a una pantalla (cambia la dirección y la muestra) */
function go(id) {
  if (!viewById(id)) id = "inicio";
  closeMenu();
  if (viewFromHash() !== id) location.hash = "#/" + id;
  else showView(id);
}

function showView(id) {
  CURRENT = id;
  VIEWS.forEach(function (v) {
    var el = $("v-" + v.id);
    if (el) el.hidden = v.id !== id;
  });
  markNav();
  var v = viewById(id);
  document.title = (id === "inicio" ? "" : t(v.title) + " · ") + "Cochabamba Resiliente";
  window.scrollTo(0, 0);
  if (VIEW_HOOKS[id]) VIEW_HOOKS[id]();
}

function markNav() {
  var cur = viewById(CURRENT);
  var active = cur ? cur.parent || cur.id : null;
  $$("[data-nav]").forEach(function (a) {
    if (a.getAttribute("data-nav") === active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

/** Tarjetas de acceso a las secciones (inicio y menú) */
function featureCards(list) {
  return list.map(function (v) {
    return '<a class="feature" href="#/' + v.id + '"><span class="feature-ic">' + icon(v.icon) + "</span>" +
      '<span class="feature-body"><b>' + esc(t(v.title)) + "</b><span>" + esc(t(v.desc)) + "</span></span>" +
      icon("arrow", "feature-go") + "</a>";
  }).join("");
}

function renderNav() {
  $("topnav").innerHTML = VIEWS.filter(function (v) { return v.top; }).map(function (v) {
    return '<a href="#/' + navTarget(v) + '" data-nav="' + v.id + '">' + esc(t(v.nav)) + "</a>";
  }).join("");
  $("tabbar").innerHTML = VIEWS.filter(function (v) { return v.tab; }).map(function (v) {
    return '<a href="#/' + navTarget(v) + '" data-nav="' + v.id + '"><span class="pill">' + icon(v.icon) +
      '</span><span class="lbl">' + esc(t(v.nav)) + "</span></a>";
  }).join("");
  $("menu-grid").innerHTML = featureCards(VIEWS.filter(function (v) { return v.id !== "inicio"; }));
  markNav();
}

/* Menú con todas las secciones */
function openMenu() {
  $("menu").hidden = false;
  document.body.classList.add("no-scroll");
  $("menu-close").focus();
}
function closeMenu() {
  if ($("menu").hidden) return;
  $("menu").hidden = true;
  document.body.classList.remove("no-scroll");
}

ACTIONS["menu-open"] = openMenu;
ACTIONS["menu-close"] = closeMenu;

window.addEventListener("hashchange", function () {
  closeMenu();
  showView(viewFromHash() || "inicio");
});
