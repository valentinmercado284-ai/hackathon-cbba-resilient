/* =========================================================
   Mi granja: ubicación, cultivo y detalles del terreno
   ========================================================= */

/* Pestañas «Datos NASA | Editar granja» (solo cuando la granja ya está guardada) */
function renderFarmTabs(elId, active) {
  var el = $(elId);
  if (!farmReady()) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML =
    '<a class="seg-btn" href="#/stats"' + (active === "stats" ? ' aria-current="page"' : "") + ">" + icon("chart") + esc(t("tabData")) + "</a>" +
    '<a class="seg-btn" href="#/granja"' + (active === "granja" ? ' aria-current="page"' : "") + ">" + icon("edit") + esc(t("tabEdit")) + "</a>";
}

/* Recuadro de ubicación: dónde está marcada la granja y cómo cambiarla */
function renderLocBox() {
  var el = $("loc-box"), m = farmMun();
  if (!m) {
    el.innerHTML = '<p class="sub">' + esc(t("fLocHint")) + "</p>" +
      '<div class="actions">' + linkBtn("mapa", "map", t("fB"), "btn-primary") +
      '<button type="button" class="btn btn-secondary" data-act="gps">' + icon("locate") + "<span>" + esc(t("useGps")) + "</span></button></div>";
  } else {
    el.innerHTML = '<div class="callout ok" style="margin:0">' + icon("pin") + "<div><b>" + esc(m[0]) + "</b>" +
      "<p>" + (FARM.approx ? esc(t("fApprox")) : esc(FARM.lat.toFixed(4) + ", " + FARM.lon.toFixed(4))) + "</p></div></div>" +
      '<div class="actions">' + linkBtn("mapa", "map", t("fChange"), "btn-ghost btn-sm") +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="gps">' + icon("locate") + "<span>" + esc(t("useGps")) + "</span></button></div>";
    $("f-m").value = FARM.mun;
  }
}

/* Lee el formulario (también sirve para no perder lo escrito al cambiar de idioma) */
function readFarmForm() {
  var crop = $$('input[name="crop"]:checked')[0], irr = $$('input[name="irr"]:checked')[0];
  return {
    mun: $("f-m").value, n: $("f-n").value.trim(), k: crop ? crop.value : "", h: $("f-h").value,
    r: irr ? irr.value : "", p: $("f-p").value, s: $("f-s").value,
    a: $("f-a").value, d: $("f-d").value, w: $("f-w").value
  };
}

function renderFarmForm(src) {
  var f = src || FARM;
  renderFarmTabs("tabs-granja", "granja");
  $("f-m").innerHTML = M.map(function (m, i) { return '<option value="' + i + '">' + esc(m[0]) + "</option>"; }).join("");
  if (f.mun !== undefined && f.mun !== "") $("f-m").value = f.mun;
  renderLocBox();
  if (src && src.mun !== "") $("f-m").value = src.mun;

  $("f-k").innerHTML = Object.keys(CROPS).map(function (k) {
    return '<label class="tile"><input type="radio" name="crop" value="' + k + '"' + (f.k === k ? " checked" : "") + ">" +
      '<span class="tile-body"><span class="tile-ic" aria-hidden="true">' + CROP_ICON[k] + '</span><span class="tile-t">' + esc(t("c_" + k)) + "</span></span></label>";
  }).join("");
  $("f-r").innerHTML = tl("ir").map(function (x, i) {
    return '<label class="opt"><input type="radio" name="irr" value="' + i + '"' + (String(f.r) === String(i) ? " checked" : "") + "><span>" + esc(x) + "</span></label>";
  }).join("");
  $("f-p").innerHTML = tl("sl").map(function (x, i) { return '<option value="' + i + '">' + esc(x) + "</option>"; }).join("");
  $("f-s").innerHTML = tl("so").map(function (x, i) { return '<option value="' + i + '">' + esc(x) + "</option>"; }).join("");
  if (f.p !== undefined && f.p !== "") $("f-p").value = f.p;
  if (f.s !== undefined && f.s !== "") $("f-s").value = f.s;
  $("f-n").value = f.n || "";
  $("f-h").value = f.h || "";
  ["a", "d", "w"].forEach(function (x) { $("f-" + x).value = f[x] || ""; });
  $("f-crop-err").hidden = true;
  resetDeleteButton();
}

function onFarmSubmit(e) {
  e.preventDefault();
  var d = readFarmForm();
  if (!d.k) {
    $("f-crop-err").hidden = false;
    $("f-k").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  var mi = +d.mun;
  // Si no hay punto marcado (o se eligió otro municipio), se usa el centro del municipio
  if (!hasLocation() || near(FARM.lat, FARM.lon) !== mi) {
    FARM.lat = M[mi][2];
    FARM.lon = M[mi][1];
    FARM.approx = true;
    FS = null;
    FC = null;
  }
  FARM.mun = mi;
  FARM.n = d.n; FARM.k = d.k; FARM.h = d.h; FARM.r = d.r; FARM.p = d.p; FARM.s = d.s;
  FARM.a = d.a; FARM.d = d.d; FARM.w = d.w;
  FARM.saved = Date.now();
  saveFarmState();
  if (MAPOK) draw();
  toast(t("fOk"), "ok");
  renderNav();
  go("stats");
}

/* Borrar pide confirmación tocando dos veces */
function resetDeleteButton() {
  var b = $("f-del");
  clearTimeout(b._timer);
  b.classList.remove("confirm");
  b.textContent = t("fDel");
  b.hidden = !hasLocation();
}

ACTIONS["farm-delete"] = function (b) {
  if (!b.classList.contains("confirm")) {
    b.classList.add("confirm");
    b.textContent = t("fDelSure");
    clearTimeout(b._timer);
    b._timer = setTimeout(resetDeleteButton, 4000);
    return;
  }
  FARM = {};
  FS = null;
  FC = null;
  saveFarmState();
  lsDropPrefix("nasa:");
  lsDropPrefix("fc:");
  if (MAPOK) draw();
  renderNav();
  renderFarmForm();
  toast(t("fDeleted"));
};

$("farm-form").addEventListener("submit", onFarmSubmit);
$("f-k").addEventListener("change", function () { $("f-crop-err").hidden = true; });

VIEW_HOOKS.granja = function () { renderFarmForm(); };
