/* ---------- АР: планировщик — план рисуется мышью (стены, перегородки, окна, двери, крылья, помещения) ----------
   Всё редактирует те же исходные данные P; конструкции и расчёт пересобираются из них (АР → КР). */
const PL={tool:'sel',sel:null,snap:50,view:null,user:false,drag:null,raf:0};
const PL_TOOLS=[['sel','Выбор','↖'],['iw','Перегородка','┃'],['window','Окно','▭'],['door','Дверь','◜'],['wing','Крыло','⊞'],['furn','Мебель и оборудование','▦'],['ruler','Линейка','↔']];
const PL_HELP={sel:'Нажмите на стену, перегородку, окно, дверь или помещение — справа появятся размеры. Тяните мышью, чтобы передвинуть. Пустое место — двигать план, колесо — масштаб. Delete — удалить выбранное.',
  iw:'Нажмите и протяните мышью — получится перегородка. Концы у наружных стен притягиваются к ним.',
  window:'Нажмите на стену — там появится окно 1200×1400. Потом его можно тянуть вдоль стены.',door:'Нажмите на стену или перегородку — там появится дверь.',
  furn:'Выберите предмет в каталоге справа, затем нажмите на план — он встанет туда. Потом его можно тянуть, поворачивать (клавиша R) и менять размеры.',ruler:'Протяните мышью — покажется расстояние. Шаг привязки учитывается.',
  wing:'Нажмите на наружную стену основного дома — к ней пристроится крыло 4×4 м (Г-, Т-, П-, Ш-образный или крестовый план). Потом тяните его стены мышью.'};
const plSnap=v=>{const s=+PL.snap||1;return Math.round(v/s)*s};
const plClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const plWR=w=>{const x0=w.x0-(w.uy?w.d/2:0),y0=w.y0-(w.ux?w.d/2:0),x1=w.ux?w.x0+w.L:w.x0+w.d/2,y1=w.uy?w.y0+w.L:w.y0+w.d/2;return [x0,y0,x1,y1]};
function plWallById(id){return M.walls.find(w=>w.id===id&&w.zb==null)}
function plObj(s=PL.sel){if(!s)return null;return s.k==='iw'?P.walls[s.i]:s.k==='op'?P.openings[s.i]:s.k==='wing'?P.blocks[s.i]:s.k==='furn'?P.furn[s.i]:null}
function renderPlan(){
  const el=$('#tab-plan');
  if(!el.dataset.ready){
    el.innerHTML=`<div class="sec-head"><h2>План дома — архитектурные решения</h2></div>
      <p class="lead">Рисуйте прямо на плане: тяните стены, перегородки, окна и двери мышью. Фундамент, каркас, кровлю и расчёт программа строит сама по этому плану.</p>
      <div class="pl-bar" role="toolbar" aria-label="Инструменты плана">${PL_TOOLS.map(([k,l,i])=>`<button class="btn sm" data-tool="${k}" aria-pressed="${PL.tool===k}"><span aria-hidden="true">${i}</span> ${l}</button>`).join('')}
        <label class="pl-snap">Шаг <select id="plSnap">${[10,50,100,500].map(v=>`<option${v===PL.snap?' selected':''}>${v}</option>`).join('')}</select> мм</label>
        <button class="btn sm" id="plFit">Весь план</button><button class="btn sm pri" id="pl3d">Посмотреть в 3D</button></div>
      <div class="pl-wrap"><svg id="plSvg" role="img" aria-label="План дома, редактируемый мышью"></svg><div class="pl-side"><div id="plProps"></div><p class="pl-help" id="plHelp"></p></div></div>`;
    el.dataset.ready='1';
    el.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>plSetTool(b.dataset.tool));
    $('#plSnap').onchange=e=>PL.snap=+e.target.value;
    $('#plFit').onclick=()=>{PL.user=false;plDraw()};
    $('#pl3d').onclick=()=>{V3='house';const t3=$('#tab-3d');if(t3.dataset.ready){t3.querySelectorAll('[data-v3]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v3===V3));$('#layers').hidden=true;$('#layersAr').hidden=false}curTab='3d';$('#tabs').querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x.dataset.t==='3d'));renderActive();if(R3)applyLayers()};
    const svg=$('#plSvg');
    svg.addEventListener('pointerdown',plDown);svg.addEventListener('pointermove',plMove);svg.addEventListener('pointerup',plUp);svg.addEventListener('pointercancel',plUp);
    svg.addEventListener('wheel',e=>{e.preventDefault();const p=plPt(e),f=e.deltaY>0?1.15:1/1.15,v=PL.view;v.x=p.x-(p.x-v.x)*f;v.y=-p.y-(-p.y-v.y)*f;v.w*=f;v.h*=f;PL.user=true;plDraw()},{passive:false});
    window.addEventListener('resize',()=>{if(curTab==='plan')plDraw()});
    document.addEventListener('keydown',e=>{if(curTab!=='plan'||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;
      if((e.key==='Delete'||e.key==='Backspace')&&PL.sel){e.preventDefault();plDelete()}else if(e.key==='Escape'){PL.sel=null;PL.place=null;plSetTool('sel')}else if((e.key==='r'||e.key==='R'||e.key==='к'||e.key==='К')&&PL.sel?.k==='furn'){plRotate()}});
  }
  plDraw();
}
function plSetTool(t){PL.tool=t;if(t==='furn')PL.sel=null;if(t!=='ruler')PL.ruler=null;if(t!=='furn')PL.place=null;document.querySelectorAll('#tab-plan [data-tool]').forEach(b=>{const h=/** @type {HTMLElement} */(b);h.setAttribute('aria-pressed',String(h.dataset.tool===t))});
  plDraw()}
function plPt(e){const svg=$('#plSvg'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(svg.getScreenCTM().inverse());return {x:q.x,y:-q.y}}
function plFit(){const X0=M.X0||0,Y0=M.Y0||0,AX=M.AX||M.A,BY=M.BY||M.B,m=1800;PL.view={x:X0-m,y:-(BY+m),w:AX-X0+2*m,h:BY-Y0+2*m}}
function plDraw(){
  const svg=$('#plSvg');if(!svg||!M)return;if(!PL.view||(!PL.user&&!PL.drag))plFit();
  const v=PL.view,cw=svg.clientWidth||800,ch=svg.clientHeight||500,k=Math.max(v.w/cw,v.h/ch),fs=12*k,Y=y=>-y;
  svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`);
  const sel=PL.sel,hl='#2D6A4F';let g=`<defs><pattern id="plG" width="500" height="500" patternUnits="userSpaceOnUse"><path d="M500 0H0V500" fill="none" stroke="#E2E7E3" stroke-width="${k}"/></pattern><pattern id="plG2" width="1000" height="1000" patternUnits="userSpaceOnUse"><path d="M1000 0H0V1000" fill="none" stroke="#CDD5CF" stroke-width="${k}"/></pattern></defs>`;
  g+=`<rect x="${v.x-v.w}" y="${v.y-v.h}" width="${v.w*3}" height="${v.h*3}" fill="url(#plG)"/><rect x="${v.x-v.w}" y="${v.y-v.h}" width="${v.w*3}" height="${v.h*3}" fill="url(#plG2)"/>`;
  /* помещения */
  (M.rooms||[]).forEach((r,i)=>{const on=sel?.k==='room'&&sel.i===i,fill=r.kind==='living'?'#EEF4EC':r.kind==='tech'?'#F5EFE6':'#F3F4F2';
    r.cells.forEach(c=>g+=`<rect data-k="room" data-i="${i}" x="${c[0]}" y="${Y(c[3])}" width="${c[2]-c[0]}" height="${c[3]-c[1]}" fill="${on?'#DCEBDD':fill}" stroke="none"/>`)});
  /* мебель и оборудование */
  (P.furn||[]).forEach((f,i)=>{const on=sel?.k==='furn'&&sel.i===i,col=on?hl:'#5B6862',sw=(on?2:1)*k,[fx0,fy0,fx1,fy1]=furnFoot(f);
    g+=`<g data-k="furn" data-i="${i}" style="cursor:move"><rect x="${fx0}" y="${Y(fy1)}" width="${fx1-fx0}" height="${fy1-fy0}" fill="${on?'#E4EFE6':'#FFFFFF'}" fill-opacity=".85" stroke="none"/>`;
    furnPrims(f).forEach(q=>{g+=q[0]==='r'?`<rect x="${q[1]}" y="${Y(q[4])}" width="${q[3]-q[1]}" height="${q[4]-q[2]}" fill="none" stroke="${col}" stroke-width="${sw}"/>`:q[0]==='c'?`<circle cx="${q[1]}" cy="${Y(q[2])}" r="${q[3]}" fill="none" stroke="${col}" stroke-width="${sw}"/>`:`<line x1="${q[1]}" y1="${Y(q[2])}" x2="${q[3]}" y2="${Y(q[4])}" stroke="${col}" stroke-width="${sw}"/>`});
    if(on)g+=`<text x="${f.x}" y="${Y(fy1)-4*k}" font-size="${fs*.85}" text-anchor="middle" fill="${hl}">${esc(FURN[f.t]?.n||'')}</text>`;g+='</g>'});
  /* стены */
  const WL=M.walls.filter(w=>w.zb==null);
  WL.forEach(w=>{const [x0,y0,x1,y1]=plWR(w),iw=!w.ext,on=(sel?.k==='iw'&&iw&&w.id==='I'+(sel.i+1))||(sel?.k==='ext'&&sel.id===w.id)||(sel?.k==='wing'&&w.wing===sel.i);
    const cur=iw?(w.ux?'ns-resize':'ew-resize'):(w.ux?'ns-resize':'ew-resize');
    g+=`<rect data-k="${iw?'iw':'ext'}" data-id="${w.id}" x="${x0}" y="${Y(y1)}" width="${x1-x0}" height="${y1-y0}" fill="${on?hl:iw?(w.bearing?'#6E7B74':'#9AA59F'):'#2B332F'}" stroke="none" style="cursor:${cur}"/>`});
  /* проёмы */
  M.ops.forEach(o=>{const w=plWallById(o.wall);if(!w)return;const a=o.x,e=o.x+o.w,on=sel?.k==='op'&&sel.i===o.i;let x0,y0,x1,y1;
    if(w.ux){x0=w.x0+a;x1=w.x0+e;y0=w.y0-w.d/2;y1=w.y0+w.d/2}else{y0=w.y0+a;y1=w.y0+e;x0=w.x0-w.d/2;x1=w.x0+w.d/2}
    const col=!o.ok?'#BE3B28':on?hl:'#2B332F';
    g+=`<g data-k="op" data-i="${o.i}" style="cursor:${w.ux?'ew-resize':'ns-resize'}"><rect x="${x0}" y="${Y(y1)}" width="${x1-x0}" height="${y1-y0}" fill="#fff" stroke="${col}" stroke-width="${(on?2.5:1.2)*k}"/>`;
    if(o.type==='window')g+=w.ux?`<line x1="${x0}" y1="${Y(w.y0)}" x2="${x1}" y2="${Y(w.y0)}" stroke="${col}" stroke-width="${1.2*k}"/>`:`<line x1="${w.x0}" y1="${Y(y0)}" x2="${w.x0}" y2="${Y(y1)}" stroke="${col}" stroke-width="${1.2*k}"/>`;
    else{const inw=w.inw||{W1:[0,1],W3:[0,-1],W2:[-1,0],W4:[1,0]}[w.id]||[-w.uy,w.ux],r=o.w;
      if(w.ux){const yb=w.y0+inw[1]*w.d/2,ye=yb+inw[1]*r;g+=`<path d="M${x0} ${Y(yb)}L${x0} ${Y(ye)}A${r} ${r} 0 0 ${inw[1]>0?1:0} ${x1} ${Y(yb)}" fill="none" stroke="${col}" stroke-width="${k}"/>`}
      else{const xb=w.x0+inw[0]*w.d/2,xe=xb+inw[0]*r;g+=`<path d="M${xb} ${Y(y0)}L${xe} ${Y(y0)}A${r} ${r} 0 0 ${inw[0]>0?0:1} ${xb} ${Y(y1)}" fill="none" stroke="${col}" stroke-width="${k}"/>`}}
    const nO=w.inw?[-w.inw[0],-w.inw[1]]:({W1:[0,-1],W3:[0,1],W2:[1,0],W4:[-1,0]}[w.id]||[w.uy?1:0,w.ux?1:0]),gap=w.d/2+5*k;
    g+=w.ux?`<text x="${(x0+x1)/2}" y="${Y(w.y0+nO[1]*gap)+(nO[1]<0?fs*.8:0)}" font-size="${fs*.85}" text-anchor="middle" fill="${col}">${o.mark||'!'}</text></g>`
      :`<text x="${w.x0+nO[0]*gap}" y="${Y((y0+y1)/2)+fs*.3}" font-size="${fs*.85}" text-anchor="${nO[0]<0?'end':'start'}" fill="${col}">${o.mark||'!'}</text></g>`});
  /* подписи помещений */
  (M.rooms||[]).forEach((r,i)=>{g+=`<text data-k="room" data-i="${i}" x="${r.x}" y="${Y(r.y)}" font-size="${fs}" text-anchor="middle" fill="#17201C">${esc(r.name)}</text><text data-k="room" data-i="${i}" x="${r.x}" y="${Y(r.y)+fs*1.3}" font-size="${fs*.95}" text-anchor="middle" fill="#2D6A4F" font-weight="600">${fmt(r.area,1)} м²</text>`;
    if(Math.abs((r.x1-r.x0)*(r.y1-r.y0)/1e6-r.area)<.05)g+=`<text data-k="room" data-i="${i}" x="${r.x}" y="${Y(r.y)+fs*2.5}" font-size="${fs*.8}" text-anchor="middle" fill="#5B6862">${fmt((r.x1-r.x0)/1000,2)} × ${fmt((r.y1-r.y0)/1000,2)} м</text>`});
  /* размеры */
  const AX=M.AX||M.A,BY=M.BY||M.B,X0=M.X0||0,Y0=M.Y0||0;
  g+=plDim(X0,Y0,AX,Y0,-900,k,fs)+plDim(X0,Y0,X0,BY,-900,k,fs,true);
  if(sel?.k==='iw'){const o=P.walls[sel.i];if(o){[['from',o.from],['to',o.to]].forEach(([e,u])=>{const x=o.axis==='x'?u:o.c,y=o.axis==='x'?o.c:u;g+=`<circle data-k="iwEnd" data-i="${sel.i}" data-e="${e}" cx="${x}" cy="${Y(y)}" r="${6*k}" fill="#fff" stroke="${hl}" stroke-width="${2*k}" style="cursor:move"/>`});g+=plIwDims(sel.i,k,fs)}}
  if(sel?.k==='op'){const o=M.ops[sel.i],w=o&&plWallById(o.wall);if(w){const out=(w.inw?-1:1)*0,sg=-1,base=w.ux?w.y0:w.x0;const n=w.inw?[-w.inw[0],-w.inw[1]]:({W1:[0,-1],W3:[0,1],W2:[1,0],W4:[-1,0]}[w.id]||[w.uy,-w.ux]);
    const off=(w.d/2+600)*(w.ux?n[1]:n[0]),P0=u=>w.ux?[w.x0+u,w.y0]:[w.x0,w.y0+u];[[0,o.x],[o.x,o.x+o.w],[o.x+o.w,w.L]].forEach(([a,b])=>{if(b-a<1)return;const p=P0(a),q=P0(b);g+=plDim(p[0],p[1],q[0],q[1],off,k,fs,!w.ux)})}}
  if(PL.drag?.k==='newiw'&&PL.drag.p1){const d=PL.drag,ln=plNewIw(d.p0,d.p1);if(ln){const x0=ln.axis==='x'?ln.from:ln.c,x1=ln.axis==='x'?ln.to:ln.c,y0=ln.axis==='x'?ln.c:ln.from,y1=ln.axis==='x'?ln.c:ln.to;
    g+=`<line x1="${x0}" y1="${Y(y0)}" x2="${x1}" y2="${Y(y1)}" stroke="${hl}" stroke-width="${+P.partH||100}" stroke-opacity=".55"/>`+plDim(x0,y0,x1,y1,ln.axis==='x'?400:-400,k,fs,ln.axis==='y')}}
  if(PL.ruler?.p1){const a=PL.ruler.p0,b=PL.ruler.p1,L=R(Math.hypot(b.x-a.x,b.y-a.y));g+=`<line x1="${a.x}" y1="${Y(a.y)}" x2="${b.x}" y2="${Y(b.y)}" stroke="#B5772D" stroke-width="${2*k}" stroke-dasharray="${6*k} ${3*k}"/><circle cx="${a.x}" cy="${Y(a.y)}" r="${3*k}" fill="#B5772D"/><circle cx="${b.x}" cy="${Y(b.y)}" r="${3*k}" fill="#B5772D"/><text x="${(a.x+b.x)/2}" y="${Y((a.y+b.y)/2)-5*k}" font-size="${fs*1.1}" text-anchor="middle" fill="#B5772D" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="${3*k}">${L} мм</text>`}
  svg.innerHTML=g;
  svg.style.cursor=PL.tool==='sel'?'default':'crosshair';
  $('#plHelp').textContent=PL_HELP[PL.tool]||'';plProps();
}
/* размерная линия в координатах дома (мм); off — вынос, vert — вертикальная */
function plDim(x0,y0,x1,y1,off,k,fs,vert){const Y=y=>-y,L=Math.round(Math.hypot(x1-x0,y1-y0));if(L<1)return '';const c='#5B6862',sw=k;
  if(!vert){const y=y0+off;return `<g stroke="${c}" stroke-width="${sw}"><line x1="${x0}" y1="${Y(y0)}" x2="${x0}" y2="${Y(y)}"/><line x1="${x1}" y1="${Y(y1)}" x2="${x1}" y2="${Y(y)}"/><line x1="${x0}" y1="${Y(y)}" x2="${x1}" y2="${Y(y)}"/><line x1="${x0-4*k}" y1="${Y(y)+4*k}" x2="${x0+4*k}" y2="${Y(y)-4*k}" stroke-width="${2*k}"/><line x1="${x1-4*k}" y1="${Y(y)+4*k}" x2="${x1+4*k}" y2="${Y(y)-4*k}" stroke-width="${2*k}"/></g><text x="${(x0+x1)/2}" y="${Y(y)-3*k}" font-size="${fs*.9}" text-anchor="middle" fill="${c}">${L}</text>`}
  const x=x0+off;return `<g stroke="${c}" stroke-width="${sw}"><line x1="${x0}" y1="${Y(y0)}" x2="${x}" y2="${Y(y0)}"/><line x1="${x1}" y1="${Y(y1)}" x2="${x}" y2="${Y(y1)}"/><line x1="${x}" y1="${Y(y0)}" x2="${x}" y2="${Y(y1)}"/><line x1="${x-4*k}" y1="${Y(y0)+4*k}" x2="${x+4*k}" y2="${Y(y0)-4*k}" stroke-width="${2*k}"/><line x1="${x-4*k}" y1="${Y(y1)+4*k}" x2="${x+4*k}" y2="${Y(y1)-4*k}" stroke-width="${2*k}"/></g><text x="${x-3*k}" y="${Y((y0+y1)/2)}" font-size="${fs*.9}" text-anchor="middle" fill="${c}" transform="rotate(-90 ${x-3*k} ${Y((y0+y1)/2)})">${L}</text>`}
/* до соседних параллельных стен в чистоте */
function plIwDims(i,k,fs){const o=P.walls[i],w=plWallById('I'+(i+1));if(!w)return '';const hz=o.axis==='x',m=(Math.max(+o.from,0)+Math.min(+o.to,hz?M.AX:M.BY))/2;
  const par=M.walls.filter(q=>q.zb==null&&q!==w&&(hz?q.ux:q.uy)&&(hz?(m>=q.x0&&m<=q.x0+q.L):(m>=q.y0&&m<=q.y0+q.L))).map(q=>({c:hz?q.y0:q.x0,d:q.d}));
  const c=+o.c,lo=par.filter(q=>q.c<c).sort((a,b)=>b.c-a.c)[0],hi=par.filter(q=>q.c>c).sort((a,b)=>a.c-b.c)[0];let g='';
  if(lo)g+=hz?plDim(m,lo.c+lo.d/2,m,c-w.d/2,0,k,fs,true):plDim(lo.c+lo.d/2,m,c-w.d/2,m,0,k,fs);
  if(hi)g+=hz?plDim(m,c+w.d/2,m,hi.c-hi.d/2,0,k,fs,true):plDim(c+w.d/2,m,hi.c-hi.d/2,m,0,k,fs);return g}
function plNewIw(p0,p1){const dx=p1.x-p0.x,dy=p1.y-p0.y,hz=Math.abs(dx)>=Math.abs(dy);
  let a=plSnap(hz?Math.min(p0.x,p1.x):Math.min(p0.y,p1.y)),b=plSnap(hz?Math.max(p0.x,p1.x):Math.max(p0.y,p1.y));
  const rc=[[0,0,M.A,M.B],...(M.wings||[]).map(k=>[k.x0,k.y0,k.x1,k.y1])].find(r=>p0.x>=r[0]&&p0.x<=r[2]&&p0.y>=r[1]&&p0.y<=r[3])||[0,0,M.A,M.B],st=hz?rc[0]:rc[1],lim=hz?rc[2]:rc[3];
  const c=plSnap(hz?p0.y:p0.x),stops=[st,lim,...M.walls.filter(q=>q.zb==null&&!q.ext&&(hz?q.uy:q.ux)&&c>=(hz?q.y0:q.x0)-50&&c<=(hz?q.y0:q.x0)+q.L+50).map(q=>R(hz?q.x0:q.y0))];
  const near=v=>{const s=stops.reduce((m,t)=>Math.abs(t-v)<Math.abs(m-v)?t:m,Infinity);return Math.abs(s-v)<=300?s:v};a=near(a);b=near(b);
  if(b-a<400)return null;return {axis:hz?'x':'y',c,from:a,to:b,bearing:false}}
function plDown(e){if(e.button!==0&&e.button!==1)return;const svg=$('#plSvg'),p=plPt(e),t=e.target.closest('[data-k]'),tk=t?.dataset.k;
  svg.setPointerCapture(e.pointerId);
  if(PL.tool==='iw'){PL.drag={k:'newiw',p0:p};return}
  if(PL.tool==='wing'){const tol=M.d+400,inA=p.x>-tol&&p.x<+P.A+tol,inB=p.y>-tol&&p.y<+P.B+tol,id=inA&&Math.abs(p.y)<tol?'W1':inA&&Math.abs(p.y-P.B)<tol?'W3':inB&&Math.abs(p.x)<tol?'W4':inB&&Math.abs(p.x-P.A)<tol?'W2':null;if(!/^W[1-4]$/.test(id||'')){$('#plHelp').textContent='Нажмите на наружную стену основного дома (стены 1–4).';return}
    if((P.blocks||[]).length>=6){$('#plHelp').textContent='Не больше шести крыльев.';return}
    const end=id==='W2'||id==='W4',Ls=end?+P.B:+P.A,w=Math.min(4000,Ls),a=end?p.y:p.x;P.blocks=P.blocks||[];P.blocks.push({side:id,off:plClamp(plSnap(a-w/2),0,Ls-w),w,depth:4000});
    PL.sel={k:'wing',i:P.blocks.length-1};plSetTool('sel');renderSide();schedule(true);return}
  if(PL.tool==='ruler'){const q={x:plSnap(p.x),y:plSnap(p.y)};PL.ruler={p0:q,p1:q};PL.drag={k:'ruler'};plDraw();return}
  if(PL.tool==='furn'){if(!PL.place){$('#plHelp').textContent='Сначала выберите предмет в каталоге справа.';return}P.furn=P.furn||[];P.furn.push(furnNew(PL.place,plSnap(p.x),plSnap(p.y)));PL.sel={k:'furn',i:P.furn.length-1};PL.place=null;plSetTool('sel');schedule(false);return}
  if(PL.tool==='window'||PL.tool==='door'){let w=t&&(tk==='ext'||tk==='iw')?plWallById(t.dataset.id):null;
    if(!w){let best=600;M.walls.filter(q=>q.zb==null).forEach(q=>{const u=q.ux?p.x-q.x0:p.y-q.y0,dd=q.ux?Math.abs(p.y-q.y0):Math.abs(p.x-q.x0);if(u>0&&u<q.L&&dd<best){best=dd;w=q}})}
    if(!w){$('#plHelp').textContent='Нажмите ближе к стене или перегородке.';return}
    const door=PL.tool==='door',ow=door?(w.ext?1000:800):1200,u=(w.ux?p.x-w.x0:p.y-w.y0);
    P.openings.push(W(w.id,door?'door':'window',plClamp(plSnap(u-ow/2),0,Math.max(0,w.L-ow)),ow));PL.sel={k:'op',i:P.openings.length-1};plSetTool('sel');schedule(true);return}
  if(!t||e.button===1){PL.drag={k:'pan',cx:e.clientX,cy:e.clientY,v0:{...PL.view}};if(!t)PL.sel=null;plDraw();return}
  const P0=clone({A:P.A,B:P.B,walls:P.walls,openings:P.openings,blocks:P.blocks||[],rooms:P.rooms||[]});
  if(tk==='room'){PL.sel={k:'room',i:+t.dataset.i};PL.drag=null;plDraw();return}
  if(tk==='furn'){const i=+t.dataset.i,f=P.furn[i];PL.sel={k:'furn',i};PL.drag={k:'furn',i,gx:p.x-f.x,gy:p.y-f.y,P0:{furn:clone(P.furn)}};plDraw();return}
  if(tk==='iw'){const i=+t.dataset.id.slice(1)-1;PL.sel={k:'iw',i};PL.drag={k:'iw',i,p0:p,P0}}
  else if(tk==='iwEnd'){PL.drag={k:'iwEnd',i:+t.dataset.i,e:t.dataset.e,p0:p,P0}}
  else if(tk==='op'){const i=+t.dataset.i,o=P.openings[i],w=plWallById(o.wall);PL.sel={k:'op',i};if(w)PL.drag={k:'op',i,w,grab:(w.ux?p.x-w.x0:p.y-w.y0)-o.x,P0}}
  else if(tk==='ext'){const w=plWallById(t.dataset.id);if(w.wing!=null){const kw=M.wings[w.wing];PL.sel={k:'wing',i:w.wing};
      const edge=['lo','depth','hi'][+w.id.slice(1)-kw.id0]||'depth';PL.drag={k:'wing',i:w.wing,edge,kw,P0}}
    else{PL.sel={k:'ext',id:w.id};PL.drag={k:'ext',id:w.id,p0:p,P0}}}
  plDraw()}
function plMove(e){const d=PL.drag;if(!d)return;const p=plPt(e);
  if(d.k==='pan'){const svg=$('#plSvg'),v=PL.view,k=Math.max(d.v0.w/(svg.clientWidth||800),d.v0.h/(svg.clientHeight||500));v.x=d.v0.x-(e.clientX-d.cx)*k;v.y=d.v0.y-(e.clientY-d.cy)*k;PL.user=true;plDraw();return}
  if(d.k==='newiw'){d.p1=p;plDraw();return}
  if(d.k==='ruler'){PL.ruler.p1={x:plSnap(p.x),y:plSnap(p.y)};plDraw();return}
  if(d.k==='furn'){const f=P.furn[d.i];f.x=plSnap(p.x-d.gx);f.y=plSnap(p.y-d.gy);d.moved=true;plDraw();return}
  d.moved=true;Object.assign(P,clone(d.P0));
  if(d.k==='iw'){const o=P.walls[d.i];o.c=plSnap(o.axis==='x'?p.y:p.x)}
  else if(d.k==='iwEnd'){const o=P.walls[d.i],u=plSnap(o.axis==='x'?p.x:p.y);if(d.e==='from')o.from=Math.min(u,+o.to-400);else o.to=Math.max(u,+o.from+400)}
  else if(d.k==='op'){const o=P.openings[d.i];o.x=plClamp(plSnap((d.w.ux?p.x-d.w.x0:p.y-d.w.y0)-d.grab),0,Math.max(0,d.w.L-o.w))}
  else if(d.k==='wing'){const b=P.blocks[d.i],kw=d.kw,a=kw.T[0]?p.x:p.y,rr={W1:-p.y,W2:p.x-P.A,W3:p.y-P.B,W4:-p.x}[kw.side],lim=kw.end?+P.B:+P.A;
    if(d.edge==='depth')b.depth=plClamp(plSnap(rr),1500,8000);else if(d.edge==='lo'){const e2=+b.off+ +b.w;b.off=plClamp(plSnap(a),0,e2-2000);b.w=e2-b.off}else b.w=plClamp(plSnap(a)-b.off,2000,lim-b.off)}
  else if(d.k==='ext'){const A0=+P.A,B0=+P.B;if(d.id==='W2'){P.A=plClamp(plSnap(p.x),3000,24000);P.walls.forEach(w=>{if(w.axis==='x'&&+w.to>=A0-50)w.to=P.A})}
    else if(d.id==='W3'){P.B=plClamp(plSnap(p.y),3000,12000);P.walls.forEach(w=>{if(w.axis==='y'&&+w.to>=B0-50)w.to=P.B})}
    else if(d.id==='W4')plShift('x',plClamp(plSnap(p.x),+P.A-24000,+P.A-3000));else if(d.id==='W1')plShift('y',plClamp(plSnap(p.y),+P.B-12000,+P.B-3000))}
  cancelAnimationFrame(PL.raf);PL.raf=requestAnimationFrame(()=>{try{M=build(P)}catch(err){}plDraw()})}
/* перенос левой/нижней стены: начало координат остаётся в углу дома, всё внутри сдвигается */
function plShift(ax,s){if(!s)return;if(ax==='x'){P.A-=s;P.walls.forEach(w=>{if(w.axis==='y')w.c-=s;else{w.from=+w.from<=50?0:w.from-s;w.to-=s}});P.openings.forEach(o=>{if(o.wall==='W1'||o.wall==='W3')o.x-=s});(P.blocks||[]).forEach(b=>{if(b.side==='W3'||b.side==='W1')b.off-=s});(P.rooms||[]).forEach(r=>r.x-=s)}
  else{P.B-=s;P.walls.forEach(w=>{if(w.axis==='x')w.c-=s;else{w.from=+w.from<=50?0:w.from-s;w.to-=s}});P.openings.forEach(o=>{if(/^(W2|W4|G2|G4)$/.test(o.wall))o.x-=s});(P.blocks||[]).forEach(b=>{if(b.side==='W2'||b.side==='W4')b.off-=s});(P.rooms||[]).forEach(r=>r.y-=s)}}
function plUp(e){const d=PL.drag;PL.drag=null;if(!d)return;
  if(d.k==='newiw'){const ln=d.p1&&plNewIw(d.p0,d.p1);if(ln){P.walls.push(ln);PL.sel={k:'iw',i:P.walls.length-1}}plDraw();if(ln)schedule(true);return}
  if(d.k==='ruler')return;
  if(d.moved){if(d.k==='ext'||d.k==='wing')renderSide();schedule(d.k!=='furn')}}
function plRotate(){const f=P.furn?.[PL.sel?.i];if(!f)return;f.rot=((+f.rot||0)+90)%360;schedule(false)}
function plDelete(){const s=PL.sel;if(!s)return;
  if(s.k==='iw'){P.walls.splice(s.i,1);P.openings=P.openings.filter(o=>o.wall!=='I'+(s.i+1)).map(o=>{const m=/^I(\d+)$/.exec(o.wall);return m&&+m[1]>s.i+1?{...o,wall:'I'+(+m[1]-1)}:o})}
  else if(s.k==='op')P.openings.splice(s.i,1);
  else if(s.k==='furn')P.furn.splice(s.i,1);
  else if(s.k==='wing'){const i=s.i,ids=[0,1,2].map(q=>'W'+(5+3*i+q)).concat('GК'+(i+1));P.blocks.splice(i,1);
    P.openings=P.openings.filter(o=>!ids.includes(o.wall)).map(o=>{let m=/^W(\d+)$/.exec(o.wall);if(m&&+m[1]>=5+3*(i+1))return {...o,wall:'W'+(+m[1]-3)};m=/^GК(\d+)$/.exec(o.wall);if(m&&+m[1]>i+1)return {...o,wall:'GК'+(+m[1]-1)};return o})}
  else if(s.k==='room'){const r=M.rooms[s.i];if(r&&r.ref>=0)P.rooms.splice(r.ref,1)}
  else return;PL.sel=null;schedule(true)}
/* панель свойств выбранного элемента */
function plProps(){const box=$('#plProps');if(!box)return;const s=PL.sel,num=(f,l,v,u='мм',st=50)=>`<label class="pl-f"><span>${l}</span><input type="number" step="${st}" data-f="${f}" value="${v}"> <small>${u}</small></label>`;let h='';
  const errs=id=>M.errs.filter(e=>e.wall===id).map(e=>`<p class="err">${esc(e.msg)}</p>`).join('');
  if(!s&&PL.tool==='furn'){box.innerHTML=`<h3>Каталог</h3>${FURN_CAT.map(([cat,items])=>`<details class="pl-cat" open><summary>${cat}</summary><div class="pl-items">${items.map(([t,n,w,d])=>`<button class="btn sm${PL.place===t?' pri':''}" data-place="${t}" title="${w}×${d} мм">${n}</button>`).join('')}</div></details>`).join('')}`;
    box.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{PL.place=b.dataset.place;PL.cat=FURN[PL.place].cat;plProps();$('#plHelp').textContent='Нажмите на план — «'+FURN[PL.place].n+'» встанет туда.'});return}
  if(!s){const T=tep(M);h=`<h3>Дом</h3>${num('A','Длина (ось X)',P.A)}${num('B','Ширина (ось Y)',P.B)}${num('H','Высота стен',P.H)}
    <p class="pl-sum">Застройка ${fmt(T.build,1)} м² · общая ${fmt(T.tot,1)} м² · жилая ${fmt(T.liv,1)} м²<br>Помещений ${(M.rooms||[]).length}, проёмов ${M.ops.filter(o=>o.ok).length}</p>`}
  else if(s.k==='ext'){const w=plWallById(s.id);h=`<h3>${esc(w?.name||s.id)}</h3><p class="pl-sum">Длина ${R(w?.L||0)} мм. Тяните стену мышью, чтобы изменить размер дома.</p>`}
  else if(s.k==='iw'){const o=P.walls[s.i];if(!o){PL.sel=null;return plProps()}h=`<h3>Перегородка I${s.i+1}</h3><p class="pl-sum">${o.axis==='x'?'Вдоль оси X (горизонтальная)':'Вдоль оси Y (вертикальная)'}</p>${num('c',o.axis==='x'?'Положение Y':'Положение X',o.c)}${num('from','Начало',o.from)}${num('to','Конец',o.to)}
    <label class="pl-f chk"><input type="checkbox" data-f="bearing"${o.bearing?' checked':''}> несущая (на неё опирается перекрытие)</label>${errs('I'+(s.i+1))}`}
  else if(s.k==='op'){const o=P.openings[s.i],st=M.ops[s.i];if(!o){PL.sel=null;return plProps()}h=`<h3>${o.type==='door'?'Дверь':'Окно'} ${st?.mark||''}</h3><p class="pl-sum">Стена ${esc(o.wall)}</p>
    <label class="pl-f"><span>Тип</span><select data-f="type"><option value="window"${o.type==='window'?' selected':''}>окно</option><option value="door"${o.type==='door'?' selected':''}>дверь</option></select></label>
    ${num('x','Отступ от начала стены',o.x)}${num('w','Ширина',o.w)}${num('h','Высота',o.h)}${o.type==='door'?'':num('sill','Низ от пола',o.sill)}${st&&!st.ok?`<p class="err">${esc(st.msg)}</p>`:''}`}
  else if(s.k==='wing'){const b=P.blocks[s.i];if(!b){PL.sel=null;return plProps()}h=`<h3>Крыло ${s.i+1} · ${({W1:'спереди',W2:'справа',W3:'сзади',W4:'слева'})[b.side]||''}</h3>${num('off',(b.side==='W2'||b.side==='W4')?'Отступ от стены 1':'Отступ от стены 4',b.off)}${num('w','Ширина крыла',b.w)}${num('depth','Вынос крыла',b.depth)}${errs('K'+(s.i+1))}`}
  else if(s.k==='furn'){const f=P.furn[s.i];if(!f){PL.sel=null;return plProps()}h=`<h3>${esc(FURN[f.t]?.n||'Предмет')}</h3>${num('w','Ширина',f.w,'мм',10)}${num('d','Глубина',f.d,'мм',10)}${num('h','Высота',f.h,'мм',10)}${num('e','Низ от пола',f.e,'мм',10)}
    <div class="btns"><button class="btn sm" id="plRot">Повернуть на 90° (R)</button></div>`}
  else if(s.k==='room'){const r=M.rooms[s.i];if(!r){PL.sel=null;return plProps()}h=`<h3>Помещение ${r.no}</h3><label class="pl-f"><span>Название</span><input type="text" data-f="name" value="${esc(r.name)}"></label>
    <label class="pl-f"><span>Назначение</span><select data-f="kind">${Object.entries(ROOM_KIND).map(([k,l])=>`<option value="${k}"${r.kind===k?' selected':''}>${l}</option>`).join('')}</select></label><p class="pl-sum">Площадь ${fmt(r.area,1)} м²${Math.abs((r.x1-r.x0)*(r.y1-r.y0)/1e6-r.area)<.05?` · ${fmt((r.x1-r.x0)/1000,2)} × ${fmt((r.y1-r.y0)/1000,2)} м · периметр ${fmt(2*((r.x1-r.x0)+(r.y1-r.y0))/1000,2)} м`:''}<br>Мебели внутри: ${(P.furn||[]).filter(f=>r.cells.some(c=>f.x>c[0]&&f.x<c[2]&&f.y>c[1]&&f.y<c[3])).length}</p>`}
  if(s)h+=`<div class="btns"><button class="btn sm" id="plDesel">Готово</button>${s.k!=='ext'?'<button class="btn sm danger" id="plDel">Удалить</button>':''}</div>`;
  box.innerHTML=h;
  box.querySelectorAll('[data-f]').forEach(inp=>inp.onchange=()=>{const f=inp.dataset.f,val=inp.type==='checkbox'?inp.checked:inp.type==='number'?+inp.value:inp.value;
    if(!s){P[f]=val;renderSide()}
    else if(s.k==='room'){const r=M.rooms[s.i];let q=r.ref>=0?P.rooms[r.ref]:null;if(!q){q={x:R(r.x),y:R(r.y),name:r.name,kind:r.kind};P.rooms.push(q)}q[f]=val}
    else{const o=plObj(s);if(o)o[f]=val}
    schedule(s?.k!=='furn')});
  const dl=$('#plDel');if(dl)dl.onclick=plDelete;const rt=$('#plRot');if(rt)rt.onclick=plRotate;const ds=$('#plDesel');if(ds)ds.onclick=()=>{PL.sel=null;plDraw()};
}
