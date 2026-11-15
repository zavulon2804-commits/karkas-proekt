function sheetPiles(){
  const x0=M.X0||0,y0=M.Y0||0,x1=M.AX||M.A,y1=M.BY||M.B,A=x1-x0,B=y1-y0,mL=34,mB=34,mT=14,mR=10,s=fit(A,B,385-mL-mR,222-mT-mB);
  const w=A/s,h=B/s,px0=25+mL+(385-mL-mR-w)/2,py0=10+mT+(222-mT-mB-h)/2;
  const X=x=>px0+(x-x0)/s,Y=y=>py0+(y1-y)/s;let g=Tx(25+385/2,16,`План свайного поля  М 1:${s}`,{size:3.5,cls:'b'});
  [[0,0,M.A,M.B],...(M.wings||[]).map(k=>[k.x0,k.y0,k.x1,k.y1])].forEach(r=>g+=Rc(X(r[0]),Y(r[3]),(r[2]-r[0])/s,(r[3]-r[1])/s,'hd'));
  M.mem.filter(m=>m.grp==='grill').forEach(m=>{const hw=m.sz/2/s;if(Math.abs(m.p1[0]-m.p0[0])>1)g+=Rc(X(m.p0[0]),Y(m.p0[1])-hw,(m.p1[0]-m.p0[0])/s,2*hw,'ctx');else g+=Rc(X(m.p0[0])-hw,Y(m.p1[1]),2*hw,(m.p1[1]-m.p0[1])/s,'ctx')});
  const uq=a=>[...new Set(a.map(v=>R(v)))].sort((p,c)=>p-c).filter((v,i,arr)=>!i||v-arr[i-1]>250),xsU=uq(M.piles.map(p=>p.x)),ysU=uq(M.piles.map(p=>p.y));
  xsU.forEach((x,i)=>{g+=Ln(X(x),Y(y1)-4,X(x),Y(y0)+25,'ax');g+=bubble(X(x),Y(y0)+28.6,i+1)});
  ysU.forEach((y,i)=>{g+=Ln(X(x0)-25,Y(y),X(x1)+4,Y(y),'ax');g+=bubble(X(x0)-28.6,Y(y),AX_LET[i]||'?')});
  const r=Math.max(1.3,M.pileD/2/s);
  const sq=M.pileT.kind==='driven';
  M.piles.forEach(p=>{g+=(sq?Rc(X(p.x)-r,Y(p.y)-r,2*r,2*r,'pile'):Ci(X(p.x),Y(p.y),r,'pile'))+Ln(X(p.x)-r,Y(p.y),X(p.x)+r,Y(p.y))+Ln(X(p.x),Y(p.y)-r,X(p.x),Y(p.y)+r);g+=Tx(X(p.x)+r+.5,Y(p.y)-r-.4,p.no,{size:2,a:'start'})});
  g+=chainH([x0,...xsU,x1],X,Y(y0)+8,Y(y0))+dimH(X(x0),X(x1),Y(y0)+16,Y(y0),A);
  g+=chainV([y0,...ysU,y1],Y,X(x0)-8,X(x0))+dimV(Y(y0),Y(y1),X(x0)-16,X(x0),B);
  const top=elvTxt(M.H0-M.z0);
  g+=tableBlock(25,240,200,22,'Ведомость свай',[{t:'Поз.',w:10},{t:'Наименование',w:70,a:'start'},{t:'Длина, мм',w:20},{t:'Кол-во',w:16},{t:'Отм. верха',w:22}],[[1,M.pileT.name,M.pileLen,M.piles.length,top]]);
  const tk=M.pileT.kind,low=elvTxt(M.H0-M.pileLen-M.z0);
  const n2={screw:[`2. Лопасть — ниже глубины промерзания ${P.freeze} мм не менее чем на 300 мм, отметка низа ${low}.`,'3. Оголовки 250×250 выставить по нивелиру в один горизонт, ствол заполнить бетоном М300.'],
    driven:[`2. Сваи забить до отметки острия ${low}, контролировать отказ. Голову срубить в один горизонт.`,'3. На оголовок — закладная пластина 300×300×8 на анкерах; к ней крепить брус ростверка.'],
    bored:[`2. Скважины Ø${M.pileT.d}${M.pileT.base?` с уширением Ø${M.pileT.base}`:''} до отм. ${low}. Армирование 4Ø12 А500С, хомуты Ø6 шаг 300, бетон В20 F150.`,`3. В зоне промерзания (${P.freeze} мм) — гильза из 2 слоёв рубероида. Сверху закладная пластина 250×250×6.`],
    manual:[`2. Низ сваи — отметка ${low}. Монтаж по паспорту изделия.`,'3. Оголовки выставить по нивелиру в один горизонт.']}[tk]||[];
  const notes=[`1. За отм. ±0,000 принят верх чернового пола. Верх свай ${top} (${M.H0} мм над землёй).`,...n2,'4. Номера свай — на плане; оси — по центрам свай. Между оголовком и брусом — гидроизоляция.'];
  notes.forEach((t,i)=>g+=Tx(25,262+i*4.6,t,{a:'start',size:2.2}));
  return {code:'Ф-1',title:'План свайного поля',sub:`Свай ${M.piles.length} шт, ${M.pileT.short}, L=${M.pileLen}`,scale:s,body:g};
}
function sheetGrill(){
  const x0=M.X0||0,y0=M.Y0||0,x1=M.AX||M.A,y1=M.BY||M.B,A=x1-x0,B=y1-y0,mL=26,mB=26,mT=14,mR=10,s=fit(A,B,385-mL-mR,222-mT-mB);
  const w=A/s,h=B/s,px0=25+mL+(385-mL-mR-w)/2,py0=10+mT+(222-mT-mB-h)/2;
  const X=x=>px0+(x-x0)/s,Y=y=>py0+(y1-y)/s;let g=Tx(25+385/2,16,`План ростверка и лаг пола  М 1:${s}`,{size:3.5,cls:'b'});
  const planRect=(m,c)=>{const hw=m.sz/2/s;if(Math.abs(m.p1[0]-m.p0[0])>1)return Rc(X(Math.min(m.p0[0],m.p1[0])),Y(m.p0[1])-hw,Math.abs(m.p1[0]-m.p0[0])/s,2*hw,c);return Rc(X(m.p0[0])-hw,Y(Math.max(m.p0[1],m.p1[1])),2*hw,Math.abs(m.p1[1]-m.p0[1])/s,c)};
  M.mem.filter(m=>m.grp==='grill').forEach(m=>g+=planRect(m,'w2'));
  M.mem.filter(m=>m.grp==='floor').forEach(m=>g+=planRect(m,'w'));
  const r=Math.max(1.2,M.pileD/2/s);M.piles.forEach(p=>g+=Ci(X(p.x),Y(p.y),r,'hd'));
  g+=chainH([x0,...M.xsJ,x1],X,Y(y0)+8,Y(y0))+dimH(X(x0),X(x1),Y(y0)+16,Y(y0),A);
  g+=chainV([y0,...M.lines.filter(l=>l.axis==='x').map(l=>l.c),y1],Y,X(x0)-8,X(x0))+dimV(Y(y0),Y(y1),X(x0)-16,X(x0),B);
  const jm=M.mem.find(m=>m.role==='Л'),bm=M.mem.find(m=>m.role==='Б'),xj=M.xsJ[Math.min(2,M.xsJ.length-1)];
  if(jm){const yy=Y(M.B*.72);g+=Ln(X(xj),yy,X(xj)+14,yy-8)+Ln(X(xj)+14,yy-8,X(xj)+46,yy-8)+Tx(X(xj)+15,yy-9,`${jm.mark} лага ${M.bj}×${M.hj}, шаг ${M.sj}`,{a:'start',size:2.3})}
  if(bm){const xx=X(M.A*.55),yy=Y(M.bb/2);g+=Ln(xx,yy,xx+10,yy-12)+Ln(xx+10,yy-12,xx+52,yy-12)+Tx(xx+11,yy-13,`${bm.mark} брус ростверка ${M.bb}×${M.hb}${M.ply>1?` (${M.ply} доски)`:''}`,{a:'start',size:2.3})}
  g+=tableBlock(25,240,200,48,'Спецификация элементов листа',MARK_COLS,markRows(x=>x.grp==='grill'||x.grp==='floor'));
  return {code:'Ф-2',title:'План ростверка и лаг',sub:`Промежуточных балок: ${M.nMid}, пролёт лаг ${R(M.Lj)} мм`,scale:s,body:g};
}
function sheetPlan(){
  const {A,B,d}=M,AX=M.AX||A,BY=M.BY||B,X0=M.X0||0,Y0=M.Y0||0,EW=96,aw=385-EW,mL=46,mR=30,mT=26,mB=44,s=fit(AX-X0,BY-Y0,aw-mL-mR,222-mT-mB);
  const w=(AX-X0)/s,h=(BY-Y0)/s,px0=25+mL+(aw-mL-mR-w)/2,py0=10+mT+(222-mT-mB-h)/2;
  const X=x=>px0+(x-X0)/s,Y=y=>py0+(BY-y)/s;let g=Tx(25+aw/2,16,`План 1 этажа  М 1:${s}`,{size:3.5,cls:'b'});
  const wgS=side=>(M.wings||[]).filter(k=>k.side===side);
  const {ax,ay}=planAxes(M);
  ax.forEach((x,i)=>{g+=Ln(X(x),Y(BY)-5,X(x),Y(Y0)+35,'ax')+bubble(X(x),Y(Y0)+38.6,i+1)});
  ay.forEach((y,i)=>{g+=Ln(X(AX)+5,Y(y),X(X0)-35,Y(y),'ax')+bubble(X(X0)-38.6,Y(y),AX_LET[i]||'?')});
  /* помещения: лёгкая заливка */
  (M.rooms||[]).forEach(r=>r.cells.forEach(c=>g+=`<rect x="${f2(X(c[0]))}" y="${f2(Y(c[3]))}" width="${f2((c[2]-c[0])/s)}" height="${f2((c[3]-c[1])/s)}" fill="${r.kind==='living'?'#F3F7F1':r.kind==='tech'?'#F6F1EA':'#F7F7F7'}" stroke="none"/>`));
  /* мебель и оборудование — тонкими линиями */
  (P.furn||[]).forEach(f=>furnPrims(f).forEach(q=>{g+=q[0]==='r'?Rc(X(q[1]),Y(q[4]),(q[3]-q[1])/s,(q[4]-q[2])/s,'t'):q[0]==='c'?Ci(X(q[1]),Y(q[2]),q[3]/s,'t'):Ln(X(q[1]),Y(q[2]),X(q[3]),Y(q[4]),'t')}));
  const WL=M.walls.filter(w=>w.zb==null);
  const wr=w0=>{const x0=w0.x0-(w0.uy?w0.d/2:0),y0=w0.y0-(w0.ux?w0.d/2:0),x1=w0.ux?w0.x0+w0.L:w0.x0+w0.d/2,y1=w0.uy?w0.y0+w0.L:w0.y0+w0.d/2;return [x0,y0,x1,y1]};
  WL.forEach(wl=>{const [x0,y0,x1,y1]=wr(wl);g+=Rc(X(x0),Y(y1),(x1-x0)/s,(y1-y0)/s,wl.ext?'wl':'wlp')});
  WL.forEach(wl=>{wl.ops.filter(o=>o.ok).forEach(o=>{const a=o.x,e=o.x+o.w;let x0,y0,x1,y1;
    if(wl.ux){x0=wl.x0+a;x1=wl.x0+e;y0=wl.y0-wl.d/2;y1=wl.y0+wl.d/2}else{y0=wl.y0+a;y1=wl.y0+e;x0=wl.x0-wl.d/2;x1=wl.x0+wl.d/2}
    g+=Rc(X(x0),Y(y1),(x1-x0)/s,(y1-y0)/s,'op');
    if(o.type==='window'){if(wl.ux)g+=Ln(X(x0),Y(wl.y0),X(x1),Y(wl.y0));else g+=Ln(X(wl.x0),Y(y0),X(wl.x0),Y(y1))}
    else{const rr=o.w/s;if(wl.ux)g+=`<path d="M${f2(X(x0))} ${f2(Y(wl.y0+wl.d/2))} l0 ${f2(-rr)} A${f2(rr)} ${f2(rr)} 0 0 1 ${f2(X(x1))} ${f2(Y(wl.y0+wl.d/2))}" class="t"/>`;else g+=`<path d="M${f2(X(wl.x0+wl.d/2))} ${f2(Y(y0))} l${f2(rr)} 0 A${f2(rr)} ${f2(rr)} 0 0 0 ${f2(X(wl.x0+wl.d/2))} ${f2(Y(y1))}" class="t"/>`}
    const inw=wl.inw||{W1:[0,1],W3:[0,-1],W2:[-1,0],W4:[1,0]}[wl.id]||[-wl.uy,wl.ux],off=wl.d/2/s+(wl.uy?2.8:3.6);
    const cx=wl.ux?X((x0+x1)/2):X(wl.x0)+inw[0]*off,cy=wl.ux?Y(wl.y0)-inw[1]*off+(inw[1]<0?0:0.9):Y((y0+y1)/2);g+=Tx(cx,cy,o.mark,{size:2.2,rot:wl.uy?-90:0})})});
  WL.forEach(wl=>{const sx=X(wl.x0),sy=Y(wl.y0),dx=wl.ux*7,dy=-wl.uy*7;g+=Ln(sx,sy,sx+dx,sy+dy,'m')+Pg([[sx+dx,sy+dy],[sx+dx-wl.ux*1.8-wl.uy*.9,sy+dy+wl.uy*1.8-wl.ux*.9],[sx+dx-wl.ux*1.8+wl.uy*.9,sy+dy+wl.uy*1.8+wl.ux*.9]],'blk');
    const mx=wl.x0+wl.ux*wl.L/2,my=wl.y0+wl.uy*wl.L/2;
    if(wl.ext){g+=Tx(sx+dx+wl.ux*5.5+(wl.uy?(wl.id==='W4'?2.6:-2.6):0),sy+dy-wl.uy*5.5+(wl.ux?(wl.id==='W1'?-1.6:3.4):0),'ст.'+wl.id.slice(1),{size:2,rot:wl.uy?-90:0})}
    else g+=Tx(X(mx)+(wl.uy?3.2:wl.L/s*.2),Y(my)-(wl.ux?wl.d/2/s+1.2:-wl.L/s*.2),wl.id+(wl.bearing?' несущ.':''),{size:2.3,a:'start'})});
  const opsW=id=>{const wl=M.walls.find(x=>x.id===id);return wl.ops.filter(o=>o.ok).flatMap(o=>[o.x,o.x+o.w].map(v=>(wl.ux?wl.x0:wl.y0)+v))};
  const sideH=(sd,y,dir,yy)=>{const ws=wgS(sd);return ws.length?chainH([X0,...ws.flatMap(k=>[k.x0,k.x1]),0,A,AX],X,Y(yy)+dir*9,Y(yy)):chainH([0,M.d,...opsW(sd),A-M.d,A],X,Y(y)+dir*9,Y(y))};
  const sideV=(sd,x,dir,xx)=>{const ws=wgS(sd);return ws.length?chainV([Y0,...ws.flatMap(k=>[k.y0,k.y1]),0,B,BY],Y,X(xx)+dir*11,X(xx)):chainV([0,M.d,...opsW(sd),B-M.d,B],Y,X(x)+dir*11,X(x))};
  g+=sideH('W1',0,1,Y0)+chainH([X0,...ax,AX],X,Y(Y0)+17,Y(Y0))+dimH(X(X0),X(AX),Y(Y0)+25,Y(Y0),AX-X0);
  g+=sideH('W3',B,-1,BY)+dimH(X(X0),X(AX),Y(BY)-17,Y(BY),AX-X0);
  g+=sideV('W4',0,-1,X0)+chainV([Y0,...ay,BY],Y,X(X0)-17,X(X0))+dimV(Y(Y0),Y(BY),X(X0)-25,X(X0),BY-Y0);
  g+=sideV('W2',A,1,AX)+dimV(Y(Y0),Y(BY),X(AX)+19,X(AX),BY-Y0);
  /* марки помещений: номер, название, площадь */
  (M.rooms||[]).forEach(r=>{const cx=X(r.x),cy=Y(r.y),wmm=(r.x1-r.x0)/s,sz=wmm<22?1.8:2.2,nm=r.name.length*sz*.5>wmm-2?r.name.slice(0,Math.max(3,Math.floor((wmm-2)/(sz*.5))))+'…':r.name,ar=fmt(r.area,1);
    g+=Ci(cx,cy-3.4,2.5,'t')+Tx(cx,cy-2.5,r.no,{size:2.4,cls:'b'})+Tx(cx,cy+1.2,nm,{size:sz})+Tx(cx,cy+4.6,ar,{size:sz,cls:'b'})+Ln(cx-ar.length*sz*.28,cy+5.3,cx+ar.length*sz*.28,cy+5.3)});
  /* экспликация и показатели */
  const T=tep(M),ex=25+aw+3;
  g+=tableBlock(ex,30,EW-5,150,'Экспликация помещений',[{t:'№',w:8},{t:'Наименование',w:47,a:'start'},{t:'Пл., м²',w:16},{t:'Кат.',w:20}],
    [...(M.rooms||[]).map(r=>[r.no,r.name,fmt(r.area,1),ROOM_KIND[r.kind]]),['','Итого',fmt(T.tot,1),''],['','в т. ч. жилая',fmt(T.liv,1),'']]);
  [`Площадь застройки — ${fmt(T.build,1)} м²`,`Общая площадь 1 этажа — ${fmt(T.tot,1)} м²`,...(T.mans?[`Мансарда (h ≥ 1,5 м) — ${fmt(T.mans,1)} м²`]:[]),`Площади — в чистоте, по внутренним граням стен`].forEach((t,i)=>g+=Tx(ex,30+5.2+((M.rooms||[]).length+2)*4+9+i*4.2,t,{a:'start',size:2.2}));
  const om=new Map();M.ops.filter(o=>o.ok&&!/^[GK]/.test(o.wall)).forEach(o=>{if(!om.has(o.mark))om.set(o.mark,{...o,q:0});om.get(o.mark).q++});
  g+=tableBlock(25,240,200,40,'Ведомость проёмов (черновые размеры)',[{t:'Марка',w:14},{t:'Тип',w:16},{t:'Ширина × высота',w:30},{t:'Низ от пола',w:20},{t:'Кол-во',w:14}],[...om.values()].sort((a,c)=>a.mark.localeCompare(c.mark,'ru')).map(o=>[o.mark,o.type==='door'?'дверь':'окно',`${o.w} × ${o.h}`,o.sill,o.q]));
  g+=Tx(25,286,'Стрелка — начало стены и отсчёта размеров на развёртках каркаса (листы КД). Номер помещения — в кружке, площадь — подчёркнута, м².',{a:'start',size:2.1});
  return {code:'АР-1',title:'План 1 этажа',sub:`Помещений ${(M.rooms||[]).length}, общая площадь ${fmt(tep(M).tot,1)} м²`,scale:s,body:g};
}
function sheetWall(wl,code){
  const ms=M.mem.filter(m=>m.wall===wl.id&&m.loc);
  const lo=m=>m.loc.kind==='v'?m.loc.u-m.loc.bw/2:Math.min(m.loc.u0,m.loc.u1),hi=m=>m.loc.kind==='v'?m.loc.u+m.loc.bw/2:Math.max(m.loc.u0,m.loc.u1);
  const zb=wl.zb??M.z0,ctxGable=(!!wl.top&&!wl.wingGable)||(!M.gable&&(wl.id==='W2'||wl.id==='W4')),Hw=wl.H??M.H;
  let u0=Math.min(0,...ms.map(lo)),u1=Math.max(wl.L,...ms.map(hi)),v1=Math.max(wl.top?0:Hw,...ms.map(m=>m.loc.v1)),vmin=0;
  if(ctxGable){u0=Math.min(u0,-M.ov-wl.y0);u1=Math.max(u1,M.B+M.ov-wl.y0);v1=Math.max(v1,M.zRidge-zb);vmin=Math.min(0,M.zt-zb)}
  else if(wl.ext){v1=Math.max(v1,M.H+M.ha)}
  const mL=12,mR=24,mT=24,mB=34,s=fit(u1-u0,v1-vmin,385-mL-mR,222-mT-mB);
  const w=(u1-u0)/s,h=(v1-vmin)/s,px0=25+mL+(385-mL-mR-w)/2,py0=10+mT+(222-mT-mB-h)/2;
  const X=u=>px0+(u-u0)/s,Y=v=>py0+(v1-v)/s;
  let g=Tx(25+385/2,16,`${wl.name}: развёртка каркаса  М 1:${s}`,{size:3.5,cls:'b'});
  if(ctxGable){const z=zb,ys=[],tops=[];const yA=-M.ov,yE=M.B+M.ov;for(let i=0;i<=40;i++){const y=yA+(yE-yA)*i/40;ys.push(y)}
    const und=ys.map(y=>[X(y-wl.y0),Y((M.gable?M.zr0+Math.min(y,M.B-y)*M.tn:M.zr0+y*M.tn)-z)]),top=ys.map(y=>[X(y-wl.y0),Y((M.gable?M.zr0+Math.min(y,M.B-y)*M.tn:M.zr0+y*M.tn)+M.hr/M.cs-z)]);
    g+=Pg([...und,...top.reverse()],'ctx');g+=Rc(X(-wl.y0),Y(M.zt+M.ha-z),M.B/s,M.ha/s,'ctx');g+=Tx(X(M.B/2-wl.y0),Y(M.zt+M.ha/2-z)+.8,'балка перекрытия БП (торец)',{size:2})}
  else if(wl.ext&&!wl.top){g+=Rc(X(0),Y(M.H+M.ha),wl.L/s,M.ha/s,'ctx');g+=Tx(X(wl.L/2),Y(M.H+M.ha/2)+.8,'балки чердака БП, шаг '+M.sr,{size:2})}
  ms.filter(m=>m.role==='ИО').forEach(m=>{const L=m.loc;g+=Rc(X(L.u0),Y(L.v1),(L.u1-L.u0)/s,(L.v1-L.v0)/s,'hd')});
  ms.filter(m=>m.loc.kind!=='d'&&m.role!=='ИО').forEach(m=>{const L=m.loc;const cls=m.role==='УТ'?'wb':m.role==='ПР'?'w3':['НО','ВО','ОФ','Р'].includes(m.role)?'w2':'w';
    if(L.kind==='v')g+=Rc(X(L.u-L.bw/2),Y(L.v1),L.bw/s,(L.v1-L.v0)/s,cls);else g+=Rc(X(L.u0),Y(L.v1),(L.u1-L.u0)/s,(L.v1-L.v0)/s,cls);
    if(L.kind==='v'&&L.bw/s>=1.5&&(L.v1-L.v0)/s>12)g+=Tx(X(L.u)+.7,Y((L.v0+L.v1)/2),m.mark,{size:Math.min(1.7,L.bw/s*.95),rot:-90});
    if(m.role==='ПР')g+=Tx(X((L.u0+L.u1)/2),Y((L.v0+L.v1)/2)+.7,m.mark+' ('+m.n+' шт)',{size:Math.min(2,(L.v1-L.v0)/s*.8)});
    if(L.kind==='h'&&['НО','ВО','ОФ'].includes(m.role)&&(L.u1-L.u0)/s>20)g+=Tx(X(L.u0)+6,Y(L.v0)-.4,m.mark,{size:Math.min(1.6,(L.v1-L.v0)/s*.95),a:'start'})});
  ms.filter(m=>m.loc.kind==='d').forEach(m=>{const L=m.loc,dx=L.u1-L.u0,dv=L.v1-L.v0,ln=Math.hypot(dx,dv),nx=-dv/ln*L.bw/2,nv=dx/ln*L.bw/2;
    g+=Pg([[X(L.u0+nx),Y(L.v0+nv)],[X(L.u1+nx),Y(L.v1+nv)],[X(L.u1-nx),Y(L.v1-nv)],[X(L.u0-nx),Y(L.v0-nv)]],'w3');
    g+=Tx(X((L.u0+L.u1)/2)+1.5,Y((L.v0+L.v1)/2),`${m.mark} ${R(Math.atan2(Math.abs(dv),Math.abs(dx))*180/Math.PI)}°`,{size:2,a:'start'})});
  wl.ops.filter(o=>o.ok).forEach(o=>{const xa=X(o.x),xb=X(o.x+o.w),ya=Y(o.sill),yb=Y(o.sill+o.h);g+=Rc(xa,yb,xb-xa,ya-yb,'hd')+Ln(xa,ya,xb,yb,'t')+Ln(xa,yb,xb,ya,'t');
    g+=`<rect x="${f2((xa+xb)/2-9)}" y="${f2((ya+yb)/2-4.2)}" width="18" height="7.6" class="wt"/>`+Tx((xa+xb)/2,(ya+yb)/2-.6,o.mark,{size:2.6,cls:'b'})+Tx((xa+xb)/2,(ya+yb)/2+2.6,`${o.w}×${o.h}`,{size:2.1});
    if(o.type==='window')g+=dimV(Y(0),ya,xa+3,null,o.sill);g+=dimV(ya,yb,xa+3+(o.type==='window'?0:0),null,o.h)});
  const studC=ms.filter(m=>m.loc.kind==='v'&&m.role==='С').map(m=>m.loc.u);
  const opE=wl.ops.filter(o=>o.ok).flatMap(o=>[o.x,o.x+o.w]);
  g+=chainH([0,...opE,wl.L],X,Y(0)+7,Y(0));
  g+=chainH([0,...studC,wl.L],X,Y(0)+15,Y(0));
  g+=dimH(X(0),X(wl.L),Y(0)+23,Y(0),R(wl.L));
  const vv=wl.top?[0,R(wl.ridgeH??(M.zRidge-zb))]:[0,M.t,Hw-(M.np-1)*M.t,Hw];if(!wl.top&&(ctxGable||wl.ext))vv.push(M.H+M.ha);if(ctxGable&&!wl.top)vv.push(R(M.zRidge-M.z0));if(wl.id==='W3'&&!M.gable&&M.Hr)vv.push(R(M.H+M.ha+M.Hr));
  g+=chainV(vv,Y,X(u1)+8,X(Math.min(u1,wl.L)));g+=elev(X(u1)+12,Y(0),elvTxt(zb-M.z0))+(wl.top?'':elev(X(u1)+12,Y(Hw),elvTxt(zb-M.z0+Hw)));
  g+=tableBlock(25,240,200,48,'Элементы стены',MARK_COLS,(()=>{const mp=new Map();ms.forEach(m=>{if(!mp.has(m.mark))mp.set(m.mark,{m,q:0});mp.get(m.mark).q+=m.n});return [...mp.values()].sort((a,c)=>ROLE_ORDER.indexOf(a.m.role)-ROLE_ORDER.indexOf(c.m.role)||a.m.mark.localeCompare(c.m.mark,'ru',{numeric:true})).map(({m,q})=>[m.mark,ROLE[m.role],m.sec.join('×'),fmt(r10(m.L)),q])})());
  g+=Tx(25,233,`Размеры по горизонтали — от начала стены (стрелка на плане). Нижняя цепочка — оси стоек${wl.ext?', шаг от наружного угла':''}.`,{a:'start',size:2.1});
  if(wl.mode){const SM=SHEATH[P.sheathMat]||SHEATH.osb9;g+=Tx(25,229,wl.mode==='braces'?`Жёсткость: врезные укосины ${P.braceB}×${P.braceH} под 45–60°, по 2 гвоздя 4×100 в каждую стойку, по 3 — в обвязки. Анкерных уголков на торец: ${C.H.walls.find(x=>x.w===wl)?.anch||1}.`:`Жёсткость: ${SM.n}${wl.fallback?' (укосины по СНиП не помещаются)':''}, крепёж по краю листа шаг ${P.nailStep}, в поле 300. Анкерных уголков на торец: ${C.H.walls.find(x=>x.w===wl)?.anch||1}.`,{a:'start',size:2.1})}
  return {code,title:wl.name+': развёртка',sub:`L=${R(wl.L)} мм, стойки ${wl.b}×${wl.d}, шаг ${wl.s}${wl.zb!=null?', низ '+elvTxt(zb-M.z0):''}`,scale:s,body:g};
}
function sheetMans(){
  const {A,B,d}=M,mm=30,mT=14,s=fit(A,B,385-2*mm,222-mT-2*mm+8);
  const w=A/s,h=B/s,px0=25+(385-w)/2,py0=10+mT+(222-mT-h)/2,X=x=>px0+x/s,Y=y=>py0+(B-y)/s;
  let g=Tx(25+385/2,16,`План мансарды  М 1:${s}`,{size:3.5,cls:'b'});
  g+=Rc(X(0),Y(B),w,h,'hd');
  g+=Rc(X(d),Y(B-M.y15),(A-2*d)/s,(B-2*M.y15)/s,'ctx');
  M.walls.filter(x=>x.gable).forEach(wl=>{g+=Rc(X(wl.x0-d/2),Y(B),d/s,B/s,'wl');wl.ops.filter(o=>o.ok).forEach(o=>{g+=Rc(X(wl.x0-d/2),Y(o.x+o.w),d/s,o.w/s,'op')+Ln(X(wl.x0),Y(o.x),X(wl.x0),Y(o.x+o.w));g+=Tx(X(wl.x0)+(wl.id==='G4'?1:-1)*(d/2/s+3),Y(o.x+o.w/2),o.mark,{size:2.2,rot:-90})})});
  M.walls.filter(x=>x.knee).forEach(wl=>g+=Rc(X(wl.x0),Y(wl.y0+wl.d/2),wl.L/s,wl.d/s,'wlp'));
  [M.yc,B-M.yc].forEach(y=>g+=Ln(X(d),Y(y),X(A-d),Y(y),'hd'));[M.y15,B-M.y15].forEach(y=>g+=Ln(X(d),Y(y),X(A-d),Y(y),'ax'));
  g+=Tx(X(A/2),Y(B-M.yc)+3.2,`граница потолка, h = ${M.mansH}`,{size:2.1})+Tx(X(A/2),Y(B-M.y15)-1,'h = 1,5 м',{size:2.1})+Tx(X(A/2),Y(B-M.yk)-1.2,`стенка мансарды h = ${M.kneeH}`,{size:2.1});
  g+=Tx(X(A/2),Y(B/2)+1,`Площадь с высотой ≥ 1,5 м: ${fmt(M.mansArea,1)} м²`,{size:3,cls:'b'})+Tx(X(A/2),Y(B/2)+5.5,`Площадь между стенками: ${fmt(M.mansFloor,1)} м²`,{size:2.4});
  g+=chainV([0,M.yk,M.y15,M.yc,B-M.yc,B-M.y15,B-M.yk,B],Y,X(0)-9,X(0))+dimV(Y(0),Y(B),X(0)-17,X(0),B);
  g+=chainH([0,d,A-d,A],X,Y(0)+9,Y(0));
  const og=M.ops.filter(o=>o.ok&&o.wall[0]==='G');if(og.length)g+=chainV([0,...og.filter(o=>o.wall==='G2').flatMap(o=>[o.x,o.x+o.w]),B],Y,X(A)+9,X(A));
  g+=tableBlock(25,240,200,40,'Элементы мансарды',MARK_COLS,markRows(x=>x.grp==='mans'||x.grp==='gable'));
  return {code:'АР-2',title:'План мансарды',sub:`Стенки ${M.kneeH} мм, потолок ${M.mansH} мм, уклон ${M.deg}°`,scale:s,body:g};
}
