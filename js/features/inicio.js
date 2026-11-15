/* =========================================================
   Inicio: portada, resumen de la granja, primeros pasos y accesos
   ========================================================= */

function renderHome() {
  renderHeroActions();
  renderHomeFarm();
  $("home-grid").innerHTML = featureCards(VIEWS.filter(function (v) { return v.id !== "inicio"; }));
}

/* Botones de la portada según lo que el usuario ya hizo */
function renderHeroActions() {
  var h;
  if (farmReady()) {
    h = linkBtn("stats", "chart", t("hGoStats"), "btn-hero") + linkBtn("alertas", "bell", t("hGoAlerts"), "btn-hero-2");
  } else if (hasLocation()) {
    h = linkBtn("granja", "sprout", t("hGoCrop"), "btn-hero") + linkBtn("mapa", "map", t("hSeeMap"), "btn-hero-2");
  } else {
    h = linkBtn("mapa", "pin", t("hMark"), "btn-hero") +
      '<button type="button" class="btn btn-hero-2" data-act="gps-home">' + icon("locate") + "<span>" + esc(t("useGps")) + "</span></button>";
  }
  $("hero-actions").innerHTML = h;
}

function homeSteps() {
  return [
    { done: hasLocation(), label: t("st1"), view: "mapa" },
    { done: !!FARM.k, label: t("st2"), view: "granja" },
    { done: !!cachedStats(), label: t("st3"), view: "stats" },
    { done: !!ls("sub"), label: t("st4"), view: "alertas" }
  ];
}

function renderHomeFarm() {
  var steps = homeSteps();
  var done = steps.filter(function (s) { return s.done; }).length;
  var farmCard = hasLocation() ? homeFarmCard() : "";
  var stepsCard = "";
  if (done < steps.length) {
    stepsCard = '<div class="card">' +
      '<div class="card-head"><h3>' + esc(t("stT")) + '</h3><span class="note">' + esc(t("stP", done)) + "</span></div>" +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="' + done + '"><i style="width:' + done * 25 + '%"></i></div>' +
      '<ol class="steps">' + steps.map(function (s, i) {
        return '<li class="' + (s.done ? "done" : "") + '"><a href="#/' + s.view + '">' +
          '<span class="step-dot">' + (s.done ? icon("check") : i + 1) + '</span><span class="step-t">' + esc(s.label) + "</span>" +
          icon("arrow", "step-go") + "</a></li>";
      }).join("") + "</ol></div>";
  }
  $("home-farm").innerHTML = '<div class="home-cols' + (farmCard && stepsCard ? " two" : "") + '">' + farmCard + stepsCard + "</div>";
}

/* Resumen de la granja: riesgos (estimados o calculados con datos NASA guardados) y accesos */
function homeFarmCard() {
  var m = farmMun(), c = cachedStats();
  var levels = [0, 1, 2, 3].map(function (k) { return c ? c.s.lv[KEYS[k]] : m[4][k]; });
  var overall = Math.max.apply(null, levels);
  var detail = m[0] + " · " + t("t_" + m[3]) + (FARM.k ? " · " + cropName(FARM.k) : "");
  return '<div class="card farm-card">' +
    '<div class="farm-head"><span class="farm-ic" aria-hidden="true">' + (FARM.k ? CROP_ICON[FARM.k] : "📍") + "</span>" +
    '<div><p class="eyebrow">' + esc(t("farmT")) + "</p><h3>" + esc(farmName()) + '</h3><p class="sub">' + esc(detail) + "</p></div>" +
    levelBadge(overall) + "</div>" +
    '<div class="risk-grid">' + levels.map(function (l, k) { return riskTile(k, l); }).join("") + "</div>" +
    '<p class="note" style="margin-top:12px">' + esc(c ? t("farmNasa", fmtDay(c.s.fecha)) : t("farmEst")) + "</p>" +
    '<div class="actions">' +
    (FARM.k ? linkBtn("stats", "chart", t("tabData"), "btn-secondary btn-sm") : linkBtn("granja", "sprout", t("hGoCrop"), "btn-primary btn-sm")) +
    linkBtn("alertas", "bell", t("nAlertas"), "btn-ghost btn-sm") +
    linkBtn("chat", "chat", t("askC"), "btn-ghost btn-sm") +
    "</div></div>";
}

ACTIONS["gps-home"] = function () { gps(function () { go("granja"); }); };

VIEW_HOOKS.inicio = renderHome;
