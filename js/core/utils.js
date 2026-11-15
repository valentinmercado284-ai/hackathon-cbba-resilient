/* Utilidades: acceso al DOM, almacenamiento local y avisos (toast) */
var $=function(i){return document.getElementById(i)},MEM={};
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){if(v===undefined)return MEM[k]||null;MEM[k]=v}}
function toast(m){var e=$("toast");e.textContent=m;e.style.display="block";clearTimeout(toast.h);toast.h=setTimeout(function(){e.style.display="none"},3200)}
