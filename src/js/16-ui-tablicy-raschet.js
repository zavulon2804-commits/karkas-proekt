/* ---------- спецификация ---------- */
function specTable(plain){
  let h=`<table class="t"><thead><tr><th>Марка</th><th>Наименование</th><th class="n">Сечение, мм</th><th class="n">Длина, мм</th><th class="n">Кол-во, шт</th><th class="n">Σ длина, м</th><th class="n">Объём, м³</th></tr></thead><tbody>`;
  GRP_ORDER.forEach(gk=>{const rows=S.marks.filter(m=>m.grp===gk);if(!rows.length)return;const v=rows.reduce((s,m)=>s+m.vol,0);
    h+=`<tr class="g"><td colspan="6">${GRP[gk].n}</td><td class="n">${fmt(v,3)}</td></tr>`;
    rows.forEach(m=>h+=`<tr><td class="mk">${m.mark}</td><td>${ROLE[m.role]}</td><td class="n">${m.sec.join('×')}</td><td class="n">${fmt(m.L)}</td><td class="n">${m.qty}</td><td class="n">${fmt(m.qty*m.L/1000,1)}</td><td class="n">${fmt(m.vol,3)}</td></tr>`)});
  h+=`<tr class="tot"><td colspan="6">Итого по проекту (чистый объём, без отходов)</td><td class="n">${fmt(S.netVol,2)}</td></tr></tbody></table>`;return h}
function buyTable(){
  let h=`<table class="t"><thead><tr><th>Сечение</th><th>Материал</th><th>Купить досок</th><th class="n">Всего, м</th><th class="n">Отход</th><th class="n">Объём, м³</th><th class="n">Цена, ₽/м³</th><th class="n">Сумма</th></tr></thead><tbody>`;
  S.cuts.forEach(c=>h+=`<tr><td class="num">${c.key}</td><td>${esc(c.kind)}</td><td class="num">${Object.entries(c.buy).sort((a,b)=>b[0]-a[0]).map(([L,q])=>`${L} мм × ${q}`).join(' · ')}</td><td class="n">${fmt(c.total/1000,1)}</td><td class="n">${fmt(c.waste*100,1)} %</td><td class="n">${fmt(c.vol,3)}</td><td class="n">${fmt(c.price)}</td><td class="n">${rub(c.cost)}</td></tr>`);
  h+=`<tr class="tot"><td colspan="5">Пиломатериал к закупке (цены — из базы материалов)</td><td class="n">${fmt(S.woodVol,2)}</td><td></td><td class="n">${rub(S.woodSum)}</td></tr></tbody></table>`;return h}
function finTable(){const F=S.fin;let h=`<table class="t"><thead><tr><th>№</th><th>Помещение</th><th class="n">Пол, м²</th><th>Пол</th><th class="n">Стены, м²</th><th>Стены</th><th>Потолок</th><th class="n">Сумма</th></tr></thead><tbody>`;
  F.rooms.forEach(r=>h+=`<tr><td class="num">${r.no}</td><td>${esc(r.name)}</td><td class="n">${fmt(r.area,1)}</td><td>${esc(FIN.floor[r.f.floor].n)}</td><td class="n">${fmt(r.net,1)}</td><td>${esc(FIN.wall[r.f.wall].n)}</td><td>${esc(FIN.ceil[r.f.ceil].n)}</td><td class="n">${rub(r.sum)}</td></tr>`);
  h+=`<tr><td></td><td>Фасад</td><td></td><td></td><td class="n">${fmt(F.facade.net,1)}</td><td>${esc(FIN.facade[F.facade.key].n)}</td><td></td><td class="n">${rub(F.facade.sum)}</td></tr><tr class="tot"><td colspan="7">Итого отделка (материалы)</td><td class="n">${rub(F.total)}</td></tr></tbody></table>`;return h}
function finMatsTable(){const G={wall:'Стены',floor:'Пол',ceil:'Потолок',facade:'Фасад'};let h=`<table class="t"><thead><tr><th>Материал отделки</th><th>Ед.</th><th class="n">Кол-во</th><th class="n">Цена</th><th class="n">Сумма</th></tr></thead><tbody>`,last='';
  [...S.fin.items].sort((a,b)=>Object.keys(G).indexOf(a.grp)-Object.keys(G).indexOf(b.grp)).forEach(m=>{if(m.grp!==last){h+=`<tr class="g"><td colspan="5">${G[m.grp]}</td></tr>`;last=m.grp}h+=`<tr><td>${esc(m.name)}</td><td>${m.unit}</td><td class="n">${fmt(m.qty,m.unit==='шт'?0:1)}</td><td class="n">${fmt(m.price)}</td><td class="n">${rub(m.sum)}</td></tr>`});
  return h+`<tr class="tot"><td colspan="4">Итого</td><td class="n">${rub(S.fin.total)}</td></tr></tbody></table>`}
function matsTable(){
  let h=`<table class="t"><thead><tr><th>Материал</th><th>Ед.</th><th class="n">Кол-во</th><th class="n">Цена</th><th class="n">Сумма</th></tr></thead><tbody>`;let last='';
  S.mats.forEach(m=>{if(m.grp!==last){h+=`<tr class="g"><td colspan="5">${m.grp}</td></tr>`;last=m.grp}h+=`<tr><td>${esc(m.name)}</td><td>${m.unit}</td><td class="n">${fmt(m.qty,m.d||0)}</td><td class="n">${fmt(m.price)}</td><td class="n">${rub(m.sum)}</td></tr>`});
  h+=`<tr class="g"><td colspan="4">Пиломатериал (из ведомости раскроя)</td><td class="n">${rub(S.woodSum)}</td></tr><tr class="tot"><td colspan="4">Итого материалы и сваи</td><td class="n">${rub(S.total)}</td></tr></tbody></table>`;return h}
function tsvSpec(){const r=[['Марка','Наименование','Группа','Сечение, мм','Длина, мм','Кол-во, шт','Объём, м³']];S.marks.forEach(m=>r.push([m.mark,ROLE[m.role],GRP[m.grp].n,m.sec.join('x'),m.L,m.qty,String(m.vol.toFixed(4)).replace('.',',')]));return r.map(x=>x.join('\t')).join('\n')}
function tsvMats(){const r=[['Позиция','Ед.','Кол-во','Цена','Сумма']];S.cuts.forEach(c=>Object.entries(c.buy).forEach(([L,q])=>r.push([`Доска ${c.key}, L=${L}`,'шт',q,'',''])));r.push(['Пиломатериал','м³',S.woodVol.toFixed(3).replace('.',','),'',R(S.woodSum)]);S.mats.forEach(m=>r.push([m.name,m.unit,String(+m.qty.toFixed(2)).replace('.',','),m.price,R(m.sum)]));r.push(['Итого','','','',R(S.total)]);return r.map(x=>x.join('\t')).join('\n')}
function copyBtn(btn,text){navigator.clipboard?.writeText(text).then(()=>{const o=btn.textContent;btn.textContent='Скопировано';setTimeout(()=>btn.textContent=o,1600)},()=>{btn.textContent='Буфер недоступен'})}
function renderSpec(){
  const el=$('#tab-spec'),a=S.areas;
  el.innerHTML=`<div class="sec-head"><h2>Спецификация пиломатериалов</h2><div class="btns">${canSave()?'<button class="btn sm pri" id="xlsDl">Скачать Excel (.xlsx)</button>':''}<button class="btn sm" id="cpSpec">Копировать для Excel</button></div></div><div class="note" id="specMsg" role="status"></div>
  <p class="lead">Каждая марка — одинаковые детали одной длины. Марки совпадают с чертежами и 3D-моделью. Длины стропил даны с запасом на запилы.</p>
  <div class="tw">${specTable()}</div>
  <div class="sec-head" style="margin-top:22px"><h2>Закупка и смета</h2><div class="btns"><button class="btn sm" id="cpMats">Копировать для Excel</button></div></div>
  <p class="lead">Количество досок — по результату раскроя. Площади: стены нетто ${fmt(a.wallNet,1)} м², фронтоны ${fmt(a.gabA,1)} м², пол ${fmt(a.floorA,1)} м², скаты ${fmt(a.roofA,1)} м², проёмы ${fmt(a.opsA,1)} м².</p>
  <div class="tw">${buyTable()}</div><div style="height:12px"></div><div class="tw">${matsTable()}</div>
  <p class="note">Смета не включает окна, двери, инженерные сети и работу бригады (кроме монтажа свай). Отделка — отдельно ниже.</p>
  <div class="sec-head" style="margin-top:22px"><h2>Отделка помещений и фасада</h2></div>
  <p class="lead">Площади стен — периметр помещения × высота ${M.H} мм минус окна и двери. Вид отделки комнаты меняется на плане (нажмите на помещение), по умолчанию — в разделе «АР · Отделка».</p>
  <div class="tw">${finTable()}</div><div style="height:12px"></div><div class="tw">${finMatsTable()}</div>`;
  $('#cpSpec').onclick=e=>copyBtn(e.target,tsvSpec());if(canSave())$('#xlsDl').onclick=()=>runExport(()=>exportXlsx(),'#specMsg','Файл Excel сохранён: спецификация, закупка, раскрой, смета, сваи, проверки, проёмы.');$('#cpMats').onclick=e=>copyBtn(e.target,tsvMats());
}
function renderCut(){
  const el=$('#tab-cut');
  let h=`<h2>Карты раскроя</h2><p class="lead">Детали разложены по доскам складских длин (${S.stocks.join(', ')} мм, пропил ${S.kerf} мм) так, чтобы отход был минимальным. Длинные детали — обвязки, брус ростверка, обрешётка — разбиты на части со стыком над стойкой, сваей или стропилом.</p>`;
  S.cuts.forEach(c=>{
    h+=`<div class="cut"><div class="cut-h"><b class="num">${c.key} мм</b><span class="s">${Object.entries(c.buy).sort((a,b)=>b[0]-a[0]).map(([L,q])=>`${L} × ${q} шт`).join(' · ')} · ${fmt(c.total/1000,1)} м · ${fmt(c.vol,3)} м³ · отход ${fmt(c.waste*100,1)} %${c.joints?` · деталей со стыком: ${c.joints}`:''}</span></div>`;
    const lim=14;c.pats.slice(0,lim).forEach(p=>{h+=`<div class="pat"><span class="lbl">${p.stock}</span><div class="bar" title="остаток ${R(p.rest)} мм">${p.items.map(i=>`<span style="flex:0 0 ${(i.L/p.stock*100).toFixed(2)}%" title="${i.mark} — ${i.L} мм">${i.L/p.stock>.09?i.mark+' '+i.L:''}</span>`).join('')}</div><span class="q">×${p.count}</span></div>`});
    if(c.pats.length>lim)h+=`<div class="more">… ещё ${c.pats.length-lim} схем раскроя (${c.pats.slice(lim).reduce((s,p)=>s+p.count,0)} досок).</div>`;
    h+='</div>'});
  el.innerHTML=h;
}
function renderCalc(){
  const el=$('#tab-calc'),l=C.l;
  let h=`<h2>Расчёт нагрузок и проверка сечений</h2><p class="lead">Проверка прочности (σ ≤ R) и прогиба по упрощённым методикам СП 20.13330 «Нагрузки и воздействия» и СП 64.13330 «Деревянные конструкции». Древесина — сосна 2-го сорта: R = ${R_I} МПа, E = ${fmt(E_MOD)} МПа. Это оценка для подбора сечений, а не замена проекта инженера.</p>
  <div class="cards" style="margin-bottom:14px"><div class="card"><div class="card-h"><b>Нагрузки на 1 м²</b><span class="pill info">нормативные → расчётные</span></div><dl class="kv">
   <dt>Снег Sg (${esc(snowLbl(P))}) × μ=${fmt(l.mu,2)}</dt><dd>${fmt(l.S,2)} → ${fmt(l.S*1.4,2)} кПа</dd>
   <dt>Ветер w0 (${esc(windLbl(P))}) × k=${l.k}</dt><dd>${fmt(l.w0*l.k,3)} кПа</dd>
   <dt>Кровля: ${M.mat.name.toLowerCase()} + стропила</dt><dd>${fmt(l.gR,2)} → ${fmt(l.gR*1.1,2)} кПа</dd>
   <dt>Пол: вес + полезная</dt><dd>${fmt(l.gF+l.pF,2)} → ${fmt(l.gF*1.2+l.pF*1.3,2)} кПа</dd>
   <dt>Чердак: вес + полезная</dt><dd>${fmt(l.gA+l.pA,2)} → ${fmt(l.gA*1.2+l.pA*1.3,2)} кПа</dd>
   <dt>Стена</dt><dd>${fmt(l.gW,2)} → ${fmt(l.gW*1.2,2)} кПа</dd></dl></div>
   <div class="card"><div class="card-h"><b>Погонные нагрузки</b><span class="pill info">расчётные, кН/м</span></div><dl class="kv">
   <dt>Кровля на стены 1 и 3</dt><dd>${fmt(C.roofD,2)}</dd><dt>Чердак на стены 1 и 3</dt><dd>${fmt(C.attD,2)}</dd>${M.attSup!=null?`<dt>Чердак на несущую перегородку</dt><dd>${fmt(C.supAtt,2)}</dd>`:''}<dt>Собственный вес стены</dt><dd>${fmt(C.wallD,2)}</dd>
   ${M.lines.map(x=>`<dt>${x.name}${x.wallOver?' (+'+x.wallOver+')':''}</dt><dd>${fmt(x.qd,2)}</dd>`).join('')}</dl></div></div>
  <h3>Вертикальные нагрузки: от кровли до свай</h3>
  <div class="tw" style="margin-bottom:12px"><table class="t"><thead><tr><th>Уровень</th><th class="n">Нормативная, кН</th><th class="n">Расчётная, кН</th></tr></thead><tbody>${C.V.map(r=>`<tr><td>${esc(r.n)}</td><td class="n">${fmt(r.norm,1)}</td><td class="n">${fmt(r.des,1)}</td></tr>`).join('')}
  <tr class="tot"><td>Итого на сваи (без собственного веса свай)</td><td class="n">${fmt(C.V.reduce((s,r)=>s+r.norm,0),1)}</td><td class="n">${fmt(C.V.reduce((s,r)=>s+r.des,0),1)}</td></tr></tbody></table></div>
  <div class="cards">`;
  const cardHtml=c=>{const st=!c.ok?'bad':c.u>.85?'warn':'ok';return `<div class="card"><div class="card-h"><div><b>${esc(c.title)}</b><div class="meta num">${esc(c.sec)}</div></div><span class="pill ${st}">${c.ok?'проходит':'не проходит'} · ${Number.isFinite(c.u)?R(c.u*100)+' %':'∞'}</span></div>
    <div class="meta">${esc(c.meta)}</div>${c.note?`<div class="meta"><i>${esc(c.note)}</i></div>`:''}<div class="ubar ${st}"><i style="width:${Math.min(100,Number.isFinite(c.u)?c.u*100:100)}%"></i></div>
    <dl class="kv">${c.rows.map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
    ${getPicks(c.id)?.length?`<div><button class="btn sm" data-pick="${c.id}">Подобрать по базе</button> <span class="note" data-pm="${c.id}"></span></div>`:''}</div>`};
  C.checks.filter(c=>!c.h).forEach(c=>{h+=cardHtml(c)});
  h+=`</div><h3>Горизонтальные нагрузки: ветер</h3><p class="lead">Ветер: ${esc(windLbl(P))}, w0 = ${fmt(C.l.w0,3)} кПа, местность ${P.terrain}: на фасад ${fmt(C.H.Fy,1)} кН, на фронтон ${fmt(C.H.Fx,1)} кН (расчётные). Жёсткость стен: ${P.bracing==='braces'?'укосины по СНиП, где помещаются, иначе обшивка':'плитная обшивка'}.</p><div class="cards">`;
  C.checks.filter(c=>c.h).forEach(c=>{h+=cardHtml(c)});
  h+=`</div><div class="tw" style="margin-top:12px"><table class="t"><thead><tr><th>Стена</th><th>Способ</th><th class="n">Сплошные участки, мм</th><th class="n">Несущая способность, кН</th><th class="n">Доля ветра, кН</th><th class="n">Отрыв торца, кН</th><th class="n">Анкеров на торец</th><th class="n">Гвозди обвязки, шаг</th></tr></thead><tbody>${C.H.walls.map(x=>`<tr><td>${esc(x.w.name)}${x.w.fallback?' <span class="pill warn">обшивка вместо укосин</span>':''}</td><td>${esc(x.desc)}</td><td class="n">${R(x.solid)}</td><td class="n">${fmt(x.cap,1)}</td><td class="n">${fmt(x.V||0,1)}</td><td class="n">${fmt(Math.max(0,x.T||0),1)}</td><td class="n">${x.anch}</td><td class="n">${x.nail}</td></tr>`).join('')}</tbody></table></div>
  <div class="cards" style="display:none">`;
  [].forEach(c=>{const st=!c.ok?'bad':c.u>.85?'warn':'ok';
    h+=`<div class="card"><div class="card-h"><div><b>${esc(c.title)}</b><div class="meta num">${esc(c.sec)}</div></div><span class="pill ${st}">${c.ok?'проходит':'не проходит'} · ${Number.isFinite(c.u)?R(c.u*100)+' %':'∞'}</span></div>
    <div class="meta">${esc(c.meta)}</div>${c.note?`<div class="meta"><i>${esc(c.note)}</i></div>`:''}<div class="ubar ${st}"><i style="width:${Math.min(100,Number.isFinite(c.u)?c.u*100:100)}%"></i></div>
    <dl class="kv">${c.rows.map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
    ${PICK[c.id]?`<div><button class="btn sm" data-pick="${c.id}">Подобрать минимальное сечение</button> <span class="note" data-pm="${c.id}"></span></div>`:''}</div>`});
  h+='</div>';
  h+=`<h3>Нагрузки на сваи</h3><p class="lead">Расчётные вертикальные нагрузки по сваям; постоянная часть используется в проверках пучения и опрокидывания.</p><div class="tw"><table class="t"><thead><tr><th>№</th><th class="n">X, мм</th><th class="n">Y, мм</th><th class="n">Нагрузка, кН</th><th class="n">Постоянная, кН</th><th class="n">Использование</th></tr></thead><tbody>${M.piles.map(p=>`<tr><td>${p.no}</td><td class="n">${R(p.x)}</td><td class="n">${R(p.y)}</td><td class="n">${fmt(p.N,1)}</td><td class="n">${fmt(p.Ng,1)}</td><td class="n">${C.Fd>0?R(p.N/C.Fd*100)+' %':'—'}</td></tr>`).join('')}</tbody></table></div>`;
  el.innerHTML=h;
  el.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const id=b.dataset.pick,p=pickFor(id),n=el.querySelector(`[data-pm="${id}"]`);
    if(!p){n.textContent='В базе нет подходящего варианта — добавьте сечения или уменьшите шаг и пролёт.';return}
    Object.assign(P,p);renderSide();rebuild();const n2=$('#tab-calc').querySelector(`[data-pm="${id}"]`);if(n2)n2.textContent='Применено: '+describePatch(id,p)});
}
function renderDB(){
  const el=$('#tab-db');P.db.sort((a,c)=>['planed','edged','beam'].indexOf(a.t)-['planed','edged','beam'].indexOf(c.t)||a.b-c.b||a.h-c.h);
  const used=new Set(S.cuts.map(c=>c.key));
  let h=`<div class="sec-head"><h2>База пиломатериалов</h2><div class="btns"><button class="btn sm pri" id="dbFit">Подобрать сечения проекта по базе</button><button class="btn sm" id="dbAdd">+ позиция</button><label class="btn sm" for="dbFile">Загрузить CSV / JSON…</label><input type="file" id="dbFile" accept=".csv,.txt,.json" hidden>${canSave()?'<button class="btn sm" id="dbCsv">Скачать CSV</button>':''}<button class="btn sm danger" id="dbReset">Сбросить к стандартной</button></div></div>
  <p class="lead">Сечения, длины и цены, из которых система подбирает детали. Отметка «в наличии» — позиция участвует в подборе. Формат CSV: <span class="mono">тип;толщина;ширина;длины;цена</span>, тип — строганая, обрезная или брус, длины через запятую. Сейчас для каркаса выбрана: <b>${esc(LUMBER_T[P.lumber])}</b>.</p><div class="note" id="dbMsg" role="status"></div>
  <div class="tw"><table class="t"><thead><tr><th>Тип</th><th class="n">Толщина, мм</th><th class="n">Ширина, мм</th><th>Длины, мм</th><th class="n">Цена, ₽/м³</th><th>В наличии</th><th>В проекте</th><th></th></tr></thead><tbody>`;
  P.db.forEach((r,i)=>h+=`<tr data-i="${i}"><td><select data-f="t" aria-label="Тип">${Object.entries(LUMBER_T).map(([k,v])=>`<option value="${k}" ${k===r.t?'selected':''}>${v}</option>`).join('')}</select></td>
    <td class="n"><input data-f="b" type="number" value="${r.b}" style="width:70px" aria-label="Толщина"></td><td class="n"><input data-f="h" type="number" value="${r.h}" style="width:70px" aria-label="Ширина"></td>
    <td><input data-f="lens" type="text" value="${esc(r.lens)}" style="width:150px" aria-label="Длины"></td><td class="n"><input data-f="price" type="number" value="${r.price}" style="width:90px" aria-label="Цена"></td>
    <td><input data-f="use" type="checkbox" ${r.use?'checked':''} aria-label="В наличии"></td><td>${used.has(r.b+'×'+r.h)?'<span class="pill ok">да</span>':''}</td><td><button class="x" data-del="${i}" aria-label="Удалить позицию">×</button></td></tr>`);
  h+='</tbody></table></div>';
  el.innerHTML=h;
  const msg=t=>{$('#dbMsg').textContent=t};
  el.querySelectorAll('tr[data-i]').forEach(tr=>{const i=+tr.dataset.i;tr.querySelectorAll('[data-f]').forEach(inp=>inp.addEventListener('change',()=>{const f=inp.dataset.f;let v=inp.type==='checkbox'?inp.checked:inp.value;if(['b','h','price'].includes(f)){v=+v;if(!(v>0))return}P.db[i][f]=v;schedule()}))});
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{P.db.splice(+b.dataset.del,1);rebuild()});
  $('#dbAdd').onclick=()=>{P.db.push({t:P.lumber,b:45,h:145,lens:'3000, 6000',price:30000,use:true});renderDB()};
  $('#dbFit').onclick=()=>{runMapFix('#dbMsg')};
  $('#dbReset').onclick=e=>{if(e.target.dataset.arm!=='1'){e.target.dataset.arm='1';e.target.textContent='Точно сбросить? Нажмите ещё раз';return}P.db=defaultDB();runMapFix();msg('База сброшена к стандартной.')};
  if($('#dbCsv'))$('#dbCsv').onclick=()=>saveFile('база пиломатериалов.csv','\ufeffтип;толщина;ширина;длины;цена;в наличии\r\n'+P.db.map(r=>[{planed:'строганая',edged:'обрезная',beam:'брус'}[r.t],r.b,r.h,r.lens,r.price,r.use?'да':'нет'].join(';')).join('\r\n'),'text/csv').then(()=>msg('CSV сохранён.')).catch(e=>msg(saveErr(e)));
  $('#dbFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const rows=parseDB(String(rd.result));if(!rows.length)throw 0;P.db=rows;const t=runMapFix();msg(`Загружено позиций: ${rows.length}. ${t}`)}catch(err){msg('Не удалось прочитать файл. Нужен CSV «тип;толщина;ширина;длины;цена» или JSON-массив.')}};rd.readAsText(f)};
}
function parseDB(txt){
  txt=txt.replace(/^\ufeff/,'').trim();
  if(txt[0]==='['){return JSON.parse(txt).map(r=>({t:LUMBER_ALIAS[String(r.t||r.type||'').toLowerCase()]||'edged',b:+r.b,h:+r.h,lens:String(r.lens||'6000'),price:+r.price||+P.prices.wood,use:r.use!==false})).filter(r=>r.b>0&&r.h>0)}
  return txt.split(/\r?\n/).map(l=>{const sep=l.includes(';')?';':l.includes('\t')?'\t':',',c=l.split(sep).map(x=>x.trim());const t=LUMBER_ALIAS[(c[0]||'').toLowerCase().replace(/^доска\s*/,'').replace(/^сухая\s*/,'')];
    if(!t||!(+c[1]>0)||!(+c[2]>0))return null;return {t,b:+c[1],h:+c[2],lens:c[3]||'6000',price:+(c[4]||'').replace(/\s/g,'')||+P.prices.wood,use:!/^(нет|no|0)$/i.test(c[5]||'')}}).filter(Boolean)}
function renderAdv(){
  const el=$('#tab-adv');
  const nb=C.checks.filter(c=>!c.ok).length;
  let h=`<div class="sec-head"><h2>Советы по проекту</h2>${nb?`<button class="btn pri" id="fixAll">Исправить всё автоматически</button>`:''}</div><p class="lead">Замечания пересчитываются при каждом изменении параметров. Красные — ошибки, жёлтые — стоит поправить, синие — к сведению.${nb?' Кнопка «Исправить всё» подберёт минимальные сечения и сваи, которые проходят расчёт.':''}</p><div class="note" id="fixMsg" role="status"></div><div class="adv">`;
  ADV.forEach((a,i)=>h+=`<div class="ad ${a.lvl}"><div><b>${esc(a.title)}</b><p>${esc(a.text)}</p></div>${a.patch?`<button class="btn sm" data-ap="${i}">Применить</button>`:'<span></span>'}</div>`);
  h+=`</div><h3>Памятка проектировщику и бригаде</h3><div class="kb">${KB.map(([t,list],i)=>`<details ${i<2?'open':''}><summary>${esc(t)}</summary><ul>${list.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}</div>`;
  el.innerHTML=h;
  el.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{const pt=ADV[+b.dataset.ap].patch;if(pt.__map){runMapFix()}else{Object.assign(P,pt);renderSide();rebuild()}});
  const fa=$('#fixAll');if(fa)fa.onclick=()=>{const fx=autoFix();renderSide();rebuild();const m=$('#fixMsg');if(m)m.textContent=fx.length?'Изменено: '+fx.join('; ')+'.':'Автоматически исправить не удалось — смотрите советы ниже.'};
}

