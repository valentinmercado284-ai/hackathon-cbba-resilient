/* =========================================================
   Utilidades generales: DOM, almacenamiento local, iconos,
   avisos (toast), fechas y acciones de botones
   ========================================================= */

/** Atajo para document.getElementById */
function $(id) { return document.getElementById(id); }

/** querySelectorAll devuelto como lista normal */
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

/* Almacenamiento local. Si el navegador lo bloquea (modo privado),
   se guarda en memoria para que la app siga funcionando. */
var MEM = {};
function ls(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch (e) {
    if (v === undefined) return MEM[k] === undefined ? null : MEM[k];
    if (v === null) delete MEM[k];
    else MEM[k] = String(v);
  }
}
function lsGet(k, def) {
  try { var v = ls(k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
}
function lsSet(k, obj) { ls(k, JSON.stringify(obj)); }
/** Borra todas las claves guardadas que empiezan con un prefijo (menos una, opcional) */
function lsDropPrefix(prefix, keep) {
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0 && k !== keep) localStorage.removeItem(k);
    }
  } catch (e) { /* sin almacenamiento: nada que limpiar */ }
}

/** Escapa texto para insertarlo en HTML sin riesgos */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/** Icono SVG del sprite definido en index.html */
function icon(name, cls) {
  return '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
}

/** Aviso breve en la parte inferior. kind: "ok" | "err" */
function toast(msg, kind) {
  var e = $("toast");
  e.textContent = msg;
  e.className = "toast show" + (kind ? " " + kind : "");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(function () { e.className = "toast"; }, 3600);
}

/** Fecha AAAA-MM-DD de hoy más/menos días */
function isoDay(offset) { return new Date(Date.now() + (offset || 0) * 864e5).toISOString().slice(0, 10); }

/** Convierte "AAAAMMDD" o "AAAA-MM-DD" en una fecha local */
function parseDay(s) {
  s = String(s).replace(/-/g, "");
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}

/** Fecha legible en el idioma activo, por ejemplo «11 nov 2026» */
function fmtDay(s) {
  if (!/^\d{4}-?\d{2}-?\d{2}$/.test(String(s))) return String(s);
  try { return parseDay(s).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" }); }
  catch (e) { return String(s); }
}

/** Fecha y hora legibles de una marca de tiempo */
function fmtStamp(ms) {
  try { return new Date(ms).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }); }
  catch (e) { return ""; }
}

/** Número con formato del idioma activo; «—» si no hay dato */
function num(n, decimals) {
  if (n == null || n !== n) return "—";
  var d = decimals || 0;
  return Number(n).toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Porcentaje con signo: +12 %, −34 % */
function signedPct(n) {
  if (n == null || n !== n) return "—";
  return (n > 0 ? "+" : n < 0 ? "−" : "") + num(Math.abs(n)) + " %";
}

/* Acciones de botones: <button data-act="nombre"> ejecuta ACTIONS.nombre(boton, evento).
   Cada pantalla registra sus acciones; app.js escucha los clics. */
var ACTIONS = {};
