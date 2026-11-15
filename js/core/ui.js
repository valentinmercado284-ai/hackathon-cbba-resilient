/* =========================================================
   Piezas de interfaz reutilizables: insignias de riesgo,
   estados vacíos, cargas y errores
   ========================================================= */

/** Insignia de nivel: Ninguno / Bajo / Medio / Alto */
function levelBadge(level) {
  return '<span class="lv lv' + level + '"><i aria-hidden="true"></i>' + esc(t("l" + level)) + "</span>";
}

/** Tarjeta de un riesgo con su nivel: «🌵 Sequía · Alto» */
function riskTile(k, level) {
  return '<div class="risk-tile"><b>' + esc(t("h" + k)) + "</b>" + levelBadge(level) + "</div>";
}

/** Botón-enlace a una pantalla */
function linkBtn(view, iconName, label, cls) {
  return '<a class="btn ' + (cls || "btn-primary") + '" href="#/' + view + '">' + (iconName ? icon(iconName) : "") + "<span>" + esc(label) + "</span></a>";
}

/** Estado vacío con título, texto y acciones */
function emptyState(emoji, title, text, actionsHtml) {
  return '<div class="card empty"><span class="empty-ic" aria-hidden="true">' + emoji + "</span><h3>" + esc(title) + "</h3>" +
    (text ? "<p>" + esc(text) + "</p>" : "") + (actionsHtml ? '<div class="actions">' + actionsHtml + "</div>" : "") + "</div>";
}

/** Bloques de carga animados */
function skeleton(message, blocks) {
  var h = '<div class="card"><div class="loading-row"><span class="spinner" aria-hidden="true"></span><span>' + esc(message) + "</span></div>";
  for (var i = 0; i < (blocks || 2); i++) h += '<div class="skel skel-line" style="width:' + (90 - i * 18) + '%"></div>';
  return h + '</div><div class="skel skel-block" aria-hidden="true"></div>';
}

/** Aviso de error con botón para reintentar (acción registrada en ACTIONS) */
function errorBox(message, retryAction) {
  return '<div class="callout warn" role="alert">' + icon("offline") + "<div><p>" + esc(message) + "</p>" +
    (retryAction ? '<div class="actions"><button type="button" class="btn btn-ghost btn-sm" data-act="' + retryAction + '">' + icon("refresh") + esc(t("retry")) + "</button></div>" : "") +
    "</div></div>";
}
