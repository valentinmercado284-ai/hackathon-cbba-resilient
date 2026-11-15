/* =========================================================
   Aprende: qué hacer según cada riesgo y de dónde vienen los datos
   ========================================================= */

function renderLearn() {
  // [riesgo (h0…h3), consejos (a_s, a_h, a_f, a_i)]
  var order = [[0, "s"], [3, "h"], [2, "f"], [1, "i"]];
  $("learn").innerHTML = order.map(function (p, i) {
    return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(t("h" + p[0])) + "</summary>" +
      '<ul class="check-list">' + tl("a_" + p[1]).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></details>";
  }).join("");
  // Estos textos traen <b> desde los archivos de idioma (contenido propio de la app)
  $("lsrc").innerHTML = tl("lsrc").map(function (x) { return "<li>" + x + "</li>"; }).join("");
}

VIEW_HOOKS.aprende = renderLearn;
