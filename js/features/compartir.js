/* =========================================================
   Compartir: enlace, código QR, WhatsApp y menú de compartir del teléfono
   ========================================================= */

/** Enlace público: el de config.js o la dirección actual si la app está en internet */
function shareUrl() {
  if (CFG.PUBLIC) return CFG.PUBLIC;
  return /^https?:/.test(location.href) ? location.href.split("#")[0] : "";
}

function renderShare() {
  if (!$("shu").value) $("shu").value = shareUrl();
  $("sh-native").hidden = !navigator.share;
  updateQr();
}

function updateQr() {
  var u = $("shu").value.trim(), im = $("qr"), empty = $("qr-empty"), valid = /^https?:\/\/\S+\.\S+/i.test(u);
  $("shwa").href = "https://wa.me/?text=" + encodeURIComponent(t("shMsg") + (valid ? " " + u : ""));
  im.hidden = !valid;
  empty.hidden = valid;
  if (!valid) { empty.textContent = t("shNoUrl"); return; }
  if (CFG.QR && u === CFG.PUBLIC) { im.src = CFG.QR; return; }
  im.onerror = function () {
    if (CFG.QR && im.src.indexOf(CFG.QR) < 0) { im.src = CFG.QR; return; }
    im.hidden = true;
    empty.hidden = false;
    empty.textContent = t("shQrFail");
  };
  im.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=" + encodeURIComponent(u);
}

ACTIONS["share-copy"] = function () {
  var input = $("shu"), v = input.value.trim();
  if (!v) { input.focus(); return; }
  function fallback() { input.select(); try { document.execCommand("copy"); toast(t("shOk"), "ok"); } catch (e) { /* sin portapapeles */ } }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(v).then(function () { toast(t("shOk"), "ok"); }, fallback);
  } else {
    fallback();
  }
};

ACTIONS["share-native"] = function () {
  var u = $("shu").value.trim();
  navigator.share({ title: "Cochabamba Resiliente", text: t("shMsg"), url: u || undefined }).catch(function () { /* cancelado */ });
};

// Actualiza el QR medio segundo después de dejar de escribir
$("shu").addEventListener("input", function () {
  clearTimeout(updateQr.timer);
  updateQr.timer = setTimeout(updateQr, 500);
});

VIEW_HOOKS.compartir = renderShare;
