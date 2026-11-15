/* ---------- геометрия ---------- */
function grid(a,e,step,minGap,origin=0){
  const out=[a]; if(e-a<minGap) return out;
  step=Math.max(step,minGap);
  let k=Math.ceil((a+minGap-origin)/step-1e-9);
  for(;;k++){const u=origin+k*step; if(u>e-minGap+1e-6) break; out.push(u);}
  out.push(e); return out;
}
const dist3=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
const rel=(arr,a)=>arr.map(v=>v-a).filter(v=>v>1);

/* ---------- климат по местоположению ---------- */
const siteKey=P=>P.climMode==='p50'?'p50':'avg';
function snowVal(P){return P.snow==='site'&&P.site?+P.site.snowKPa[siteKey(P)]:(SNOW[P.snow]??1.5)}
function windVal(P){return P.wind==='site'&&P.site?+P.site.windKPa[siteKey(P)]:(WIND[P.wind]??.23)}
const regionOf=(tbl,v)=>{const e=Object.entries(tbl).find(([,x])=>x>=v-1e-9);return e?e[0]:Object.keys(tbl).at(-1)};
const snowReg=P=>P.snow==='site'?regionOf(SNOW,snowVal(P)):P.snow, windReg=P=>P.wind==='site'?regionOf(WIND,windVal(P)):P.wind;
const snowLbl=P=>P.snow==='site'?`по данным ${P.site?.name||''}, ≈ район ${snowReg(P)}`:`район ${P.snow}`, windLbl=P=>P.wind==='site'?`по данным ${P.site?.name||''}, ≈ район ${windReg(P)}`:`район ${P.wind}`;
const freezeFromSite=P=>P.site?.Mt>0?Math.ceil(((SOILS[P.soil]||SOILS.loam).d0*Math.sqrt(P.site.Mt))*1000/50)*50:null;
const GUMBEL50=-(Math.sqrt(6)/Math.PI)*(.5772+Math.log(Math.log(50/49)));
const meanSd=a=>{const m=a.reduce((s,x)=>s+x,0)/a.length,sd=Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/Math.max(1,a.length-1));return [m,sd]};
/* анализ архива: максимум снега за зиму, максимум ветра за год, среднемесячные температуры */
function analyzeClimate(j,y0,y1){
  const d=j.daily,h=j.hourly,mon={},wy={};
  d.time.forEach((t,i)=>{const y=+t.slice(0,4),m=+t.slice(5,7)-1,T=d.temperature_2m_mean[i],W=d.wind_speed_10m_max[i],G=d.wind_gusts_10m_max?.[i];
    if(T!=null){(mon[m]=mon[m]||[]).push(T)}
    if(W!=null){const o=wy[y]=wy[y]||{w:0,g:0};o.w=Math.max(o.w,W);if(G!=null)o.g=Math.max(o.g,G)}});
  const months=[...Array(12)].map((_,m)=>mon[m]?mon[m].reduce((s,x)=>s+x,0)/mon[m].length:null);
  const Mt=months.reduce((s,t)=>s+(t!=null&&t<0?-t:0),0);
  const sea={};h.time.forEach((t,i)=>{const v=h.snow_depth[i];if(v==null)return;const y=+t.slice(0,4),m=+t.slice(5,7),k=m>=7?y:y-1;if(k<y0||k>=y1)return;sea[k]=Math.max(sea[k]||0,v)});
  const sn=Object.values(sea),wn=Object.values(wy).map(o=>o.w),gn=Object.values(wy).map(o=>o.g).filter(x=>x>0);
  if(sn.length<3||wn.length<3) throw new Error('мало данных');
  const [sm,ss]=meanSd(sn),[wm,ws]=meanSd(wn),RHO=300;
  const hs={avg:sm,p50:sm+GUMBEL50*ss},vs={avg:wm,p50:wm+GUMBEL50*ws};
  const kpa=x=>x*RHO*9.81/1000,wk=v=>.43*v*v/1000;
  return {years:`${y0}–${y1}`,seasons:sn.length,snowH:hs,snowKPa:{avg:kpa(hs.avg),p50:kpa(hs.p50)},windMS:vs,windKPa:{avg:wk(vs.avg),p50:wk(vs.p50)},gust:gn.length?meanSd(gn)[0]:null,months,Mt,tmin:Math.min(...months.filter(x=>x!=null)),rho:RHO};
}
async function geoSearch(q){const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=ru&format=json`);if(!r.ok)throw new Error('http '+r.status);return (await r.json()).results||[]}
async function loadClimate(loc){
  const y1=new Date().getFullYear()-1,y0=y1-9;
  const url=`https://archive-api.open-meteo.com/v1/archive?latitude=${loc.latitude}&longitude=${loc.longitude}&start_date=${y0}-01-01&end_date=${y1}-12-31&daily=temperature_2m_mean,wind_speed_10m_max,wind_gusts_10m_max&hourly=snow_depth&wind_speed_unit=ms&timezone=auto`;
  const r=await fetch(url),j=await r.json();if(j.error)throw new Error(j.reason||'ошибка сервиса');
  return {...analyzeClimate(j,y0,y1),name:loc.name,admin:[loc.admin1,loc.country].filter(Boolean).join(', '),lat:loc.latitude,lon:loc.longitude,elev:loc.elevation,loaded:new Date().toISOString().slice(0,10),source:'Open-Meteo, архив реанализа ERA5'};
}
function applySite(site){P.site=site;P.snow='site';P.wind='site';P.freezeAuto=true;const f=freezeFromSite(P);if(f)P.freeze=f;if(!P.climMode)P.climMode='avg'}
function renderSite(){
  const el=$('#custom-site');if(!el)return;const st=P.site,md=siteKey(P);
  el.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px;padding-bottom:12px">
    <div class="fld wide"><label for="siteQ">Город или населённый пункт</label><div class="inp"><input type="text" id="siteQ" value="${esc(P.siteQuery||st?.name||'')}" placeholder="например, Казань"><button class="btn sm" id="siteGo" style="margin:3px">Найти</button></div></div>
    <div id="siteList" class="btns"></div><div class="note" id="siteMsg" role="status"></div>
    ${st?`<div class="sitecard"><b>${esc(st.name)}</b> <span class="note">${esc(st.admin)} · ${fmt(st.lat,2)}° с. ш., ${fmt(st.lon,2)}° в. д.</span>
      <dl class="kv"><dt>Период</dt><dd>${st.years} (${st.seasons} зим)</dd>
      <dt>Снег: средний максимум за зиму</dt><dd>${fmt(st.snowH.avg*100,0)} см → ${fmt(st.snowKPa.avg,2)} кПа</dd>
      <dt>Снег: 1 раз в 50 лет</dt><dd>${fmt(st.snowH.p50*100,0)} см → ${fmt(st.snowKPa.p50,2)} кПа</dd>
      <dt>Ветер: средний годовой максимум</dt><dd>${fmt(st.windMS.avg,1)} м/с → ${fmt(st.windKPa.avg,3)} кПа</dd>
      <dt>Ветер: 1 раз в 50 лет</dt><dd>${fmt(st.windMS.p50,1)} м/с → ${fmt(st.windKPa.p50,3)} кПа</dd>
      ${st.gust?`<dt>Порывы: средний годовой максимум</dt><dd>${fmt(st.gust,1)} м/с</dd>`:''}
      <dt>Сумма морозов Mt (ср. месячные)</dt><dd>${fmt(st.Mt,1)} °С·мес</dd>
      <dt>Глубина промерзания для грунта</dt><dd>${freezeFromSite(P)} мм</dd></dl>
      <div class="fld wide"><label for="climMode">Подставлять в расчёт</label><div class="inp"><select id="climMode"><option value="avg" ${md==='avg'?'selected':''}>Средние значения за годы наблюдений</option><option value="p50" ${md==='p50'?'selected':''}>Повторяемость 1 раз в 50 лет (как в СП 20.13330)</option></select></div></div>
      <div class="note">Сейчас в расчёте: снег ${fmt(snowVal(P),2)} кПа (≈ район ${snowReg(P)}), ветер ${fmt(windVal(P),3)} кПа (≈ район ${windReg(P)}), промерзание ${P.freeze} мм. Источник: ${esc(st.source)}, загружено ${st.loaded}.</div></div>`:''}
    <div class="hint">Программа находит город, загружает погоду за последние 10 лет и подставляет средние значения снега, ветра и глубину промерзания (по СП 22.13330: d = d₀·√Mt). Данные можно поменять вручную в шаге «Климат и нагрузки».${IS_LOCAL?'':' <b>В онлайн-версии внешние сервисы недоступны — загрузка работает в офлайн-файле karkas-proekt.html.</b>'}</div></div>`;
  const msg=t=>{$('#siteMsg').textContent=t};
  const go=async()=>{const q=$('#siteQ').value.trim();if(!q){msg('Введите название города.');return}P.siteQuery=q;msg('Ищу…');$('#siteList').innerHTML='';
    let res;try{res=await geoSearch(q)}catch(e){msg(IS_LOCAL?'Сервис поиска недоступен — проверьте интернет.':'Онлайн-версия не может обращаться к внешним сервисам. Откройте офлайн-файл karkas-proekt.html или задайте районы вручную в шаге «Климат и нагрузки».');return}
    if(!res.length){msg('Ничего не найдено. Уточните название.');return}
    msg(res.length>1?'Выберите нужный населённый пункт:':'');
    const pick=async loc=>{$('#siteList').innerHTML='';msg(`Загружаю погоду для «${loc.name}» за 10 лет…`);
      try{const site=await loadClimate(loc);applySite(site);renderSide();rebuild();const m=$('#siteMsg');if(m)m.textContent=`Готово: данные для «${site.name}» подставлены в расчёт.`}
      catch(e){msg('Не удалось загрузить архив погоды: '+(e.message||'ошибка')+'. Попробуйте позже или задайте районы вручную.')}};
    if(res.length===1){pick(res[0]);return}
    $('#siteList').innerHTML=res.map((r,i)=>`<button class="btn sm" data-loc="${i}">${esc(r.name)}${r.admin1?', '+esc(r.admin1):''}${r.country_code!=='RU'?' ('+esc(r.country||'')+')':''}</button>`).join('');
    $('#siteList').querySelectorAll('[data-loc]').forEach(b=>b.onclick=()=>pick(res[+b.dataset.loc]))};
  $('#siteGo').onclick=go;$('#siteQ').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
  const cm=$('#climMode');if(cm)cm.onchange=()=>{P.climMode=cm.value;renderSide();rebuild()};
}
function loads(P){
  const mat=ROOFS[P.roofMat]||ROOFS.metal, deg=+P.slope;
  const mu=deg<=30?1:deg>=60?0:(60-deg)/30;
  const Sg=snowVal(P), w0=windVal(P), k=(TERRAIN[P.terrain]||TERRAIN.B).k;
  const cR=deg<15?0:deg<30?.2:deg<45?.4:.7;
  return {mat,mu,Sg,S:Sg*mu,w0,k,cR,wR:w0*k*cR,wW:w0*k*.8,gR:mat.g+.15+(mat.osb?.08:0),gF:+P.gFloor,pF:+P.pFloor,gA:(P.mansard&&P.roof!=='shed')?+P.gMans:+P.gAttic,pA:(P.mansard&&P.roof!=='shed')?+P.pMans:+P.pAttic,gW:+P.gWall};
}
function bend({b,h,L,qd,qn,lim,cM=1/8,cF=5/384}){
  const W=b*h*h/6, I=b*h**3/12, M=cM*qd*L*L, sig=M/W, f=cF*qn*L**4/(E_MOD*I), fl=L/lim;
  return {W,I,M,sig,f,fl,uS:sig/R_I,uF:f/fl,u:Math.max(sig/R_I,f/fl)};
}
function joistCheck(P,L){
  const l=loads(P), b=+P.joistB, h=+P.joistH, s=+P.joistS/1000, self=SELF*b*h;
  const qd=(l.gF*1.2+l.pF*1.3)*s+self*1.1, qn=(l.gF+l.pF)*s+self;
  return {...bend({b,h,L,qd,qn,lim:250}),qd,qn,L,b,h};
}
function autoMid(P){
  const bb=+P.beamB, B=+P.B;
  for(let n=0;n<=4;n++){const L=(B-bb)/(n+1); if(L<=6000 && joistCheck(P,L).u<=1) return n;}
  return 4;
}

