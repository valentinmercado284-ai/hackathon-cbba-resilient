/* Mi granja: formulario, guardar y borrar */
function opts(id,list,vals){$(id).innerHTML=list.map(function(x,i){return'<option value="'+(vals?vals[i]:i)+'">'+x+"</option>"}).join("")}
function fillForm(){var k=Object.keys(CROPS);opts("f-m",M.map(function(m){return m[0]}));opts("f-k",k.map(function(c){return t("c_"+c)}),k);opts("f-r",tl("ir"));opts("f-p",tl("sl"));opts("f-s",tl("so"));
var f=FARM;$("f-n").value=f.n||"";if(f.mun!==undefined)$("f-m").value=f.mun;$("f-c").value=f.lat?f.lat+", "+f.lon:"";if(f.k)$("f-k").value=f.k;$("f-h").value=f.h||"";["r","p","s"].forEach(function(x){if(f[x]!==undefined&&f[x]!=="")$("f-"+x).value=f[x]});["a","d","w"].forEach(function(x){$("f-"+x).value=f[x]||""})}
function saveFarm(){var f=FARM,mi=+$("f-m").value;if(f.lat===undefined||near(f.lat,f.lon)!==mi){f.lat=M[mi][2];f.lon=M[mi][1]}f.mun=mi;f.n=$("f-n").value;f.k=$("f-k").value;f.h=$("f-h").value;["r","p","s","a","d","w"].forEach(function(x){f[x]=$("f-"+x).value});FS=null;store();
$("f-c").value=f.lat+", "+f.lon;$("fok").innerHTML='<p class="demo" style="background:#d1e7dd;color:#0a3622">'+t("fOk")+": <b>"+(f.n||M[mi][0])+"</b> · "+M[mi][0]+'</p><button class="btn" onclick="go(\'stats\')">'+t("fSt")+"</button>";toast(t("fOk"));if(MAPOK)draw()}
function delFarm(){FARM={};FS=null;store();$("fok").innerHTML="";fillForm();if(MAPOK){draw();minfo()}}
