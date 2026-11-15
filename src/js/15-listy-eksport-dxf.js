function makeSheets(){
  const mo=M.mans&&M.mansOk,list=[sheetPlan(),...(mo?[sheetMans()]:[]),sheetRoofPlan(mo?'АР-3':'АР-2'),sheetFacades(mo?'АР-4':'АР-3'),sheetFinish(mo?'АР-5':'АР-4'),sheetPiles(),sheetGrill()];let k=1;
  M.walls.forEach(wl=>list.push(sheetWall(wl,'КД-'+(k++))));
  list.push(sheetRoof());
  list.unshift(sheetGeneral([{code:'ОД',title:'Общие данные'},...list]));
  return list.map((x,i)=>({...x,n:i+1,svg:wrapSheet(x.body,{project:P.name||'Проект',title:x.title,sub:x.sub,code:x.code,scale:x.scale,n:i+1,total:list.length})}));
}
function renderDraw(){
  if(!SHEETS) SHEETS=makeSheets(); if(curSheet>=SHEETS.length) curSheet=0;
  const el=$('#tab-draw'),sh=SHEETS[curSheet];
  el.innerHTML=`<div class="sec-head"><h2>Рабочие чертежи для бригады</h2><div class="btns">${canSave()?'<button class="btn sm pri" id="zipDl">Скачать все листы: DXF + SVG (ZIP)</button>':''}${IS_LOCAL?'<button class="btn sm" id="dxfDl">Этот лист — DXF</button><button class="btn sm" id="svgDl">Этот лист — SVG</button><button class="btn sm" id="printAll">Печать / PDF (A3)</button>':''}</div></div>
    <p class="lead">Листы A3 в масштабе. DXF открывается в AutoCAD, nanoCAD, КОМПАС и LibreCAD: геометрия в натуральную величину, по слоям.${IS_LOCAL?'':' Печать и PDF — в офлайн-файле <b>karkas-proekt.html</b>.'}</p><div class="note" id="drawMsg" role="status"></div>
    <div class="sheet-list">${SHEETS.map((x,i)=>`<button data-s="${i}" aria-pressed="${i===curSheet}"><b>${x.code}</b>${esc(x.title)}</button>`).join('')}</div>
    <div class="paper" id="paper">${sh.svg}</div>`;
  el.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{curSheet=+b.dataset.s;renderDraw()});
  if(canSave())$('#zipDl').onclick=()=>runExport(()=>exportZip(),'#drawMsg','Архив с чертежами сохранён.');
  if(IS_LOCAL){$('#svgDl').onclick=()=>download(sheetFile(sh)+'.svg','<?xml version="1.0" encoding="UTF-8"?>\n'+sh.svg,'image/svg+xml');$('#dxfDl').onclick=()=>download(sheetFile(sh)+'.dxf',sheetDxf(sh),'application/dxf');$('#printAll').onclick=printAll}
}
/* ---------- экспорт: DXF, ZIP, XLSX ---------- */
let DL=null;
(async()=>{try{if(!IS_LOCAL&&window.claude?.use){DL=await window.claude.use('downloads');if(DL){renderActive();renderFile()}}}catch(e){}})();
const canSave=()=>IS_LOCAL||!!DL;
const safeName=t=>String(t||'Проект').replace(/[\\/:*?"<>|]+/g,'_').trim().slice(0,80)||'Проект';
async function saveFile(name,data,mime='application/octet-stream'){
  if(IS_LOCAL){download(name,data,mime);return 'saved'}
  if(!DL) throw {code:'unavailable'};
  return (await DL.save({filename:name,data})).status;
}
function saveErr(e){const c=e?.code;if(e?.message==='lib')return 'Не удалось загрузить библиотеку экспорта — проверьте подключение к интернету.';return c==='declined'?'Сохранение отменено.':c==='rate_limited'?'Окно сохранения уже открыто — завершите его.':'Скачивание недоступно в этом окне. Откройте офлайн-файл karkas-proekt.html на компьютере.'}
const LIBS={};
function loadLib(url,glob){if(window[glob])return Promise.resolve(window[glob]);if(!LIBS[url])LIBS[url]=new Promise((res,rej)=>{const el=document.createElement('script');el.src=url;el.onload=()=>window[glob]?res(window[glob]):rej(new Error('lib'));el.onerror=()=>{delete LIBS[url];rej(new Error('lib'))};document.head.appendChild(el)});return LIBS[url]}
const JSZIP_URL='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const DXF_LAYERS={MAIN:[7,'CONTINUOUS'],THIN:[8,'CONTINUOUS'],AXIS:[1,'DASHDOT'],HIDDEN:[5,'DASHED'],WOOD:[30,'CONTINUOUS'],LINTEL:[32,'CONTINUOUS'],CONTEXT:[9,'CONTINUOUS'],FRAME:[7,'CONTINUOUS'],TEXT:[7,'CONTINUOUS'],FILL:[250,'CONTINUOUS']};
const CLS_LAYER={m:'MAIN',gnd:'MAIN',fr:'FRAME',t:'THIN',ax:'AXIS',hd:'HIDDEN',w:'WOOD',w2:'WOOD',w3:'LINTEL',ctx:'CONTEXT',wl:'MAIN',wlp:'THIN',op:'THIN',pile:'MAIN',blk:'FILL'};
const DXF_SUB={'°':'%%d','±':'%%p','Ø':'%%c','×':'x','−':'-','≥':'>=','≤':'<=','²':'2','³':'3','·':'.','≈':'~','“':'"','”':'"','′':"'"};
const dxfStr=t=>String(t).replace(/[°±Ø×−≥≤²³·≈“”′]/g,c=>DXF_SUB[c]);
const CP1251_HI='ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—\u0098™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕї';
function cp1251(str){const out=new Uint8Array(str.length);for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);let b;
  if(c<128)b=c;else if(c>=0x410&&c<=0x44f)b=c-0x410+0xC0;else{const j=CP1251_HI.indexOf(str[i]);b=j>=0?0x80+j:0x3F}out[i]=b}return out}
/* лист → DXF R12: геометрия в натуральную величину (мм), рамка и текст увеличены в масштаб листа */
function sheetDxf(sh){
  const k=sh.scale,host=document.createElement('div');host.style.cssText='position:absolute;left:-20000px;top:0;width:1600px;visibility:hidden';host.innerHTML=sh.svg;document.body.appendChild(host);
  const svg=host.querySelector('svg'),E=[],X=x=>(+x*k).toFixed(3),Y=y=>((297-+y)*k).toFixed(3);
  const poly=(pts,ly,closed)=>{E.push('0','POLYLINE','8',ly,'66','1','70',closed?'1':'0','10','0','20','0','30','0');pts.forEach(([x,y])=>E.push('0','VERTEX','8',ly,'10',X(x),'20',Y(y),'30','0'));E.push('0','SEQEND','8',ly)};
  svg.querySelectorAll('line,rect,circle,polygon,polyline,path,text').forEach(el=>{
    const cls=el.getAttribute('class')||'';if(cls==='wt')return;const ly=CLS_LAYER[cls]||(el.tagName==='text'?'TEXT':'THIN'),a=n=>+el.getAttribute(n);
    switch(el.tagName){
      case 'line':E.push('0','LINE','8',ly,'10',X(a('x1')),'20',Y(a('y1')),'30','0','11',X(a('x2')),'21',Y(a('y2')),'31','0');break;
      case 'rect':{if(!cls)return;const x=a('x'),y=a('y'),w=a('width'),h=a('height');poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],ly,true);break}
      case 'circle':E.push('0','CIRCLE','8',ly,'10',X(a('cx')),'20',Y(a('cy')),'30','0','40',(a('r')*k).toFixed(3));break;
      case 'polygon':case 'polyline':{const pts=el.getAttribute('points').trim().split(/\s+/).map(q=>q.split(',').map(Number));poly(pts,ly,el.tagName==='polygon');break}
      case 'path':{let Lp=0;try{Lp=el.getTotalLength()}catch(e){}if(!Lp)return;const n=Math.max(8,Math.ceil(Lp/1.5)),pts=[];for(let i=0;i<=n;i++){const q=el.getPointAtLength(Lp*i/n);pts.push([q.x,q.y])}poly(pts,ly,false);break}
      case 'text':{const tx=el.textContent;if(!tx.trim())return;const x=a('x'),y=a('y'),sz=a('font-size')||2.5,anc=el.getAttribute('text-anchor'),m=/rotate\(([-\d.]+)/.exec(el.getAttribute('transform')||''),rot=m?-(+m[1]):0,al=anc==='middle'?1:anc==='end'?2:0;
        E.push('0','TEXT','8','TEXT','10',X(x),'20',Y(y),'30','0','40',(sz*.7*k).toFixed(3),'1',dxfStr(tx));if(rot)E.push('50',rot.toFixed(2));E.push('7','GOST');if(al)E.push('72',String(al),'11',X(x),'21',Y(y),'31','0');break}
    }});
  host.remove();
  const H=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','9','$DWGCODEPAGE','3','ANSI_1251','9','$EXTMIN','10','0','20','0','30','0','9','$EXTMAX','10',(420*k).toFixed(1),'20',(297*k).toFixed(1),'30','0','0','ENDSEC',
    '0','SECTION','2','TABLES','0','TABLE','2','LTYPE','70','3',
    '0','LTYPE','2','CONTINUOUS','70','0','3','Solid line','72','65','73','0','40','0.0',
    '0','LTYPE','2','DASHED','70','0','3','__ __ __','72','65','73','2','40',(3*k).toFixed(3),'49',(2*k).toFixed(3),'49',(-1*k).toFixed(3),
    '0','LTYPE','2','DASHDOT','70','0','3','____ . ____','72','65','73','4','40',(11.4*k).toFixed(3),'49',(8*k).toFixed(3),'49',(-1.2*k).toFixed(3),'49',(1*k).toFixed(3),'49',(-1.2*k).toFixed(3),
    '0','ENDTAB','0','TABLE','2','LAYER','70',String(Object.keys(DXF_LAYERS).length)];
  Object.entries(DXF_LAYERS).forEach(([nm,[c,lt]])=>H.push('0','LAYER','2',nm,'70','0','62',String(c),'6',lt));
  H.push('0','ENDTAB','0','TABLE','2','STYLE','70','1','0','STYLE','2','GOST','70','0','40','0.0','41','0.8','50','15.0','71','0','42',(2.5*k).toFixed(2),'3','arial.ttf','4','','0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES');
  return cp1251([...H,...E,'0','ENDSEC','0','EOF'].join('\r\n')+'\r\n');
}
const sheetFile=sh=>`${String(sh.n).padStart(2,'0')} ${sh.code} ${sh.title}`.replace(/[\\/:*?"<>|]+/g,'_');
async function exportZip(test){
  if(!SHEETS)SHEETS=makeSheets();
  const JSZip=await loadLib(JSZIP_URL,'JSZip'),z=new JSZip(),base=safeName(P.name);
  SHEETS.forEach(sh=>{const nm=sheetFile(sh);z.file(`DXF/${nm}.dxf`,sheetDxf(sh));z.file(`SVG/${nm}.svg`,'<?xml version="1.0" encoding="UTF-8"?>\n'+sh.svg)});
  z.file(`${base}.json`,JSON.stringify(P,null,1));
  z.file('Прочти.txt',['Каркас-Проект: '+(P.name||''),'','DXF (AutoCAD R12): единицы — мм, геометрия в натуральную величину (1:1).','Рамка, штамп и текст увеличены в масштаб листа, поэтому лист печатается из модели в масштабе, указанном в штампе.','Слои: MAIN — основные линии, THIN — тонкие и размеры, AXIS — оси, HIDDEN — невидимые, WOOD — детали каркаса, LINTEL — перемычки, CONTEXT — смежные конструкции, TEXT — надписи, FRAME — рамка.','Открывается в AutoCAD, nanoCAD, КОМПАС-3D (импорт DXF), LibreCAD, BricsCAD.','','SVG — те же листы A3 для просмотра и печати в браузере.','JSON — файл проекта: загрузите его в Каркас-Проект через «Файл проекта → Открыть файл».'].join('\r\n'));
  const blob=await z.generateAsync({type:'blob',compression:'DEFLATE'});
  if(test)return {files:Object.keys(z.files).filter(f=>!f.endsWith('/')).length,size:blob.size};
  return saveFile(`${base} — чертежи DXF+SVG.zip`,blob,'application/zip');
}
async function exportXlsx(test){
  const X=await loadLib(XLSX_URL,'XLSX'),wb=X.utils.book_new(),base=safeName(P.name);
  const add=(name,rows,widths)=>{const ws=X.utils.aoa_to_sheet(rows);ws['!cols']=widths.map(w=>({wch:w}));X.utils.book_append_sheet(wb,ws,name)};
  add('Спецификация',[['Марка','Наименование','Группа','Толщина, мм','Ширина, мм','Длина, мм','Кол-во, шт','Σ длина, м','Объём, м³'],...S.marks.map(m=>[m.mark,ROLE[m.role],GRP[m.grp].n,m.sec[0],m.sec[1],m.L,m.qty,+(m.qty*m.L/1000).toFixed(2),+m.vol.toFixed(4)]),['','Итого','','','','','','',+S.netVol.toFixed(3)]],[8,32,28,11,11,10,10,10,10]);
  add('Закупка досок',[['Сечение, мм','Материал','Длина доски, мм','Кол-во, шт','Всего, м','Объём, м³','Цена, ₽/м³','Сумма, ₽','Отход по сечению, %'],...S.cuts.flatMap(c=>Object.entries(c.buy).sort((a,b)=>b[0]-a[0]).map(([L,q])=>{const v=L*q*c.sec[0]*c.sec[1]/1e9;return [c.key,c.kind,+L,q,+(L*q/1000).toFixed(1),+v.toFixed(3),c.price,Math.round(v*c.price),+(c.waste*100).toFixed(1)]})),['Итого','','','','',+S.woodVol.toFixed(3),'',Math.round(S.woodSum),'']],[12,26,15,10,10,10,11,11,18]);
  add('Жёсткость стен',[['Стена','Способ','Сплошные участки, мм','Несущая способность, кН','Доля ветра, кН','Отрыв торца, кН','Анкерных уголков на торец','Шаг гвоздей обвязки, мм'],...C.H.walls.map(x=>[x.w.name,x.desc,R(x.solid),+x.cap.toFixed(1),+(x.V||0).toFixed(1),+Math.max(0,x.T||0).toFixed(1),x.anch,x.nail])],[14,46,18,20,14,14,22,20]);
  add('Раскрой',[['Сечение, мм','Доска, мм','Повторить, раз','Детали: марка и длина, мм','Остаток, мм'],...S.cuts.flatMap(c=>c.pats.map(p=>[c.key,p.stock,p.count,p.items.map(i=>i.mark+' '+i.L).join(' + '),Math.round(p.rest)]))],[11,10,14,80,11]);
  add('Смета',[['Раздел','Позиция','Ед.','Кол-во','Цена, ₽','Сумма, ₽'],['Пиломатериал','Пиломатериал по ведомости раскроя (цены из базы)','м³',+S.woodVol.toFixed(3),'',Math.round(S.woodSum)],...S.mats.map(m=>[m.grp,m.name,m.unit,+(+m.qty).toFixed(2),m.price,Math.round(m.sum)]),['','Итого материалы и сваи','','','',Math.round(S.total)]],[14,64,8,10,10,12]);
  add('Сваи',[['№','X, мм','Y, мм','Нагрузка расч., кН','Постоянная норм., кН'],...M.piles.map(p=>[p.no,Math.round(p.x),Math.round(p.y),+p.N.toFixed(1),+p.Ng.toFixed(1)])],[6,10,10,18,20]);
  add('Проверки',[['Элемент','Сечение','Условия','Использование, %','Результат'],...C.checks.map(c=>[c.title,c.sec,c.meta,Number.isFinite(c.u)?Math.round(c.u*100):'∞',c.ok?'проходит':'НЕ ПРОХОДИТ'])],[36,16,64,16,14]);
  add('Отделка',[['№','Помещение','Пол, м²','Пол','Стены нетто, м²','Стены','Потолок','Сумма, ₽'],...S.fin.rooms.map(r=>[r.no,r.name,+r.area.toFixed(1),FIN.floor[r.f.floor].n,+r.net.toFixed(1),FIN.wall[r.f.wall].n,FIN.ceil[r.f.ceil].n,Math.round(r.sum)]),['','Фасад','','',+S.fin.facade.net.toFixed(1),FIN.facade[S.fin.facade.key].n,'',Math.round(S.fin.facade.sum)],[],['Материал','Ед.','Кол-во','Цена','Сумма'],...S.fin.items.map(m=>[m.name,m.unit,+m.qty.toFixed(1),m.price,Math.round(m.sum)])],[5,30,9,32,10,34,30,12]);
  add('Проёмы',[['Марка','Стена','Тип','Отступ, мм','Ширина, мм','Высота, мм','Низ, мм'],...M.ops.filter(o=>o.ok).map(o=>[o.mark,o.wall,o.type==='door'?'дверь':'окно',o.x,o.w,o.h,o.sill])],[8,8,8,11,11,11,9]);
  const buf=X.write(wb,{bookType:'xlsx',type:'array'});
  if(test)return buf;
  return saveFile(`${base} — спецификация и смета.xlsx`,new Blob([buf]),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
function runExport(fn,msgEl,okText){const m=$(msgEl);if(m)m.textContent='Готовлю файл…';fn().then(st=>{const m2=$(msgEl);if(m2)m2.textContent=st==='delivered'?'Файл передан.':okText}).catch(e=>{console.error(e);const m2=$(msgEl);if(m2)m2.textContent=saveErr(e)})}
function printAll(){
  if(!SHEETS) SHEETS=makeSheets();
  $('#print-area').innerHTML=SHEETS.map(x=>`<div class="psheet">${x.svg}</div>`).join('')+`<div class="ptab"><h2>${esc(P.name)} — спецификация пиломатериалов</h2>${specTable(true)}</div><div class="ptab"><h2>Закупка и смета</h2>${buyTable(true)}${matsTable(true)}</div>`;
  setTimeout(()=>window.print(),100);
}

