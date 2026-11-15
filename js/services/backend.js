/* =========================================================
   Conexión con el servicio de la app (Google Apps Script)
   Ver backend/README.md para publicarlo.
   - api("subscribe" | "test" | "unsubscribe", datos): alertas por correo
   - llmChat(mensajes): chat con IA
   ========================================================= */

/** Dirección del servicio: la guardada por un administrador en este navegador o la de config.js */
function apiUrl() { return (ls("api") || CFG.API || "").trim(); }

/* ¿El servicio tiene IA? Se recuerda 1 día lo que respondió (si un día se agrega la clave, se vuelve a probar) */
function serviceHasAi() {
  var r = lsGet("apiAi", null);
  return !(r && r.v === 0 && Date.now() - r.at < 864e5);
}
function rememberServiceAi(hasAi) { lsSet("apiAi", { v: hasAi ? 1 : 0, at: Date.now() }); }

/** ¿Qué IA usa el chat? "api" (servicio), "key" (clave de prueba) o "basic" (sin IA) */
function aiMode() { return apiUrl() && serviceHasAi() ? "api" : ls("ck") ? "key" : "basic"; }

async function api(action, params) {
  var u = apiUrl();
  if (!u) throw new Error("noapi");
  var q = Object.keys(params || {}).map(function (k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(params[k] == null ? "" : params[k]);
  }).join("&");
  var r = await fetch(u + (u.indexOf("?") < 0 ? "?" : "&") + "action=" + encodeURIComponent(action) + (q ? "&" + q : ""));
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

/**
 * Envía la conversación a la IA y devuelve el texto de respuesta.
 * Orden: 1) servicio de la app (la clave queda segura en el servidor)
 *        2) clave de prueba de OpenAI guardada en este navegador
 * Devuelve null si no hay IA configurada.
 */
async function llmChat(messages) {
  var u = apiUrl();
  if (u && serviceHasAi()) {
    // Sin cabeceras propias para evitar la verificación CORS previa de Apps Script
    var r = await fetch(u, { method: "POST", body: JSON.stringify({ action: "chat", messages: messages }) });
    var j = await r.json();
    if (j.code === "no_key") {
      rememberServiceAi(false);   // el servicio solo manda correos: el chat sigue sin IA, sin mostrar error
    } else {
      if (j.error) throw new Error(j.error);
      rememberServiceAi(true);
      return j.text;
    }
  }
  var key = ls("ck");
  if (key) {
    var r2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model: ls("cm") || "gpt-5.3-chat-latest", messages: messages })
    });
    var j2 = await r2.json();
    if (j2.error) throw new Error(j2.error.message);
    return j2.choices[0].message.content;
  }
  return null;
}
