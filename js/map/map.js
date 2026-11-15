/* Mapa interactivo: capas NASA GIBS, zoom, arrastre, GPS y ficha del municipio */
var MV={cx:.3,cy:.5,z:7},W=600,H=400,ZMIN=6,BASE="nasa",ON={},HS=0,ZON=true,D=new Date(Date.now()-3*864e5).toISOString().slice(0,10),TC={},TE={},TO={},MAPOK=false,FARM={};
try{FARM=JSON.parse(ls("farm")||"{}")}catch(e){FARM={}}
function scale(){return 256*Math.pow(2,MV.z)}function sx(x){return(x-MV.cx)*scale()+W/2}function sy(y){return(y-MV.cy)*scale()+H/2}function inv(px,py){var s=scale();return[(px-W/2)/s+MV.cx,(py-H/2)/s+MV.cy]}
function G(layer,lvl,ext){return function(z,x,y){return"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"+layer+"/default/"+D+"/GoogleMapsCompatible_Level"+lvl+"/"+z+"/"+y+"/"+x+"."+ext}}
var TL={nasa:{u:G("MODIS_Terra_CorrectedReflectance_TrueColor",9,"jpg"),mz:9,o:1},esri:{u:function(z,x,y){return"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/"+z+"/"+y+"/"+x},mz:16,o:1},osm:{u:function(z,x,y){return"https://tile.openstreetmap.org/"+z+"/"+x+"/"+y+".png"},mz:17,o:1},
rain:{u:G("IMERG_Precipitation_Rate",6,"png"),mz:6,o:.7},sm:{u:G("SMAP_L4_Analyzed_Surface_Soil_Moisture",6,"png"),mz:6,o:.7},ndvi:{u:G("MODIS_Terra_NDVI_8Day",9,"png"),mz:9,o:.7},fire:{u:G("VIIRS_SNPP_Thermal_Anomalies_375m_All",9,"png"),mz:9,o:1}};
function sizeUp(){var r=$("mp").getBoundingClientRect();W=r.width||600;H=r.height||400}
function fit(draw1){sizeUp();var zx=Math.log(W/((BB[2]-BB[0])*256*1.1))/Math.LN2,zy=Math.log(H/((BB[3]-BB[1])*256*1.1))/Math.LN2;MV.z=Math.min(zx,zy);ZMIN=MV.z-.4;MV.cx=(BB[0]+BB[2])/2;MV.cy=(BB[1]+BB[3])/2;if(draw1)draw()}
function clampV(){MV.z=Math.max(ZMIN,Math.min(13,MV.z));MV.cx=Math.max(BB[0]-.05,Math.min(BB[2]+.05,MV.cx));MV.cy=Math.max(BB[1]-.05,Math.min(BB[3]+.05,MV.cy))}
function zoomAt(px,py,dz){var a=inv(px,py);MV.z=Math.max(ZMIN,Math.min(13,MV.z+dz));var s=scale();MV.cx=a[0]-(px-W/2)/s;MV.cy=a[1]-(py-H/2)/s;clampV();draw()}
function zb(dz){zoomAt(W/2,H/2,dz)}
function path(poly){var s="";for(var i=0;i<poly.length;i++)s+=(i?"L":"M")+sx(poly[i][0]).toFixed(1)+","+sy(poly[i][1]).toFixed(1);return s+"Z"}
function lvl(m,k){var d=(FARM.mun===M.indexOf(m)&&FS&&FS.lv)?FS.lv[KEYS[k]]:null;return d!=null?d:m[4][k]}
function draw(){if(!MAPOK)return;var a=p2ll(0,0),b=p2ll(IMGW,IMGH),x0=sx(mxl(a[0])),y0=sy(myl(a[1])),im=$("im0");im.setAttribute("x",x0);im.setAttribute("y",y0);im.setAttribute("width",sx(mxl(b[0]))-x0);im.setAttribute("height",sy(myl(b[1]))-y0);
tiles();var s='<path fill-rule="evenodd" fill="rgba(0,0,0,.58)" d="M0,0H'+W+'V'+H+'H0Z'+path(SW)+'"/>';
if(ZON)M.forEach(function(m){s+='<path d="'+path(m.cell)+'" fill="'+HC[lvl(m,HS)]+'" fill-opacity=".34" stroke="#fff" stroke-opacity=".75" stroke-width="1"/>'});
s+='<path d="'+path(SW)+'" fill="none" stroke="#ffeb3b" stroke-width="3" stroke-linejoin="round"/>';
M.forEach(function(m){if(m[6]||MV.z>8.8){s+='<text x="'+sx(m.w[0]).toFixed(1)+'" y="'+(sy(m.w[1])+4).toFixed(1)+'" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff" stroke="#000" stroke-opacity=".7" stroke-width="3" paint-order="stroke">'+m[0]+'</text>'}});
if(FARM.lat){var fx=sx(mxl(FARM.lon)),fy=sy(myl(FARM.lat));s+='<g transform="translate('+fx.toFixed(1)+','+fy.toFixed(1)+')"><path d="M0,0C-10,-14 -14,-22 -14,-28a14,14 0 1 1 28,0C14,-22 10,-14 0,0Z" fill="#1565c0" stroke="#fff" stroke-width="2"/><circle cy="-28" r="5" fill="#fff"/></g>'}
$("sv").innerHTML=s}
function tiles(){var need={},act=[];if(BASE!="img")act.push(BASE);Object.keys(ON).forEach(function(k){if(ON[k])act.push(k)});
act.forEach(function(key,li){var L=TL[key],zt=Math.max(0,Math.min(L.mz,Math.round(MV.z))),n=Math.pow(2,zt),a=inv(0,0),c=inv(W,H),x0=Math.max(0,Math.floor(a[0]*n)),x1=Math.min(n-1,Math.floor(c[0]*n)),y0=Math.max(0,Math.floor(a[1]*n)),y1=Math.min(n-1,Math.floor(c[1]*n));if((x1-x0+1)*(y1-y0+1)>80)return;
for(var x=x0;x<=x1;x++)for(var y=y0;y<=y1;y++){var id=key+"|"+D+"|"+zt+"|"+x+"|"+y,im=TC[id];need[id]=1;
if(!im){im=new Image();im.alt="";im.draggable=false;(function(im,key){im.onerror=function(){im.style.display="none";TE[key]=(TE[key]||0)+1;if(!TO[key]&&TE[key]>=3)banner(t("noweb"))};im.onload=function(){TO[key]=(TO[key]||0)+1}})(im,key);im.src=L.u(zt,x,y);im.style.opacity=L.o;im.style.zIndex=li;$("tl").appendChild(im);TC[id]=im}
var sz=scale()/n;im.style.width=im.style.height=(sz+.7)+"px";im.style.left=sx(x/n).toFixed(1)+"px";im.style.top=sy(y/n).toFixed(1)+"px"}});
Object.keys(TC).forEach(function(id){if(!need[id]){TC[id].remove();delete TC[id]}})}
function banner(m){var e=$("mbn");e.textContent=m;e.style.display="block"}
function setDate(v){if(v){D=v;draw()}}
function initMap(){sizeUp();if(!MAPOK){MAPOK=true;$("im0").setAttribute("href",IMG);if(CFG.DEMO)BASE="img";fit(0);bindMap();renderMapUI()}else{fit(0)}$("dt").value=D;draw();if(CFG.DEMO)banner(t("noweb"));if(FARM.lat){MV.cx=mxl(FARM.lon);MV.cy=myl(FARM.lat);MV.z=Math.max(MV.z,8.5);clampV();draw()}minfo()}
function bindMap(){var mp=$("mp"),P={},sd={m:0,t:0};
mp.addEventListener("pointerdown",function(e){if(e.target.closest&&e.target.closest(".zc"))return;P[e.pointerId]={x:e.clientX,y:e.clientY};if(Object.keys(P).length==1)sd={m:0,t:Date.now()};try{mp.setPointerCapture(e.pointerId)}catch(x){}});
mp.addEventListener("pointermove",function(e){var o=P[e.pointerId];if(!o)return;var ids=Object.keys(P);
if(ids.length==1){var dx=e.clientX-o.x,dy=e.clientY-o.y;sd.m+=Math.abs(dx)+Math.abs(dy);MV.cx-=dx/scale();MV.cy-=dy/scale();o.x=e.clientX;o.y=e.clientY;clampV();draw()}
else if(ids.length==2){var other=P[ids[0]==String(e.pointerId)?ids[1]:ids[0]],d0=Math.hypot(o.x-other.x,o.y-other.y);o.x=e.clientX;o.y=e.clientY;var d1=Math.hypot(o.x-other.x,o.y-other.y),r=mp.getBoundingClientRect();if(d0>0&&d1>0)zoomAt((o.x+other.x)/2-r.left,(o.y+other.y)/2-r.top,Math.log(d1/d0)/Math.LN2);sd.m=99}});
function up(e){if(!P[e.pointerId])return;var one=Object.keys(P).length==1;delete P[e.pointerId];if(one&&sd.m<8&&Date.now()-sd.t<700){var r=mp.getBoundingClientRect();tap(e.clientX-r.left,e.clientY-r.top)}}
mp.addEventListener("pointerup",up);mp.addEventListener("pointercancel",function(e){delete P[e.pointerId]});
mp.addEventListener("wheel",function(e){e.preventDefault();var r=mp.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?.5:-.5)},{passive:false});
mp.addEventListener("dblclick",function(e){var r=mp.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,1)});
window.addEventListener("resize",function(){if(!$("v-mapa").hidden){sizeUp();draw()}})}
function tap(px,py){var w=inv(px,py),ll=[lxw(w[0]),lyw(w[1])];if(pip(ll,SL))setFarm(ll[1],ll[0]);else toast(t("out"))}
function setFarm(la,lo){FARM.lat=+la.toFixed(5);FARM.lon=+lo.toFixed(5);FARM.mun=near(la,lo);FS=null;store();$("f-m").value=FARM.mun;$("f-c").value=FARM.lat+", "+FARM.lon;draw();minfo()}
function store(){ls("farm",JSON.stringify(FARM))}
function gps(){if(!navigator.geolocation){toast(t("gpsno"));return}navigator.geolocation.getCurrentPosition(function(r){var la=r.coords.latitude,lo=r.coords.longitude;if(!pip([lo,la],SL)){toast(t("gpsout"));return}setFarm(la,lo);MV.cx=mxl(lo);MV.cy=myl(la);MV.z=Math.max(MV.z,10);clampV();draw()},function(){toast(t("gpsno"))},{timeout:10000})}
function minfo(){var el=$("minfo");if(FARM.mun===undefined){el.hidden=true;return}el.hidden=false;var m=M[FARM.mun],e=m[3],h="<h3>🏛️ "+m[0]+" · "+t("t_"+e)+"</h3><p>"+t("mi_p",m[5].map(cn).join(", "))+"</p><p>"+t("mi_r")+": "+[0,1,2,3].map(function(k){var v=lvl(m,k);return t("h"+k)+' <span class="tag" style="background:'+HC[v]+'">'+t("l"+v)+"</span>"}).join(" · ")+"</p>";
var hz=[0,1,2,3].filter(function(k){return m[4][k]>=2}).sort(function(a,b){return m[4][b]-m[4][a]}).slice(0,2),acts=[];hz.forEach(function(k){acts=acts.concat(tl("a_"+KEYS[k]))});
h+="<p><b>"+t("mi_d")+":</b></p><ul>"+acts.map(function(x){return"<li>"+x+"</li>"}).join("")+"</ul><p>"+t("mi_c",t("e_"+e))+'</p><p class="note">'+t("mi_n")+"</p>";el.innerHTML=h}
function cn(k){return t(CROPS[k]?"c_"+k:k)}
function renderMapUI(){var B=[["img","bi"],["nasa","bn"],["esri","be"],["osm","bo"]];$("bases").innerHTML=B.map(function(b){return'<button class="chip'+(BASE==b[0]?" on":"")+'" onclick="setBase(\''+b[0]+'\')">'+t(b[1])+"</button>"}).join("");
$("ovs").innerHTML=["rain","sm","ndvi","fire"].map(function(k){return'<button class="chip'+(ON[k]?" on":"")+'" onclick="togO(\''+k+'\')">'+t("ov_"+k)+"</button>"}).join("")+'<button class="chip'+(ZON?" on":"")+'" onclick="ZON=!ZON;renderMapUI();draw()">'+t("zones")+"</button>";
$("hzs").innerHTML=[0,1,2,3].map(function(k){return'<button class="chip'+(HS==k?" on":"")+'" onclick="HS='+k+';renderMapUI();draw()">'+t("h"+k)+"</button>"}).join("")}
function setBase(k){BASE=k;renderMapUI();draw()}function togO(k){ON[k]=!ON[k];renderMapUI();draw()}
