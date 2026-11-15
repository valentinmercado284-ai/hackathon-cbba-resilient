/* Alertas: pronóstico Open-Meteo y suscripción por correo */
function apiUrl(){return ls("api")||CFG.API}
function api(action,o){var u=apiUrl();if(!u)return Promise.reject(new Error("noapi"));var q=Object.keys(o).map(function(k){return k+"="+encodeURIComponent(o[k])}).join("&");return fetch(u+"?action="+action+"&"+q).then(function(r){return r.json()})}
async function alerts(){var el=$("als");if(FARM.lat===undefined){el.innerHTML="<p>"+t("aNo")+"</p>";return}el.innerHTML="<p>"+t("aWait")+"</p>";var out=[];
if(CFG.DEMO){out=[t("aDemo")+t("aRain",18),t("aDemo")+t("aDry")]}else{
try{var j=await(await fetch("https://api.open-meteo.com/v1/forecast?latitude="+FARM.lat+"&longitude="+FARM.lon+"&daily=precipitation_sum,temperature_2m_min&forecast_days=3&timezone=auto")).json(),d=j.daily,mn=Math.min(d.temperature_2m_min[1],d.temperature_2m_min[2]);
if(d.precipitation_sum[1]>=15)out.push(t("aRain",Math.round(d.precipitation_sum[1])));if(mn<=2)out.push(t("aFrost",mn));if(!out.length)out.push(t("aOk"))}catch(e){out.push(t("aFail"))}
try{if(!FS)await load();var l=FS.lv;if(l.s>=2)out.push(t("aDry"));if(l.i>=2)out.push(t("aFire"))}catch(e){}}
$("als").innerHTML=out.map(function(x){return'<div class="al">'+x+"</div>"}).join("");window.AL=out}
var TS=[1,1,1,1],TC4=["rain","frost","dry","fire"];
function renderSub(){$("s-t").innerHTML=TC4.map(function(c,i){return'<button class="chip'+(TS[i]?" on":"")+'" onclick="TS['+i+']^=1;renderSub()">'+t("t_"+c)+"</button>"}).join("")}
function subData(){return{name:$("s-n").value,email:$("s-e").value.trim(),wa:$("s-w").value,lat:FARM.lat,lon:FARM.lon,mun:M[FARM.mun]?M[FARM.mun][0]:"",crop:FARM.k||"",lang:LANG,types:TC4.filter(function(c,i){return TS[i]}).join(",")}}
async function subscribe(){var s=subData(),m=$("s-m");if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)){m.textContent=t("sBad");return}if(FARM.lat===undefined){m.textContent=t("sFarm");return}
ls("sub",JSON.stringify(s));if(!apiUrl()){m.textContent=t("sNoApi");return}m.textContent=t("aWait");
try{var r=await api("subscribe",s);m.textContent=r.ok?t("sSent"):t("sErr",r.error||"?")}catch(e){m.textContent=t("sErr",e.message)}}
async function testMail(){var s=subData(),m=$("s-m");if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)){m.textContent=t("sBad");return}if(FARM.lat===undefined){m.textContent=t("sFarm");return}
if(!apiUrl()){var b=(window.AL||[t("aOk")]).join("\n");location.href="mailto:"+s.email+"?subject="+encodeURIComponent("Cochabamba Resiliente")+"&body="+encodeURIComponent(b);return}
m.textContent=t("aWait");try{var r=await api("test",s);m.textContent=r.ok?t("sSent"):t("sErr",r.error||"?")}catch(e){m.textContent=t("sErr",e.message)}}
function saveApi(){ls("api",$("api").value.trim());toast(t("saved"))}
