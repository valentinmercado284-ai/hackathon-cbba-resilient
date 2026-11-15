/* Motor de idiomas: idioma activo y funciones t() / tl() */
var LANG=ls("lang")||(((navigator.language||"es").slice(0,2)=="en")?"en":"es");if(!T[LANG])LANG="es";
function t(k){var s=(T[LANG][k]!==undefined?T[LANG][k]:T.es[k]);if(s===undefined)return k;for(var i=1;i<arguments.length;i++)s=s.split("{"+(i-1)+"}").join(arguments[i]);return s}
function tl(k){return t(k).split("|")}
