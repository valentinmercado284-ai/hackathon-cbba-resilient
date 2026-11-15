/* Estadísticas con NASA POWER: descarga, cálculos, gráfico y recomendaciones */
var FS=null;
function sum(a){return a.reduce(function(s,v){return v==v?s+v:s},0)}function avg(a){var n=a.filter(function(v){return v==v});return n.length?sum(n)/n.length:NaN}
function calc(p){var ks=Object.keys(p.PRECTOTCORR).sort(),n=ks.length;function A(k){return ks.map(function(d){var v=p[k][d];return v<-990?NaN:v})}
var pr=A("PRECTOTCORR"),tt=A("T2M"),tm=A("T2M_MIN"),sm=A("GWETROOT"),rh=A("RH2M");
function win(a,len,f){var cur=f(a.slice(n-len)),b=[];for(var y=1;y<=15;y++){var e=n-Math.round(365.25*y),s=e-len;if(s<0)break;b.push(f(a.slice(s,e)))}var m=avg(b);return{cur:cur,pct:m?Math.round(100*(cur-m)/Math.abs(m)):NaN}}
var r90=win(pr,90,sum),s30=win(sm,30,avg),dry=0,mx=0;pr.slice(-90).forEach(function(v){if(v<1){dry++;mx=Math.max(mx,dry)}else dry=0});
var ym={},yy={};ks.forEach(function(d,i){var k=d.slice(0,6);(ym[k]=ym[k]||[]).push(pr[i]);var y=d.slice(0,4);(yy[y]=yy[y]||[]).push(tt[i])});
var mk=Object.keys(ym).sort(),l12=mk.slice(-12),ch=l12.map(function(k){var o=mk.filter(function(q){return q.slice(4)==k.slice(4)&&l12.indexOf(q)<0&&ym[q].length>27}).map(function(q){return sum(ym[q])});return{k:k,v:sum(ym[k]),n:avg(o)}});
var ys=Object.keys(yy).filter(function(y){return yy[y].length>360}).map(Number),tr=NaN;if(ys.length>3){var ya=ys.map(function(y){return avg(yy[y])}),mx_=avg(ys),my=avg(ya),nu=0,de=0;ys.forEach(function(x,i){nu+=(x-mx_)*(ya[i]-my);de+=(x-mx_)*(x-mx_)});tr=+(10*nu/de).toFixed(2)}
return{pr:Math.round(r90.cur),prp:r90.pct,sm:+(s30.cur*100).toFixed(0),smp:s30.pct,rh:Math.round(avg(rh.slice(-30))),fz:tm.slice(-365).filter(function(v){return v<=2}).length,hv:pr.slice(-365).filter(function(v){return v>=20}).length,dry:mx,t:+avg(tt.slice(-365)).toFixed(1),tr:tr,ch:ch,fecha:ks[n-1]}}
function lev(s){return{s:(s.prp<=-40||s.smp<=-25)?3:(s.prp<=-20||s.smp<=-12)?2:(s.prp<=-5||s.smp<=-3)?1:0,i:(s.smp<=-15&&s.rh<=40)?3:(s.smp<=-8||s.rh<=45)?2:s.rh<=55?1:0,f:s.hv>=4?3:s.hv>=2?2:s.hv>=1?1:0,h:s.fz>=60?3:s.fz>=25?2:s.fz>=5?1:0}}
function demoStats(){var now=new Date(),ch=[],nm=[100,90,60,20,5,2,3,8,20,35,50,80],i;for(i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1),m=d.getMonth();ch.push({k:d.getFullYear()+("0"+(m+1)).slice(-2),v:Math.round(nm[m]*.65),n:nm[m]})}
var s={pr:96,prp:-34,sm:31,smp:-16,rh:46,fz:14,hv:2,dry:23,t:17.9,tr:0.3,ch:ch,fecha:"demo",demo:1};s.lv=lev(s);return s}
async function load(){if(CFG.DEMO){FS=demoStats();return FS}var e=new Date(Date.now()-3*864e5).toISOString().slice(0,10).replace(/-/g,""),ac=new AbortController(),to=setTimeout(function(){ac.abort()},40000);
try{var r=await fetch("https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M,T2M_MIN,GWETROOT,RH2M&community=AG&longitude="+FARM.lon+"&latitude="+FARM.lat+"&start=20100101&end="+e+"&format=JSON",{signal:ac.signal}),j=await r.json();FS=calc(j.properties.parameter);FS.lv=lev(FS);return FS}finally{clearTimeout(to)}}
function chart(ch){var w=330,h=130,mx=Math.max.apply(0,ch.map(function(c){return Math.max(c.v,c.n||0)}))||1,bw=w/12,s='<svg viewBox="0 0 '+w+" "+(h+16)+'" style="width:100%">';
ch.forEach(function(c,i){var bh=c.v/mx*h,nh=(c.n||0)/mx*h;s+='<rect x="'+(i*bw+4)+'" y="'+(h-bh)+'" width="'+(bw-8)+'" height="'+bh+'" fill="#1565c0" rx="3"/><line x1="'+(i*bw+2)+'" x2="'+((i+1)*bw-2)+'" y1="'+(h-nh)+'" y2="'+(h-nh)+'" stroke="#c62828" stroke-width="3"/><text x="'+(i*bw+bw/2)+'" y="'+(h+13)+'" font-size="9" text-anchor="middle" fill="currentColor">'+c.k.slice(4)+"</text>"});return s+"</svg>"}
function recs(){var c=CROPS[FARM.k||"maiz"],s=FS,l=s.lv,need=Math.round(c[0]*90/c[1]),bal=s.pr-need,nm=t("c_"+(FARM.k||"maiz")),r=[];
r.push(bal<0?t("rW1",s.pr,nm,need,-bal):t("rW2",s.pr,nm,need));if(l.s>=2)r.push(t("rS",t("l"+l.s).toLowerCase()));if(l.h>=2&&c[2])r.push(t("rH",s.fz));if(l.f>=2)r.push(t("rF",s.hv));if(l.i>=2)r.push(t("rI"));if(FARM.p=="2")r.push(t("rSl"));
[3,0,2,1].forEach(function(k){if(l[KEYS[k]]>=2)r=r.concat(tl("a_"+KEYS[k]))});return r.slice(0,9)}
async function showStats(){var el=$("stats");if(FARM.lat===undefined){el.innerHTML='<div class="card">'+t("sFirst")+"</div>";return}
el.innerHTML='<div class="card">'+t("sLoad")+"</div>";
try{if(!FS)await load()}catch(e){el.innerHTML='<div class="card"><b>'+t("sFail",(e&&e.message)||"")+"</b></div>";return}
var s=FS,l=s.lv,ov=Math.max(l.s,l.i,l.f,l.h),c=CROPS[FARM.k||"maiz"];if(MAPOK)draw();minfo();
el.innerHTML=(s.demo?'<div class="demo">'+t("sDemo")+"</div>":"")+'<div class="card"><h3>'+(FARM.n||t("vg"))+" · "+M[FARM.mun][0]+"</h3><p>"+t("sLvl")+': <span class="tag" style="background:'+HC[ov]+'">'+t("l"+ov)+"</span></p>"+
'<div class="kp"><div><b>'+s.prp+" %</b><small>"+t("k1",s.pr)+"</small></div><div><b>"+s.smp+" %</b><small>"+t("k2")+"</small></div><div><b>"+s.fz+"</b><small>"+t("k3")+"</small></div><div><b>"+s.rh+" %</b><small>"+t("k4")+"</small></div></div>"+
"<h3>"+t("sCh")+"</h3>"+chart(s.ch)+'<p class="note">'+t("sChn")+"</p><h3>"+t("sRec")+"</h3><ul>"+recs().map(function(x){return"<li>"+x+"</li>"}).join("")+"</ul>"+
"<details><summary>"+t("sAdv")+'</summary><div class="kp"><div><b>'+s.t+" °C</b><small>"+t("k5")+"</small></div><div><b>"+s.tr+" °C</b><small>"+t("k6")+"</small></div><div><b>"+s.hv+"</b><small>"+t("k7")+"</small></div><div><b>"+s.dry+"</b><small>"+t("k8")+'</small></div></div><p class="note">'+t("sNeed",c[0])+"</p></details>"+
'<p class="note">'+t("sSrc",/^\d{8}$/.test(s.fecha)?s.fecha.slice(0,4)+"-"+s.fecha.slice(4,6)+"-"+s.fecha.slice(6):s.fecha)+"</p></div>"}
