/* Navegación entre pantallas, idioma e inicio de la app */
var VW=[["mapa","vm","dm","🗺️"],["granja","vg","dg","🌾"],["stats","vs","ds","📊"],["alertas","va","da","🔔"],["chat","vc","dc","💬"],["aprende","vl","dl","📚"],["compartir","vh","dh","🔗"]],ALLV=["inicio"].concat(VW.map(function(v){return v[0]}));
function cards(){return VW.map(function(v){return'<button class="mi" onclick="go(\''+v[0]+'\')"><b>'+v[3]+" "+t(v[1])+"</b><span>"+t(v[2])+"</span></button>"}).join("")}
function menu(o){$("menu").classList.toggle("on",!!o)}
function go(v){menu(0);ALLV.forEach(function(x){$("v-"+x).hidden=x!=v});$("fab").hidden=v=="chat";window.scrollTo(0,0);
if(v=="mapa")initMap();if(v=="stats")showStats();if(v=="chat")initChat();if(v=="granja")fillForm();if(v=="compartir"){$("shu").value=shareUrl();qrUpd()}}
function applyLang(){document.documentElement.lang=LANG=="qu"?"qu":LANG;
[].forEach.call(document.querySelectorAll("[data-i]"),function(e){e.textContent=t(e.getAttribute("data-i"))});
[].forEach.call(document.querySelectorAll("[data-h]"),function(e){e.innerHTML=t(e.getAttribute("data-h"))});
[].forEach.call(document.querySelectorAll("[data-p]"),function(e){e.placeholder=t(e.getAttribute("data-p"))});
$("lg").innerHTML=[["es","ES"],["en","EN"],["qu","QU"]].map(function(l){return'<button class="'+(LANG==l[0]?"on":"")+'" onclick="setLang(\''+l[0]+'\')">'+l[1]+"</button>"}).join("");
$("mg").innerHTML=cards();$("mg2").innerHTML=cards();$("how").innerHTML=tl("how").map(function(x){return"<li>"+x+"</li>"}).join("");
$("lsrc").innerHTML=tl("lsrc").map(function(x){return"<li>"+x+"</li>"}).join("");
$("learn").innerHTML=["s","h","f","i"].map(function(k,i){var n=[0,3,2,1][i];return"<details><summary>"+t("h"+n)+"</summary><ul>"+tl("a_"+k).map(function(x){return"<li>"+x+"</li>"}).join("")+"</ul></details>"}).join("");
renderSub();if(MAPOK){renderMapUI();minfo();draw()}}
function setLang(l){LANG=l;ls("lang",l);applyLang();CH=[];$("msgs").innerHTML="";if(!$("v-chat").hidden)initChat();if(!$("v-granja").hidden){var f=FARM;fillForm()}if(!$("v-stats").hidden)showStats();if(!$("v-compartir").hidden)qrUpd();$("fok").innerHTML=""}
applyLang();go("inicio");
