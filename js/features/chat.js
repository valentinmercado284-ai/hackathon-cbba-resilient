/* =========================================================
   Cosecha: asistente de chat
   - Con IA si está configurada (servicio de la app o clave de prueba)
   - Sin IA: responde con la guía (data/conocimiento.js) y los datos de la granja
   ========================================================= */

var CH = [];            // conversación: { r: "u" | "a", t: texto, hello: saludo inicial }
var chatBusy = false;

function scrollChat() { var m = $("msgs"); m.scrollTop = m.scrollHeight; }

function chatBubble(role, text) {
  var d = document.createElement("div");
  d.className = "msg " + role;
  d.textContent = text;
  $("msgs").appendChild(d);
  scrollChat();
  return d;
}

function renderChat() {
  $("msgs").innerHTML = "";
  if (!CH.length) CH.push({ r: "a", t: t("cHello"), hello: true });
  CH.forEach(function (m) { chatBubble(m.r, m.t); });
  renderChatMode();
  $("cc").innerHTML = tl("cq").map(function (q) {
    return '<button type="button" class="chip" data-act="chat-ask">' + esc(q) + "</button>";
  }).join("");
}

function renderChatMode() {
  var mode = aiMode(), el = $("chat-mode");
  el.className = "chat-mode" + (mode === "basic" ? "" : " on");
  el.querySelector("span").textContent = t(mode === "api" ? "cModeApi" : mode === "key" ? "cModeKey" : "cModeBasic");
}

/* ---------- Contexto para la IA ---------- */
function chatContext() {
  var c = "Zona: Cochabamba, Bolivia. Emergencia nacional por Súper Niño 2026-27.", m = farmMun();
  if (m) {
    c += " Granja: " + (FARM.n || "sin nombre") + ", municipio " + m[0] + " (" + t("t_" + m[3]) + "), cultivo " +
      (CROPS[FARM.k] ? t("c_" + FARM.k) : "no indicado") + ", " + (FARM.h || "?") + " ha.";
  }
  if (FS && !FS.demo) {
    c += " Datos NASA POWER de su granja: lluvia 90 días " + FS.prp + "% vs normal (" + FS.pr + " mm), humedad del suelo " + FS.smp +
      "% vs normal, " + FS.fz + " días con noche fría, " + FS.hv + " días de lluvia fuerte, humedad del aire " + FS.rh + "%.";
  }
  if (FC && FC.days && FC.days[1]) {
    var d = FC.days[1];
    c += " Pronóstico para mañana (Open-Meteo): máx " + d.tmax + " °C, mín " + d.tmin + " °C, lluvia " + d.rain + " mm.";
  }
  return c;
}

function sysPrompt() {
  var lg = LANG === "en" ? "Reply in English." :
    LANG === "qu" ? "Responde en quechua boliviano (variedad de Cochabamba, alfabeto oficial boliviano). Nunca uses quechua peruano. Frases muy simples; si no estás seguro de una palabra, usa la palabra en español." :
    "Responde en español.";
  return "Eres «Cosecha», asistente de una app para agricultores de Cochabamba, Bolivia. " + lg +
    " Habla muy sencillo, frases cortas, máximo 110 palabras; usa viñetas «•» si das pasos. Apóyate en el CONTEXTO y di que los datos vienen de la NASA cuando los uses." +
    " No inventes cifras, precios ni teléfonos. Para decisiones importantes recomienda hablar con un técnico agrónomo, la alcaldía o INIAF. CONTEXTO: " + chatContext();
}

/* ---------- Respuestas sin IA ---------- */
function normalizeText(s) {
  return " " + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
}

/** Puntaje de un tema según sus palabras clave */
function kbScore(entry, text, words) {
  var score = 0;
  entry.k.forEach(function (kw) {
    if (kw.slice(-1) === "*") {
      var stem = kw.slice(0, -1);
      if (words.some(function (w) { return w.indexOf(stem) === 0; })) score += 1;
    } else if (kw.indexOf(" ") >= 0) {
      if (text.indexOf(" " + kw + " ") >= 0) score += 2;
    } else if (words.indexOf(kw) >= 0) {
      score += 1;
    }
  });
  return score;
}

function kbText(entry) {
  if (entry.ikey) return t(entry.ikey);
  return entry[LANG] || entry.es || "";
}

async function kbAnswer(entry) {
  var base = kbText(entry);
  if (entry.fn) {
    try {
      var dynamic = await entry.fn(base);
      if (dynamic) return dynamic;
    } catch (e) { /* si falla, se usa la respuesta fija */ }
  }
  return base;
}

async function offlineAnswer(q) {
  var text = normalizeText(q), words = text.trim().split(" ");
  // Temas con puntaje, de mayor a menor (si empatan, queda el que está antes en KB)
  var ranked = KB.map(function (entry, i) { return { e: entry, s: kbScore(entry, text, words), i: i }; })
    .filter(function (x) { return x.s > 0; })
    .sort(function (a, b) { return b.s - a.s || a.i - b.i; });
  if (!ranked.length) return t("rDef") + "\n\n" + t("kbTry");
  var first = ranked[0].e, second = ranked[1];
  // Pregunta que mezcla un tema y un cultivo («plagas de la papa»): responde ambos
  if (second && second.s === ranked[0].s && !!first.crop !== !!second.e.crop) {
    var topic = first.crop ? second.e : first, crop = first.crop ? first : second.e;
    return (await kbAnswer(topic)) + "\n\n" + (await kbAnswer(crop));
  }
  return (await kbAnswer(first)) || t("rDef");
}

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function askChat(q) {
  q = String(q || "").trim();
  if (!q || chatBusy) return;
  chatBusy = true;
  CH.push({ r: "u", t: q });
  chatBubble("u", q);
  var box = chatBubble("a", "");
  box.innerHTML = '<span class="typing" role="status" aria-label="' + esc(t("cTyping")) + '"><i></i><i></i><i></i></span>';
  var answer;
  try {
    var history = CH.slice(-9, -1).filter(function (m) { return !m.hello; }).map(function (m) {
      return { role: m.r === "u" ? "user" : "assistant", content: m.t };
    });
    answer = await llmChat([{ role: "system", content: sysPrompt() }].concat(history, [{ role: "user", content: q }]));
    if (!answer) {
      await wait(400);
      answer = await offlineAnswer(q);
    }
  } catch (e) {
    answer = t("cFail", e.message) + "\n\n" + (await offlineAnswer(q));
  }
  box.textContent = answer;
  CH.push({ r: "a", t: answer });
  chatBusy = false;
  renderChatMode();   // por si el servicio avisó que no tiene IA
  scrollChat();
}

$("chat-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var input = $("ci"), v = input.value;
  input.value = "";
  askChat(v);
});

ACTIONS["chat-ask"] = function (el) { askChat(el.textContent); };
ACTIONS["chat-clear"] = function () { CH = []; renderChat(); };
ACTIONS["chat-cfg-save"] = function () {
  ls("cm", $("cm").value.trim() || null);
  ls("ck", $("ck").value.trim() || null);
  toast(t("saved"), "ok");
  renderChatMode();
};

VIEW_HOOKS.chat = function () {
  $("cm").value = ls("cm") || "";
  $("ck").value = ls("ck") || "";
  renderChat();
  if (window.matchMedia && matchMedia("(pointer: fine)").matches) $("ci").focus({ preventScroll: true });
};
