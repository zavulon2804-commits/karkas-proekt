/* ========================================================================
   ИНТЕРФЕЙС
   ======================================================================== */
const opt=(o,fn)=>Object.entries(o).map(([k,v])=>[k,fn?fn(k,v):(v.name||v.n||v)]);
const FORM=[
  {id:'site',t:'1 · Исходные данные: участок',custom:'site'},
  {id:'house',t:'3 · Исходные данные: технология и размеры',open:true,f:[
    {k:'tech',l:'Технология строительства',type:'sel',opts:Object.entries(TECH).map(([k,v])=>[k,v.n]),wide:true},
    {note:'techMsg'},
    {k:'name',l:'Название проекта',type:'text',wide:true},
    {k:'A',l:'Длина дома (ось X)',u:'мм',min:3000,max:24000,step:100},
    {k:'B',l:'Ширина дома (ось Y)',u:'мм',min:3000,max:12000,step:100},
    {k:'H',l:'Высота стены',u:'мм',min:2200,max:3600,step:50},
    {k:'lumber',l:'Пиломатериал каркаса',type:'sel',opts:[['planed','1. Доска сухая строганая'],['edged','2. Доска сухая обрезная']],wide:true},
    {hint:'Размеры наружные, по обвязке. Конёк идёт вдоль длины. Высота — от чернового пола до верха верхней обвязки. Сечения всех деталей выбираются из базы материалов (вкладка «База материалов») по выбранному типу доски и подбираются по расчёту автоматически.'},{note:'lumberMsg'}]},
  {id:'walls',t:'КР · Каркас стен',f:[
    {k:'studSec',l:'Стойка (ширина = утеплитель)',type:'sec',keys:['studB','studH'],rows:()=>frameRows(r=>r.b>=40&&r.h>=95)},
    {k:'studS',l:'Шаг стоек',u:'мм',min:300,max:1000,step:5},
    {k:'partH',l:'Стойка перегородок',type:'secH',rows:()=>frameRows(r=>r.b===+P.studB&&r.h>=70)},
    {k:'partS',l:'Шаг стоек перегородок',u:'мм',min:300,max:1000,step:5},
    {k:'lintelH',l:'Перемычка: доска',type:'secH',rows:()=>frameRows(r=>r.b===+P.studB&&r.h>=120)},
    {k:'lintelPly',l:'Перемычка: досок',type:'sel',opts:[[2,'2'],[3,'3']]},
    {k:'corner',l:'Углы и примыкания стен',type:'sel',opts:[['warm','Тёплый угол: доска 45×100 плашмя'],['three','Классический: дополнительная стойка']],wide:true},
    {k:'topPlates',l:'Верхняя обвязка',type:'sel',opts:[[2,'двойная'],[1,'одинарная (балки над стойками)']]},
    {k:'instLayer',l:'Инсталляционный слой 50 мм изнутри',type:'chk'},
    {k:'windBoard',l:'Ветрозащитная плита ДВП вместо мембраны',type:'chk'},
    {k:'bracing',l:'Жёсткость стен от ветра',type:'sel',opts:[['sheathing','Плитная обшивка'],['braces','Укосины (раскосы) по СНиП']],wide:true},
    {k:'sheathMat',l:'Обшивка',type:'sel',opts:Object.entries(SHEATH).map(([k,v])=>[k,v.n])},
    {k:'nailStep',l:'Шаг крепежа по краю листа',type:'sel',opts:[[150,'150 мм'],[100,'100 мм']]},
    {k:'braceSec',l:'Доска укосины (врезная)',type:'sec',keys:['braceB','braceH'],rows:()=>dbRows('edged',r=>r.b<=32),show:()=>P.bracing==='braces'},
    {hint:'Укосины ставятся под 45–60° на сплошных участках стены, в каждой стене — обоих направлений. Если по СНиП им не хватает места (мешают проёмы), стена автоматически получает плитную обшивку. Фронтоны обшиваются всегда.'}]},
  {id:'ops',t:'АР · Окна и двери',custom:'ops'},
  {id:'iw',t:'АР · Перегородки',custom:'iw'},
  {id:'blocks',t:'АР · Крылья дома',custom:'blocks'},
  {id:'rooms',t:'АР · Помещения',custom:'rooms'},
  {id:'fin',t:'АР · Отделка',f:[{k:'finFacade',l:'Фасад',type:'sel',opts:finOpts('facade'),wide:true},{k:'finWall',l:'Стены помещений (по умолчанию)',type:'sel',opts:finOpts('wall'),wide:true},{k:'finFloor',l:'Пол (по умолчанию)',type:'sel',opts:finOpts('floor'),wide:true},{k:'finCeil',l:'Потолок (по умолчанию)',type:'sel',opts:finOpts('ceil'),wide:true},
    {hint:'Санузлам и ванным плитка назначается сама (по названию помещения); котельной, кухне и прихожей — керамогранит на пол. Отделку отдельной комнаты меняйте на плане: нажмите на помещение.'}]},
  {id:'found',t:'КР · Фундамент и пол',f:[
    {k:'pile',l:'Свая',type:'sel',opts:opt(PILES),wide:true},
    {k:'pileFd',l:'Несущая способность сваи',u:'кН',min:5,max:300,step:1,show:()=>P.pile==='manual'},
    {k:'soil',l:'Грунт на глубине лопасти',type:'sel',opts:opt(SOILS),wide:true},
    {k:'freeze',l:'Глубина промерзания',u:'мм',min:300,max:3000,step:50},
    {k:'pileLen',l:'Длина сваи',type:'sel',opts:[['auto','авто (по расчёту)'],...ALL_LENS.map(v=>[v,String(v)])]},
    {k:'pileMaxS',l:'Макс. шаг свай',u:'мм',min:800,max:4000,step:50},
    {k:'plinth',l:'Оголовок над землёй',u:'мм',min:200,max:1500,step:50},
    {k:'beamType',l:'Ростверк',type:'sel',opts:[['brus','Брус'],['pack','Пакет из досок «ёлочкой»']],wide:true},
    {k:'beamSec',l:'Сечение бруса',type:'sec',keys:['beamB','beamH'],rows:()=>dbRows('beam'),show:()=>P.beamType!=='pack'},
    {k:'packSec',l:'Доска пакета (на ребро)',type:'sec',keys:['packB','packH'],rows:()=>frameRows(r=>r.b>=40&&r.h>=145),show:()=>P.beamType==='pack'},
    {k:'beamPly',l:'Досок в пакете',type:'sel',opts:[[2,'2'],[3,'3'],[4,'4']],show:()=>P.beamType==='pack'},
    {k:'beamsMid',l:'Промежуточные балки',type:'sel',opts:[['auto','авто'],[0,'0'],[1,'1'],[2,'2'],[3,'3']]},
    {k:'joistSec',l:'Лага пола',type:'sec',keys:['joistB','joistH'],rows:()=>frameRows(r=>r.b>=40&&r.h>=120)},
    {k:'joistS',l:'Шаг лаг',u:'мм',min:300,max:1000,step:5},
    {k:'floorOsb',l:'OSB пола',u:'мм',type:'sel',opts:[[18,'18'],[22,'22']]},
    {hint:'Винтовые — по таблицам производителей. Забивные и буронабивные ЖБ — по СП 24.13330 (сопротивление под остриём + трение). Длина «авто» подбирается так, чтобы прошли проверки на нагрузку и пучение. Точные данные даёт геология.'}]},
  {id:'roof',t:'АР · Кровля',f:[
    {k:'roof',l:'Тип крыши',type:'sel',opts:[['gable','Двускатная'],['shed','Односкатная']]},
    {k:'slope',l:'Уклон',u:'°',min:5,max:60,step:1},
    {k:'roofMat',l:'Покрытие',type:'sel',opts:opt(ROOFS),wide:true},
    {k:'overhang',l:'Карнизный свес',u:'мм',min:0,max:1000,step:10},
    {k:'gableOver',l:'Фронтонный свес',u:'мм',min:0,max:800,step:10},
    {k:'rafterSec',l:'Стропило',type:'sec',keys:['rafterB','rafterH'],rows:()=>frameRows(r=>r.b>=40&&r.h>=120)},
    {k:'rafterS',l:'Шаг стропил',u:'мм',min:300,max:1200,step:5},
    {k:'attSec',l:'Балка перекрытия',type:'sec',keys:['attB','attH'],rows:()=>frameRows(r=>r.b>=40&&r.h>=120)},
    {k:'rafterSys',l:'Стропильная система',type:'sel',opts:[['hang','Висячая — балки перекрытия работают затяжками'],['purlin','Наслонная — коньковый прогон на стойках']],wide:true,show:()=>!P.mansard&&P.roof!=='shed'},
    {k:'eaveFilly',l:'Свес кровли',type:'sel',opts:[['auto','Автоматически: кобылки при свесе от 600 мм или длинном стропиле'],['yes','Кобылки к стропилам'],['no','Свес — продолжение стропила']],wide:true,show:()=>P.roof!=='shed'},
    {k:'ridgeJoint',l:'Стропила на коньке',type:'sel',opts:[['butt','В стык с подрезкой — торцы запилены по уклону'],['lap','Внахлёст — стропила рядом, стянуты болтом']],wide:true,show:()=>P.roof!=='shed'},
    {k:'purSec',l:'Коньковый прогон (брус)',type:'sec',keys:['purB','purH'],rows:()=>dbRows('beam'),show:()=>P.rafterSys==='purlin'&&!P.mansard&&P.roof!=='shed'},
    {k:'postSec',l:'Стойка и лежень (брус)',type:'sec',keys:['postB','postH'],rows:()=>dbRows('beam'),show:()=>P.rafterSys==='purlin'&&!P.mansard&&P.roof!=='shed'},
    {k:'postS',l:'Шаг стоек прогона',u:'мм',min:1500,max:6000,step:100,show:()=>P.rafterSys==='purlin'&&!P.mansard&&P.roof!=='shed'},
    {k:'purStruts',l:'Подкосы от стоек к прогону (45°)',type:'chk',show:()=>P.rafterSys==='purlin'&&!P.mansard&&P.roof!=='shed'},
    {k:'collar',l:'Схватки на парах стропил',type:'chk',show:()=>P.rafterSys==='purlin'&&!P.mansard&&P.roof!=='shed'},
    {k:'strut',l:'Стойки под стропила в середине пролёта',type:'chk',show:()=>!P.mansard&&P.rafterSys!=='purlin'},
    {k:'mansard',l:'Мансарда — жилой этаж под крышей',type:'chk',show:()=>P.roof!=='shed'},
    {k:'kneeH',l:'Высота стенки мансарды',u:'мм',min:600,max:2000,step:50,show:()=>P.mansard&&P.roof!=='shed'},
    {k:'mansH',l:'Высота потолка мансарды',u:'мм',min:2100,max:3200,step:50,show:()=>P.mansard&&P.roof!=='shed'},
    {k:'kneeD',l:'Стойка стенки мансарды',type:'secH',rows:()=>frameRows(r=>r.b===+P.studB&&r.h>=70),show:()=>P.mansard&&P.roof!=='shed'},
    {hint:'Холодный чердак, висячая стропильная система: балки чердака работают затяжками.'}]},
  {id:'loads',t:'2 · Исходные данные: климат и нагрузки',f:[
    {k:'snow',l:'Снеговая нагрузка',type:'sel',opts:()=>[...(P.site?[['site',`По местоположению — ${fmt(snowVal({...P,snow:'site'}),2)} кПа`]]:[]),...Object.entries(SNOW).map(([k,v])=>[k,`Район ${k} — ${fmt(v,1)} кПа`])],wide:true},
    {k:'wind',l:'Ветровое давление',type:'sel',opts:()=>[...(P.site?[['site',`По местоположению — ${fmt(windVal({...P,wind:'site'}),3)} кПа`]]:[]),...Object.entries(WIND).map(([k,v])=>[k,`Район ${k} — ${fmt(v,2)} кПа`])],wide:true},
    {k:'terrain',l:'Тип местности',type:'sel',opts:opt(TERRAIN),wide:true},
    {k:'gFloor',l:'Пол: собственный вес',u:'кПа',min:.1,max:3,step:.05},
    {k:'pFloor',l:'Пол: полезная',u:'кПа',min:.5,max:5,step:.1},
    {k:'gAttic',l:'Чердак: собственный вес',u:'кПа',min:.1,max:2,step:.05,show:()=>!P.mansard},
    {k:'pAttic',l:'Чердак: полезная',u:'кПа',min:.3,max:3,step:.1,show:()=>!P.mansard},
    {k:'gMans',l:'Пол мансарды: вес + перегородки',u:'кПа',min:.2,max:3,step:.05,show:()=>P.mansard},
    {k:'pMans',l:'Мансарда: полезная',u:'кПа',min:.5,max:5,step:.1,show:()=>P.mansard},
    {k:'gWall',l:'Вес стены',u:'кПа',min:.2,max:2,step:.05},
    {hint:'Район — по картам СП 20.13330. 1 кПа ≈ 100 кг/м². Полезная нагрузка на пол жилого дома — 1,5 кПа, на холодный чердак — 0,7 кПа.'}]},
  {id:'cutp',t:'Склад и раскрой',f:[
    {k:'stocks',l:'Длины досок для сечений не из базы, мм',type:'text',wide:true},
    {hint:'Длины и цены для сечений из базы задаются во вкладке «База материалов».'},
    {k:'kerf',l:'Пропил',u:'мм',min:0,max:10,step:1}]},
  {id:'prices',t:'Цены',f:[
    {k:'prices.wood',l:'Пиломатериал не из базы',u:'₽/м³'},{k:'prices.anchor',l:'Анкерный уголок',u:'₽/шт'},{k:'prices.windBoard',l:'Ветрозащитная ДВП',u:'₽/лист'},{k:'prices.ply9',l:'Фанера 9 мм',u:'₽/лист'},{k:'prices.csp12',l:'ЦСП 12 мм',u:'₽/лист'},{k:'prices.pile',l:'Винтовая свая',u:'₽/шт'},
    {k:'prices.pileWork',l:'Монтаж винтовой',u:'₽/шт'},{k:'prices.rc20',l:'Свая С20.20',u:'₽/м'},
    {k:'prices.rc30',l:'Свая С30.30',u:'₽/м'},{k:'prices.rcDrive',l:'Забивка сваи',u:'₽/шт'},
    {k:'prices.concrete',l:'Бетон В20',u:'₽/м³'},{k:'prices.rebar',l:'Арматура',u:'₽/кг'},
    {k:'prices.sleeve',l:'Гильза / рубероид',u:'₽/м'},{k:'prices.boredWork',l:'Бурение и заливка',u:'₽/шт'},
    {k:'prices.plate',l:'Закладная пластина',u:'₽/шт'},{k:'prices.osb9',l:'OSB 9 мм',u:'₽/лист'},
    {k:'prices.osb12',l:'OSB 12 мм',u:'₽/лист'},{k:'prices.osb22',l:'OSB 18–22 мм',u:'₽/лист'},
    {k:'prices.insul',l:'Минвата',u:'₽/м³'},{k:'prices.wind',l:'Мембрана, рулон',u:'₽'},
    {k:'prices.vapor',l:'Пароизоляция, рулон',u:'₽'},{k:'prices.roofMetal',l:'Металлочерепица',u:'₽/м²'},
    {k:'prices.roofProf',l:'Профнастил',u:'₽/м²'},{k:'prices.roofSoft',l:'Гибкая черепица',u:'₽/м²'},
    {k:'prices.roofOndulin',l:'Ондулин',u:'₽/м²'},{k:'prices.nails',l:'Гвозди',u:'₽/кг'},
    {k:'prices.screws',l:'Саморезы',u:'₽/тыс.'},{k:'prices.bracket',l:'Уголок / опора',u:'₽/шт'},
    {k:'prices.antiseptic',l:'Антисептик',u:'₽/л'},
    {hint:'Цены примерные — впишите свои из прайса поставщика.'}]},
  {id:'file',t:'Файл проекта',custom:'file'}
];
const F_ORDER=['site','loads','house','blocks','iw','ops','rooms','fin','roof','found','walls','cutp','prices','file'];FORM.sort((a,c)=>F_ORDER.indexOf(a.id)-F_ORDER.indexOf(c.id));
const getK=k=>k.split('.').reduce((o,x)=>o?.[x],P);
const setK=(k,v)=>{const p=k.split('.');let o=P;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p.at(-1)]=v};

function renderSide(){
  const el=$('#side'); let h=`<h2 class="side-h"></h2><div class="start"><label for="tplSel">Начать с шаблона</label><div class="btns"><select id="tplSel">${Object.entries(TEMPLATES).map(([k,t])=>`<option value="${k}">${esc(t.n)}</option>`).join('')}</select><button class="btn sm" id="tplGo">Загрузить</button></div><div class="note" id="tplMsg">Шаблон заменит текущий проект. Отменить — кнопкой ↶ вверху.</div></div>`;
  const openState=(()=>{try{return JSON.parse(localStorage.getItem(LS_KEY+'-open')||'null')}catch(e){return null}})()||{site:true,house:true};
  FORM.forEach(g=>{
    h+=`<details class="grp" data-g="${g.id}" ${openState[g.id]?'open':''}><summary>${esc(g.t.replace(/^(\d+ · Исходные данные: |АР · |КР · )/,'').replace(/^./,c=>c.toUpperCase()))}<small id="sum-${g.id}"></small></summary>`;
    if(g.custom) h+=`<div id="custom-${g.custom}"></div>`;
    else{h+='<div class="fields">';g.f.forEach(f=>{
      if(f.hint){h+=`<div class="hint">${esc(f.hint)}</div>`;return}
      if(f.note){h+=`<div class="hint" id="${f.note}" role="status"></div>`;return}
      if(f.type==='sec'||f.type==='secH'){const id='f_'+f.k,hide=f.show&&!f.show(),rows=f.rows(),cur=f.type==='sec'?`${P[f.keys[0]]}x${P[f.keys[1]]}`:String(P[f.k]);
        let ops=f.type==='sec'?rows.map(r=>[`${r.b}x${r.h}`,`${r.b}×${r.h}`]):[...new Set(rows.map(r=>r.h))].map(h=>[String(h),`${P.studB}×${h}`]);
        if(!ops.some(o=>o[0]===cur))ops.unshift([cur,(f.type==='sec'?cur.replace('x','×'):`${P.studB}×${cur}`)+' — нет в базе']);
        h+=`<div class="fld${f.wide?' wide':''}" ${hide?'hidden':''} data-k="${f.k}"><label for="${id}">${esc(f.l)}</label><div class="inp"><select id="${id}" data-k="${f.k}" ${f.type==='sec'?`data-sec="${f.keys.join(',')}"`:''}>${ops.map(([v,lab])=>`<option value="${v}" ${v===cur?'selected':''}>${esc(lab)}</option>`).join('')}</select><span class="u">мм</span></div></div>`;return}
      const id='f_'+f.k.replace('.','_'), v=getK(f.k), hide=f.show&&!f.show(), al=techLim(f.k);
      if(al&&f.type!=='chk'&&!(f.type==='sel')){h+=`<div class="fld${f.wide?' wide':''}" ${hide?'hidden':''} data-k="${f.k}"><label for="${id}">${esc(f.l)} 🔒</label><div class="inp"><select id="${id}" data-k="${f.k}">${al.map(x=>`<option value="${x}" ${String(x)===String(v)?'selected':''}>${x}</option>`).join('')}</select>${f.u?`<span class="u">${esc(f.u)}</span>`:''}</div></div>`;return}
      if(al&&f.type==='chk'){h+=`<div class="fld chk" ${hide?'hidden':''} data-k="${f.k}"><input type="checkbox" id="${id}" data-k="${f.k}" ${v?'checked':''} disabled><label for="${id}">${esc(f.l)} 🔒</label></div>`;return}
      if(f.type==='chk'){h+=`<div class="fld chk" ${hide?'hidden':''} data-k="${f.k}"><input type="checkbox" id="${id}" data-k="${f.k}" ${v?'checked':''}><label for="${id}">${esc(f.l)}</label></div>`;return}
      h+=`<div class="fld${f.wide?' wide':''}" ${hide?'hidden':''} data-k="${f.k}"><label for="${id}">${esc(f.l)}</label><div class="inp">`;
      if(f.type==='sel') h+=`<select id="${id}" data-k="${f.k}">${(typeof f.opts==='function'?f.opts():f.opts).filter(([k])=>!al||al.some(x=>String(x)===String(k))).map(([k,lab])=>`<option value="${esc(k)}" ${String(k)===String(v)?'selected':''}>${esc(lab)}</option>`).join('')}</select>`;
      else if(f.type==='text') h+=`<input type="text" id="${id}" data-k="${f.k}" value="${esc(v)}">`;
      else if(f.type==='size') h+=`<input type="number" inputmode="numeric" id="${id}" data-k="${f.k}" value="${esc(v)}" list="dl_${id}" min="${f.min}" max="${f.max}" step="5"><datalist id="dl_${id}">${f.list.map(x=>`<option value="${x}">`).join('')}</datalist>`;
      else h+=`<input type="number" inputmode="decimal" id="${id}" data-k="${f.k}" value="${esc(v)}" ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''} step="${f.step||'any'}">`;
      if(f.u) h+=`<span class="u">${esc(f.u)}</span>`;
      h+='</div></div>';});h+='</div>'}
    h+='</details>';
  });
  el.innerHTML=h;
  el.querySelectorAll('details.grp').forEach(d=>d.addEventListener('toggle',()=>{const st={};el.querySelectorAll('details.grp').forEach(x=>st[x.dataset.g]=x.open);try{localStorage.setItem(LS_KEY+'-open',JSON.stringify(st))}catch(e){}}));
  el.querySelectorAll('.fields [data-k]').forEach(inp=>{if(inp.tagName==='DIV')return;
    inp.addEventListener(inp.type==='checkbox'||inp.tagName==='SELECT'?'change':'input',()=>{
      const k=inp.dataset.k; let v;
      if(inp.type==='checkbox') v=inp.checked; else if(inp.type==='number'){v=parseFloat(inp.value);if(!Number.isFinite(v))return;if(inp.min!==''&&v<+inp.min)return;if(inp.max!==''&&v>+inp.max)return} else v=inp.value;
      if(inp.dataset.sec){const [kb,kh]=inp.dataset.sec.split(','),[vb,vh]=v.split('x').map(Number);P[kb]=vb;P[kh]=vh;if(kb==='studB'){mapToDb();setTimeout(renderSide,0)}schedule();return}
      if(inp.tagName==='SELECT'&&/^-?\d+(\.\d+)?$/.test(v)&&!['snow','wind'].includes(k)) v=+v;
      setK(k,v);
      if(k==='tech'){setTimeout(()=>{const T=TECH[v]||TECH.free;if(T.def)Object.assign(P,T.def);const ch=mapToDb(),fx=autoFix();renderSide();rebuild();const m=$('#techMsg');if(m)m.textContent=T.about?`${T.about} Параметры приведены к технологии${ch.length?'; сечения: '+ch.join('; '):''}${fx.length?'; по расчёту: '+fx.join('; '):''}. Поля с 🔒 задаёт технология.`:'Все параметры можно менять вручную.'},0);return}
      if(k==='lumber'){setTimeout(()=>{const t=runMapFix();const m=$('#lumberMsg');if(m)m.textContent=(v==='planed'?'Выбрана доска сухая строганая. ':'Выбрана доска сухая обрезная. ')+t},0);return}
      if(k==='freeze')P.freezeAuto=false;
      if(k==='soil'&&P.freezeAuto&&P.site){const f=freezeFromSite(P);if(f){P.freeze=f;setTimeout(renderSide,0)}}
      if(k==='bracing'||k==='beamType'){if(k==='beamType')mapToDb();setTimeout(renderSide,0)} if(k==='pile') document.querySelector('.fld[data-k="pileFd"]').hidden=P.pile!=='manual';
      if(k==='roof'||k==='mansard'||k==='rafterSys'){setTimeout(()=>{renderSide();},0)}
      schedule();
    })});
  renderOps(); renderIW(); renderBlocks(); renderRooms(); renderFile(); renderSite();
  $('#tplGo').onclick=()=>{const t=TEMPLATES[$('#tplSel').value],keep={tech:P.tech,lumber:P.lumber,site:P.site,snow:P.snow,wind:P.wind,climMode:P.climMode,freeze:P.freeze,freezeAuto:P.freezeAuto,db:P.db};P=normalize(t.f());Object.assign(P,keep);{const T=TECH[P.tech];if(T&&T.def)Object.assign(P,T.def)}mapToDb();const fx=autoFix();renderSide();rebuild();$('#tplMsg').textContent='Загружен шаблон «'+t.n+'»'+(fx.length?'. Сечения подобраны по расчёту: '+fx.join('; '):'')+'. Отменить — кнопкой ↶.'};
  renderSums();
  applyStep();
}
function tpl(name,A,B,H,walls,ops){const o=clone(DEF);return Object.assign(o,{name,A,B,H,walls,openings:ops})}
const W=(wall,type,x,w,h=type==='door'?2100:1400,sill=type==='door'?0:900)=>({wall,type,x,w,h,sill});
const TEMPLATES={
  t66:{n:'Гостевой дом 6×6',f:()=>tpl('Гостевой дом 6×6',6000,6000,2700,[{axis:'y',c:3500,from:0,to:6000,bearing:false}],[W('W1','door',1200,900),W('W1','window',3800,1200),W('W2','window',2200,1200),W('W3','window',2000,1200),W('W4','window',2500,600,600,1500),W('I1','door',2000,800)])},
  t86:{n:'Дом 8×6',f:()=>tpl('Дом 8×6',8000,6000,2800,[{axis:'y',c:4000,from:0,to:6000,bearing:false}],[W('W1','window',800,1200),W('W1','door',3550,900),W('W1','window',5800,1200),W('W2','window',2200,1200),W('W3','window',1500,1200),W('W3','window',5500,1200),W('W4','window',2200,1200),W('I1','door',2400,800)])},
  t88:{n:'Дом 8×8',f:()=>tpl('Дом 8×8',8000,8000,2800,[{axis:'x',c:4000,from:0,to:8000,bearing:true},{axis:'y',c:4000,from:4050,to:8000,bearing:false}],[W('W1','window',800,1200),W('W1','door',3500,1000),W('W1','window',5800,1200),W('W2','window',1200,1200),W('W2','window',5000,1200),W('W3','window',1200,1200),W('W3','window',5600,1200),W('W4','window',1500,1200),W('W4','window',5000,1200),W('I1','door',1500,900),W('I1','door',5500,900),W('I2','door',1000,800)])},
  t97:{n:'Дом 9×7 (пример)',f:()=>clone(DEF)},
  t88m:{n:'Дом 8×8 с мансардой',f:()=>Object.assign(tpl('Дом 8×8 с мансардой',8000,8000,2700,[{axis:'x',c:4000,from:0,to:8000,bearing:true},{axis:'y',c:4000,from:4050,to:8000,bearing:false}],[W('W1','window',800,1200),W('W1','door',3500,1000),W('W1','window',5800,1200),W('W2','window',1200,1200),W('W2','window',5000,1200),W('W3','window',1200,1200),W('W3','window',5600,1200),W('W4','window',1500,1200),W('W4','window',5000,1200),W('I1','door',1500,900),W('I1','door',5500,900),W('I2','door',1000,800),W('G2','window',3400,1200,1200,800),W('G4','window',3400,1200,1200,800)]),{slope:45,mansard:true,kneeH:1200,mansH:2400})},
  tg:{n:'Г-образный дом 9×7 + крыло 4×4',f:()=>Object.assign(tpl('Г-образный дом 9×7 + крыло 4×4',9000,7000,2800,[{axis:'x',c:3500,from:0,to:9000,bearing:true},{axis:'y',c:4500,from:3550,to:7000,bearing:false}],[W('W1','window',800,1200),W('W1','door',3900,1000),W('W1','window',6600,1500),W('W2','door',1500,900),W('W3','window',1500,1200),W('W3','window',6000,900,600,1500),W('W4','window',3800,1200),W('W6','window',1200,1200),W('W7','window',1400,1200),W('I1','door',2000,900),W('I1','door',6000,900),W('I2','door',800,800)]),{blocks:[{side:'W2',off:0,w:4000,depth:4000}]})},
  tt:{n:'Т-образный дом 10×8 + крыло 4×4 сзади',f:()=>Object.assign(tpl('Т-образный дом 10×8 + крыло 4×4',10000,8000,2800,[{axis:'x',c:4000,from:0,to:10000,bearing:true},{axis:'y',c:5000,from:0,to:3950,bearing:false}],[W('W1','window',1000,1500),W('W1','door',4500,1000),W('W1','window',7500,1500),W('W2','window',3400,1200),W('W3','window',1000,1200),W('W3','door',4550,900),W('W3','window',7800,1200),W('W4','window',3400,1200),W('W5','window',1200,1200),W('W6','window',1400,1200),W('W7','window',1200,1200),W('I1','door',2000,900),W('I1','door',7000,900),W('I2','door',1500,800)]),{blocks:[{side:'W3',off:3000,w:4000,depth:4000}]})},
  tp:{n:'П-образный дом 12×8 + 2 крыла 3,5×4 сзади',f:()=>Object.assign(tpl('П-образный дом 12×8 + 2 крыла',12000,8000,2800,[{axis:'x',c:4000,from:0,to:12000,bearing:true},{axis:'y',c:6000,from:0,to:3950,bearing:false}],[W('W1','window',1500,1500),W('W1','door',5500,1000),W('W1','window',8800,1500),W('W2','window',5000,1200),W('W3','door',1300,900),W('W3','window',5200,1500),W('W3','door',9800,900),W('W4','window',5000,1200),W('W5','window',1300,1200),W('W6','window',1000,1200),W('W9','window',1000,1200),W('W10','window',1300,1200),W('I1','door',2000,900),W('I1','door',9500,900),W('I2','door',1500,800)]),{blocks:[{side:'W3',off:0,w:3500,depth:4000},{side:'W3',off:8500,w:3500,depth:4000}]})},
  tk:{n:'Крестовый дом 12×10 + 4 крыла',f:()=>Object.assign(tpl('Крестовый дом 12×10 + 4 крыла',12000,10000,2800,[{axis:'x',c:5000,from:0,to:12000,bearing:true},{axis:'y',c:6000,from:0,to:4950,bearing:false}],[W('W1','door',1500,1000),W('W1','window',9500,1500),W('W3','window',1500,1500),W('W3','window',9500,1500),W('W2','window',1000,1200),W('W4','window',1000,1200),W('W5','window',1300,1200),W('W8','window',1300,1200),W('W11','window',1300,1200),W('W14','window',1300,1200),W('I1','door',2500,900),W('I1','door',8500,900),W('I2','door',1500,800)]),{blocks:[{side:'W1',off:4000,w:4000,depth:3000},{side:'W3',off:4000,w:4000,depth:3500},{side:'W2',off:3000,w:4000,depth:3000},{side:'W4',off:3000,w:4000,depth:3000}]})},
  tsh:{n:'Ш-образный дом 14×8 + 3 крыла спереди',f:()=>Object.assign(tpl('Ш-образный дом 14×8 + 3 крыла',14000,8000,2800,[{axis:'x',c:4000,from:0,to:14000,bearing:true}],[W('W3','window',1500,1500),W('W3','door',6500,1000),W('W3','window',11000,1500),W('W1','door',3500,900),W('W1','door',9600,900),W('W5','window',1200,1200),W('W6','window',1000,1200),W('W8','window',1200,1200),W('W11','window',1000,1200),W('W13','window',1200,1200),W('W2','window',5000,1200),W('W4','window',5000,1200)]),{blocks:[{side:'W1',off:0,w:3000,depth:3500},{side:'W1',off:5500,w:3000,depth:3500},{side:'W1',off:11000,w:3000,depth:3500}]})},
  t1210:{n:'Дом 12×10',f:()=>tpl('Дом 12×10',12000,10000,2800,[{axis:'x',c:5000,from:0,to:12000,bearing:true},{axis:'y',c:4000,from:5050,to:10000,bearing:false},{axis:'y',c:8000,from:0,to:4950,bearing:false}],[W('W1','window',1000,1500),W('W1','door',5500,1000),W('W1','window',8500,1500),W('W2','window',2000,1200),W('W2','window',6500,1200),W('W3','window',1500,1200),W('W3','window',5000,1500),W('W3','window',9000,900,600,1500),W('W4','window',2000,1200),W('W4','window',6500,1200),W('I1','door',2500,900),W('I1','door',6500,900),W('I1','door',9500,900),W('I2','door',1500,800),W('I3','door',2000,800)])}
};
function renderSums(){
  if(!M) return; const set=(id,t)=>{const e=$('#sum-'+id);if(e)e.textContent=t};
  set('house',`${(TECH[P.tech]||TECH.free).short} · ${fmt(M.A/1000,1)}×${fmt(M.B/1000,1)} м`);
  set('found',`${M.piles.length} × ${M.pileT.short}`);
  set('walls',`${M.b}×${M.d} / ${P.studS}`);
  set('roof',`${M.gable?'двускатная':'односкатная'} ${M.deg}°${M.mans?' + мансарда':''}`);
  set('loads',`снег ${fmt(snowVal(P),2)} · ветер ${fmt(windVal(P),2)} кПа`);set('site',P.site?P.site.name:'не задано');
}
/* история изменений */
let HIST=[],HI=-1;
function pushHistory(){const j=JSON.stringify(P);if(HIST[HI]===j)return;HIST=HIST.slice(0,HI+1);HIST.push(j);if(HIST.length>80)HIST.shift();HI=HIST.length-1;updUndo()}
function undoRedo(d){const n=HI+d;if(n<0||n>=HIST.length)return;HI=n;P=normalize(JSON.parse(HIST[HI]));renderSide();rebuild();updUndo()}
function updUndo(){const u=$('#undo'),r=$('#redo');if(u)u.disabled=HI<=0;if(r)r.disabled=HI>=HIST.length-1}
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;const t=e.target.tagName;if(t==='INPUT'||t==='TEXTAREA')return;
  if(e.key.toLowerCase()==='z'&&!e.shiftKey){e.preventDefault();undoRedo(-1)}else if(e.key.toLowerCase()==='y'||(e.key.toLowerCase()==='z'&&e.shiftKey)){e.preventDefault();undoRedo(1)}});
function wallOptions(){const wg=(P.blocks||[]).flatMap((k,i)=>{const id0=5+3*i;return [[`W${id0}`,`Стена ${id0} (крыло ${i+1}, боковая)`],[`W${id0+1}`,`Стена ${id0+1} (крыло ${i+1}, торцевая)`],[`W${id0+2}`,`Стена ${id0+2} (крыло ${i+1}, боковая)`]]});const ex=[['W1','Стена 1 (фасад, y=0)'],['W2','Стена 2 (правая)'],['W3','Стена 3 (задняя)'],['W4','Стена 4 (левая)'],...(P.roof!=='shed'?[['G2','Фронтон 2 (правый, над стеной 2)'],['G4','Фронтон 4 (левый, над стеной 4)']]:[])];return [...ex,...wg,...P.walls.map((w,i)=>['I'+(i+1),'Перегородка I'+(i+1)])]}
function renderOps(){
  const el=$('#custom-ops'); if(!el) return;
  const wo=wallOptions();
  let h='<div class="rows">';
  P.openings.forEach((o,i)=>{
    const st=M?.ops?.[i];
    h+=`<div class="row op" data-i="${i}">
      <div class="s2"><label for="o${i}w">Стена</label><select id="o${i}w" data-f="wall">${wo.map(([k,l])=>`<option value="${k}" ${k===o.wall?'selected':''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="s2"><label for="o${i}t">Тип${st?.mark?` · <span class="mk">${st.mark}</span>`:''}</label><select id="o${i}t" data-f="type"><option value="window" ${o.type==='window'?'selected':''}>окно</option><option value="door" ${o.type==='door'?'selected':''}>дверь</option></select></div>
      <button class="x" data-del="${i}" aria-label="Удалить проём">×</button>
      <div><label for="o${i}x">Отступ</label><input id="o${i}x" type="number" data-f="x" value="${o.x}" step="10"></div>
      <div><label for="o${i}ww">Ширина</label><input id="o${i}ww" type="number" data-f="w" value="${o.w}" step="10"></div>
      <div><label for="o${i}h">Высота</label><input id="o${i}h" type="number" data-f="h" value="${o.h}" step="10"></div>
      <div><label for="o${i}s">Низ</label><input id="o${i}s" type="number" data-f="sill" value="${o.type==='door'?0:o.sill}" step="10" ${o.type==='door'?'disabled':''}></div><span></span>
      ${st&&!st.ok?`<div class="err">${esc(st.msg)}</div>`:''}
    </div>`});
  h+=`</div><div class="btns" style="padding-bottom:12px"><button class="btn sm" id="addWin">+ окно</button><button class="btn sm" id="addDoor">+ дверь</button></div>
  <div class="hint" style="padding-bottom:10px">Фронтоны G2/G4 — окна мансарды или чердака: отступ от стены 1, низ — от пола мансарды. Отступ — от начала стены до края проёма (начало отмечено стрелкой на листе «План стен»). Низ окна и высота — от чернового пола. Размеры — черновой проём.</div>`;
  el.innerHTML=h;
  $('#sum-ops').textContent=P.openings.length+' шт';
  el.querySelectorAll('.row').forEach(r=>{const i=+r.dataset.i;r.querySelectorAll('[data-f]').forEach(inp=>inp.addEventListener('change',()=>{const f=inp.dataset.f;let v=inp.value;if(['x','w','h','sill'].includes(f)){v=parseFloat(v);if(!Number.isFinite(v))return}P.openings[i][f]=v;if(f==='type')P.openings[i].sill=v==='door'?0:900;schedule(true)}))});
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{P.openings.splice(+b.dataset.del,1);schedule(true)}));
  $('#addWin').onclick=()=>{P.openings.push({wall:'W1',type:'window',x:1000,w:1200,h:1400,sill:900});schedule(true)};
  $('#addDoor').onclick=()=>{P.openings.push({wall:'W1',type:'door',x:1000,w:900,h:2100,sill:0});schedule(true)};
}
function renderIW(){
  const el=$('#custom-iw'); if(!el) return;
  let h='<div class="rows">';
  P.walls.forEach((w,i)=>{h+=`<div class="row iw" data-i="${i}">
    <div><label for="w${i}a">I${i+1}: направление</label><select id="w${i}a" data-f="axis"><option value="x" ${w.axis==='x'?'selected':''}>вдоль X</option><option value="y" ${w.axis==='y'?'selected':''}>вдоль Y</option></select></div>
    <div><label for="w${i}c">Ось (${w.axis==='x'?'y':'x'})</label><input id="w${i}c" type="number" data-f="c" value="${w.c}" step="10"></div>
    <div><label for="w${i}f">От</label><input id="w${i}f" type="number" data-f="from" value="${w.from}" step="10"></div>
    <div><label for="w${i}t">До</label><input id="w${i}t" type="number" data-f="to" value="${w.to}" step="10"></div>
    <div><label for="w${i}b">Несущая</label><input id="w${i}b" type="checkbox" data-f="bearing" ${w.bearing?'checked':''} style="width:auto"></div>
    <button class="x" data-del="${i}" aria-label="Удалить стену">×</button></div>`});
  h+=`</div><div class="btns" style="padding-bottom:12px"><button class="btn sm" id="addIW">+ перегородка</button></div>
  <div class="hint" style="padding-bottom:10px">Координаты — от наружного угла стен 1 и 4, мм. Концы обрезаются по внутренним граням наружных стен. Несущая перегородка вдоль X у середины дома служит опорой балкам чердака.</div>`;
  el.innerHTML=h; $('#sum-iw').textContent=P.walls.length+' шт';
  el.querySelectorAll('.row').forEach(r=>{const i=+r.dataset.i;r.querySelectorAll('[data-f]').forEach(inp=>inp.addEventListener('change',()=>{const f=inp.dataset.f;let v=inp.type==='checkbox'?inp.checked:inp.value;if(['c','from','to'].includes(f)){v=parseFloat(v);if(!Number.isFinite(v))return}P.walls[i][f]=v;schedule(true)}))});
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.del,id='I'+(i+1);P.walls.splice(i,1);
    P.openings=P.openings.filter(o=>o.wall!==id).map(o=>{const m=/^I(\d+)$/.exec(o.wall);if(m&&+m[1]>i+1)o.wall='I'+(+m[1]-1);return o});schedule(true)}));
  $('#addIW').onclick=()=>{P.walls.push({axis:'y',c:R(P.A/3),from:0,to:P.B,bearing:false});schedule(true)};
}
function renderBlocks(){
  const el=$('#custom-blocks');if(!el)return;
  let h='<div class="rows">';
  P.blocks.forEach((k,i)=>{const id0=5+3*i;h+=`<div class="row bk" data-i="${i}" style="grid-template-columns:1.3fr .8fr .8fr .8fr 26px">
    <div><label for="bk${i}s">Крыло ${i+1}: к стене</label><select id="bk${i}s" data-f="side">${[['W1','1 (спереди)'],['W2','2 (справа)'],['W3','3 (сзади)'],['W4','4 (слева)']].map(([v,l])=>`<option value="${v}" ${k.side===v?'selected':''}>${l}</option>`).join('')}</select></div>
    <div><label for="bk${i}o">Отступ</label><input id="bk${i}o" type="number" data-f="off" value="${k.off}" step="100"></div>
    <div><label for="bk${i}w">Ширина</label><input id="bk${i}w" type="number" data-f="w" value="${k.w}" step="100"></div>
    <div><label for="bk${i}d">Вынос</label><input id="bk${i}d" type="number" data-f="depth" value="${k.depth}" step="100"></div>
    <button class="x" data-del="${i}" aria-label="Удалить крыло">×</button>
    <div class="note" style="grid-column:1/-1">Стены крыла: ${id0}, ${id0+1}, ${id0+2}${M?.errs?.some(e=>e.wall==='K'+(i+1))?' · <b style="color:var(--bad)">не построено — проверьте размеры</b>':''}</div></div>`});
  h+=`</div><div class="btns" style="padding-bottom:12px"><button class="btn sm" id="addBK">+ крыло</button></div>
  <div class="hint" style="padding-bottom:10px">Крыло — прямоугольная пристройка к стене 2 (справа) или 3 (сзади): одно крыло даёт Г-образный дом, крыло в середине стены — Т-образный. Отступ — от начала стены (стена 2 — от стены 1, стена 3 — от стены 4), ширина — вдоль стены, вынос — от стены наружу, наружные размеры. Стена основного дома на стыке остаётся внутренней — добавьте в ней дверь. Для крыла строятся стены, проёмы, помещения, сваи, ростверк и пол; крыша — следующий этап.</div>`;
  el.innerHTML=h;const sm=$('#sum-blocks');if(sm)sm.textContent=P.blocks.length?P.blocks.length+' шт':'нет';
  el.querySelectorAll('.row.bk').forEach(r=>{const i=+r.dataset.i;r.querySelectorAll('[data-f]').forEach(inp=>inp.addEventListener('change',()=>{const f=inp.dataset.f;let v=inp.value;if(f!=='side'){v=parseFloat(v);if(!Number.isFinite(v))return}P.blocks[i][f]=v;schedule(true)}))});
  el.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.del,id0=5+3*i;P.blocks.splice(i,1);
    P.openings=P.openings.filter(o=>{const m=/^W(\d+)$/.exec(o.wall);return !(m&&+m[1]>=id0&&+m[1]<id0+3)}).map(o=>{const m=/^W(\d+)$/.exec(o.wall);if(m&&+m[1]>=id0+3)o.wall='W'+(+m[1]-3);return o});schedule(true)}));
  $('#addBK').onclick=()=>{const Ls=+P.B,w=Math.min(4000,Math.max(2000,Ls-1000));P.blocks.push({side:'W2',off:0,w,depth:4000});schedule(true)};
}
function renderRooms(){
  const el=$('#custom-rooms');if(!el||!M)return;if(el.contains(document.activeElement)&&document.activeElement.tagName!=='BUTTON')return;
  const rs=M.rooms||[];
  let h='<div class="rows">';
  rs.forEach((r,i)=>{h+=`<div class="row rm" data-i="${i}" style="grid-template-columns:28px minmax(0,1fr) 110px;align-items:center">
    <b class="mono" style="text-align:center">${r.no}</b>
    <div><label for="rm${i}n">${fmt(r.area,1)} м²</label><input id="rm${i}n" type="text" data-f="name" value="${esc(r.name)}" style="font-family:var(--f-ui)"></div>
    <div><label for="rm${i}k">Назначение</label><select id="rm${i}k" data-f="kind">${Object.entries(ROOM_KIND).map(([k,l])=>`<option value="${k}" ${k===r.kind?'selected':''}>${l}</option>`).join('')}</select></div></div>`});
  if(!rs.length)h+='<div class="note">Помещения не найдены: проверьте размеры дома и перегородки.</div>';
  const t=tep(M);
  h+=`</div><div class="hint" style="padding-bottom:6px">Помещения находятся сами по наружным стенам и перегородкам. Перегородка, не доходящая до стены, объединяет помещения. Впишите названия: они появятся на плане и в экспликации (лист АР-1).</div>
  <dl class="kv" style="padding-bottom:12px"><dt>Общая площадь этажа</dt><dd>${fmt(t.tot,1)} м²</dd><dt>Жилая площадь</dt><dd>${fmt(t.liv,1)} м²</dd>${t.mans?`<dt>Мансарда (h ≥ 1,5 м)</dt><dd>${fmt(t.mans,1)} м²</dd>`:''}<dt>Площадь застройки</dt><dd>${fmt(t.build,1)} м²</dd></dl>`;
  el.innerHTML=h;const sm=$('#sum-rooms');if(sm)sm.textContent=rs.length+' шт · '+fmt(t.tot,1)+' м²';
  el.querySelectorAll('.row.rm').forEach(row=>{const r=rs[+row.dataset.i];row.querySelectorAll('[data-f]').forEach(inp=>inp.addEventListener('change',()=>{
    if(!Array.isArray(P.rooms))P.rooms=[];let q=r.ref>=0?P.rooms[r.ref]:null;if(!q){q={x:r.x,y:r.y,name:r.name,kind:r.kind};P.rooms.push(q);r.ref=P.rooms.length-1}
    q.x=r.x;q.y=r.y;q[inp.dataset.f]=inp.value.trim()||('Помещение '+r.no);schedule()}))});
}
let resetArm=false;
function renderFile(){
  const el=$('#custom-file'); if(!el) return;
  el.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px;padding-bottom:12px">
    <p class="note" style="margin:0">Проект сохраняется в этом браузере автоматически. Чтобы перенести его, скопируйте JSON или сохраните файл.</p>
    <div class="btns"><button class="btn sm" id="jCopy">Копировать JSON</button>${canSave()?'<button class="btn sm" id="jSave">Скачать .json</button>':''}<label class="btn sm" for="jFile" style="display:inline-block">Открыть файл…</label><input type="file" id="jFile" accept=".json,application/json" hidden></div>
    <label for="jText" class="note">Вставить JSON проекта:</label>
    <textarea class="json" id="jText" placeholder='{"name":"…","A":9000,…}'></textarea>
    <div class="btns"><button class="btn sm" id="jApply">Загрузить из текста</button><button class="btn sm danger" id="jReset">Сбросить к примеру</button></div>
    <div class="note" id="jMsg" role="status"></div></div>`;
  const msg=t=>{$('#jMsg').textContent=t};
  $('#jCopy').onclick=()=>{const s=JSON.stringify(P,null,1);navigator.clipboard?.writeText(s).then(()=>msg('JSON скопирован в буфер обмена.'),()=>{$('#jText').value=s;$('#jText').select();msg('Буфер недоступен — JSON выделен в поле, скопируйте вручную.')})};
  if(canSave()) $('#jSave').onclick=()=>saveFile(safeName(P.name)+'.json',JSON.stringify(P,null,1),'application/json').then(()=>msg('Файл проекта сохранён.')).catch(e=>msg(saveErr(e)));
  $('#jFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{P=normalize(JSON.parse(r.result));renderSide();schedule(true);msg('Проект загружен из файла.')}catch(err){msg('Не удалось прочитать файл: это не JSON проекта.')}};r.readAsText(f)};
  $('#jApply').onclick=()=>{try{P=normalize(JSON.parse($('#jText').value));renderSide();schedule(true);msg('Проект загружен.')}catch(err){msg('Текст не похож на JSON проекта — проверьте, что скопирован целиком.')}};
  $('#jReset').onclick=()=>{if(!resetArm){resetArm=true;$('#jReset').textContent='Точно сбросить? Нажмите ещё раз';setTimeout(()=>{resetArm=false;const b=$('#jReset');if(b)b.textContent='Сбросить к примеру'},4000);return}
    resetArm=false;P=clone(DEF);renderSide();schedule(true);msg('Загружен пример проекта.')};
}
function download(name,text,mime){const b=new Blob([text],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- состояние / пересборка ---------- */
let M=null,C=null,S=null,ADV=null,SHEETS=null,curSheet=0,dirty3d=true;
let timer=null;
function schedule(structural){clearTimeout(timer);timer=setTimeout(()=>{rebuild();if(structural){renderOps();renderIW();renderBlocks()}renderRooms()},structural?0:220)}
function rebuild(){
  try{if(enforceTech(P).includes('lumber'))mapToDb();({M,C}=buildFull(P));S=spec(M,C);S.fin=finishCalc(M);ADV=advice(M,C,S)}catch(e){console.error(e);return}
  pushHistory();
  SHEETS=null; dirty3d=true; saveP();
  renderTop(); renderSums(); renderOpsErrors(); renderRooms(); renderActive();
}
function renderOpsErrors(){document.querySelectorAll('#custom-ops .row').forEach(r=>{const i=+r.dataset.i,st=M.ops[i];let e=r.querySelector('.err');if(st&&!st.ok){if(!e){e=document.createElement('div');e.className='err';r.appendChild(e)}e.textContent=st.msg}else if(e)e.remove();
  const lab=r.querySelector('label[for="o'+i+'t"]');if(lab)lab.innerHTML='Тип'+(st?.mark?` · <span class="mk">${st.mark}</span>`:'')})}
function renderTop(){
  $('#pname').textContent=P.name||'';
  const nb=C.checks.filter(c=>!c.ok).length, nw=ADV.filter(a=>a.lvl==='warn').length;
  $('#kpis').innerHTML=[
    ['Площадь',fmt(tep(M).build,1)+' м²'],
    ...(M.mans&&M.mansOk?[['Мансарда, h≥1,5 м',fmt(M.mansArea,1)+' м²']]:[]),
    ['Материалы',rub(S.total)],
    ['Отделка',rub(S.fin.total)],
    ['Расчёт',nb?`${nb} не проходит`:`${C.checks.length} из ${C.checks.length} ✓`,nb?'bad':'ok']
  ].map(([a,b,c])=>`<div class="kpi ${c||''}"><small>${a}</small><b>${b}</b></div>`).join('');
  {const d=$('#dot-kr');if(d){d.className='dot'+(nb?' bad':'');d.title=nb?nb+' проверок не проходит':''}}
  const t=$('#tabs').querySelector('[data-t="adv"] .cnt'); if(t){const nbad=ADV.filter(a=>a.lvl==='bad').length;t.textContent=nbad||nw||'✓';t.className='cnt'+(nbad?' bad':nw?' warn':'')}
  const tc=$('#tabs').querySelector('[data-t="calc"] .cnt'); if(tc){tc.textContent=nb?nb:'✓';tc.className='cnt'+(nb?' bad':'')}
}

/* ---------- вкладки ---------- */
/* шаги работы: данные → план (АР) → конструкции (КР) → чертежи и смета; у шага — свои разделы слева и свои вкладки */
const TABS=[['plan','План'],['3d','3D-модель'],['calc','Расчёт',true],['adv','Советы',true],['draw','Чертежи'],['spec','Спецификация и смета'],['cut','Раскрой'],['db','База материалов'],['kb','Справка']];
const STEPS=[{k:'data',n:'Данные',secs:['site','loads','house'],tabs:['plan']},{k:'ar',n:'План',secs:['blocks','iw','ops','rooms','fin','roof'],tabs:['plan','3d']},
  {k:'kr',n:'Конструкции',secs:['found','walls','roof'],tabs:['3d','calc','adv']},{k:'docs',n:'Чертежи и смета',secs:['cutp','prices','file'],tabs:['draw','spec','cut','db']}];
let curStep='ar';try{curStep=localStorage.getItem(LS_KEY+'-step')||'ar'}catch(e){}if(!STEPS.some(s=>s.k===curStep))curStep='ar';
const stepOf=k=>STEPS.find(s=>s.k===k)||STEPS[1];
function renderSteps(){const el=$('#steps');if(!el)return;el.innerHTML=STEPS.map((s,i)=>`<button data-step="${s.k}" aria-current="${s.k===curStep?'step':'false'}"><b>${i+1}</b>${s.n}<span class="dot" id="dot-${s.k}"></span></button>`).join('');
  el.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStep(b.dataset.step))}
function setStep(k,tab){curStep=k;try{localStorage.setItem(LS_KEY+'-step',k)}catch(e){}const st=stepOf(k);if(tab)curTab=tab;else if(!st.tabs.includes(curTab))curTab=st.tabs[0];
  renderSteps();applyStep();renderTabs();renderActive();if(typeof renderTop==='function'&&M)renderTop()}
function applyStep(){const st=stepOf(curStep);document.querySelectorAll('#side details.grp').forEach(d=>{const on=st.secs.includes(/** @type {HTMLElement} */(d).dataset.g);/** @type {HTMLElement} */(d).hidden=!on});
  const sb=$('#side .start');if(sb)sb.hidden=curStep!=='data';const hd=$('#side .side-h');if(hd)hd.textContent=st.n}
let curTab='plan'; try{curTab=localStorage.getItem(LS_KEY+'-tab2')||'plan'}catch(e){}
if(!TABS.some(t=>t[0]===curTab)||!stepOf(curStep).tabs.includes(curTab)) curTab=stepOf(curStep).tabs[0];
function renderTabs(){
  const st=stepOf(curStep),vis=curTab==='kb'?['kb']:st.tabs;$('#tabs').hidden=vis.length<2;
  $('#tabs').innerHTML=TABS.filter(t=>vis.includes(String(t[0]))).map(([k,l,c])=>`<button role="tab" data-t="${k}" aria-selected="${k===curTab}">${l}${c?'<span class="cnt"></span>':''}</button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{curTab=b.dataset.t;try{localStorage.setItem(LS_KEY+'-tab2',curTab)}catch(e){}
    $('#tabs').querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));renderActive()});
}
function renderActive(){
  TABS.forEach(([k])=>{$('#tab-'+k).hidden=k!==curTab});
  ({plan:renderPlan,'3d':render3DTab,draw:renderDraw,spec:renderSpec,cut:renderCut,calc:renderCalc,adv:renderAdv,db:renderDB,kb:renderKB})[curTab]();
}

