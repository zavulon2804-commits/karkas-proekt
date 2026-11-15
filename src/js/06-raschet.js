/* ---------- расчёт ---------- */
function calc(M){
  const P=M.P,l=loads(P),cs=M.cs,out=[];
  const trR=(M.B/2+M.ov)/1000;
  const roofD=(l.gR/cs*1.1+l.S*1.4)*trR, roofN=(l.gR/cs+l.S)*trR;
  const attTrib=(M.attSup!=null?M.La/2:(M.B-M.d)/2)/1000;
  const attD=(l.gA*1.2+l.pA*1.3)*attTrib, attN=(l.gA+l.pA)*attTrib;
  const wallD=l.gW*1.2*M.H/1000, wallN=l.gW*M.H/1000;
  const gabH=M.gable?(M.B/2*M.tn)/2:(M.B*M.tn)/2, gabD=l.gW*1.2*gabH/1000, gabN=l.gW*gabH/1000;
  const fl=l.gF*1.2+l.pF*1.3, fln=l.gF+l.pF;
  const bself=SELF*M.bb*M.hb;
  const supAtt=M.attSup!=null?(l.gA*1.2+l.pA*1.3)*((M.attSup-M.d/2)/2+(M.B-M.d/2-M.attSup)/2)/1000:0;
  const supAttN=M.attSup!=null?(l.gA+l.pA)*((M.attSup-M.d/2)/2+(M.B-M.d/2-M.attSup)/2)/1000:0;
  const roofG=l.gR/cs*trR,attG=l.gA*attTrib,wallG=l.gW*M.H/1000,gabG=l.gW*gabH/1000,supAttG=M.attSup!=null?l.gA*((M.attSup-M.d/2)/2+(M.B-M.d/2-M.attSup)/2)/1000:0;
  M.lines.forEach(L=>{
    let qd=bself*1.1,qn=bself,qg=bself;
    const lj=L.lj??M.Lj,rf=L.wing!=null?0:1;
    if(L.kind==='extX')qg+=l.gF*lj/2000+wallG+rf*(roofG+attG);else if(L.kind==='extY')qg+=l.gF*M.sj/2000+wallG+rf*gabG;
    else{qg+=l.gF*lj/1000;const iw=M.walls.find(w=>!w.ext&&w.ux&&Math.abs(w.y0-L.c)<=300);if(iw){qg+=(iw.bearing?l.gW:.3)*M.H/1000;if(M.attSup!=null&&Math.abs(M.attSup-iw.y0)<1)qg+=supAttG}}
    L.qg=qg;
    if(L.kind==='extX'){qd+=fl*lj/2000+wallD+rf*(roofD+attD);qn+=fln*lj/2000+wallN+rf*(roofN+attN)}
    else if(L.kind==='extY'){qd+=fl*M.sj/2000+wallD+rf*gabD;qn+=fln*M.sj/2000+wallN+rf*gabN}
    else{qd+=fl*lj/1000;qn+=fln*lj/1000;
      const iw=M.walls.find(w=>!w.ext&&w.ux&&Math.abs(w.y0-L.c)<=300);
      if(iw){const g=iw.bearing?l.gW:.3;qd+=g*1.2*M.H/1000;qn+=g*M.H/1000;if(M.attSup!=null&&Math.abs(M.attSup-iw.y0)<1){qd+=supAtt;qn+=supAttN}L.wallOver=iw.id}}
    if(L.wing!=null){const wr=(M.wingRoofs||[]).find(r=>r.k.i===L.wing);if(wr){const k=wr.k,trR=(k.Wd/2+M.ov)/1000,at=(k.Wd-M.d)/2/1000,gh=k.Wd/2*M.tn/2;
      if(L.bear){qd+=(l.gR/cs*1.1+l.S*1.4)*trR+(l.gA*1.2+l.pA*1.3)*at;qn+=(l.gR/cs+l.S)*trR+(l.gA+l.pA)*at;L.qg+=l.gR/cs*trR+l.gA*at}
      if(L.gab){qd+=l.gW*1.2*gh/1000;qn+=l.gW*gh/1000;L.qg+=l.gW*gh/1000}}}
    L.qd=qd;L.qn=qn;
  });
  const pc=pileCap(P,M),t=M.pileT,selfP=t.kind==='screw'||t.kind==='manual'?.35:(t.kind==='driven'?(t.a/1000)**2:Math.PI*(t.d/1000)**2/4)*M.pileLen/1000*25;
  const react=new Map(M.piles.map(p=>[p.key,selfP*1.1])),reactG=new Map(M.piles.map(p=>[p.key,selfP]));
  M.lines.forEach(L=>{for(let i=0;i<L.pts.length-1;i++){const seg=(L.pts[i+1]-L.pts[i])/1000/2;
    [L.pts[i],L.pts[i+1]].forEach(p=>{const k=L.axis==='x'?R(p)+'_'+R(L.c):R(L.c)+'_'+R(p);react.set(k,(react.get(k)||0)+L.qd*seg);reactG.set(k,(reactG.get(k)||0)+L.qg*seg)})}});
  M.piles.forEach(p=>{p.N=react.get(p.key)||0;p.Ng=reactG.get(p.key)||0});
  const Rmax=Math.max(...M.piles.map(p=>p.N)), Rsum=M.piles.reduce((s,p)=>s+p.N,0);
  const soil=SOILS[P.soil]||SOILS.loam;
  const Fd=pc.Nperm;
  const pct=u=>R(u*100)+' %';
  const push=(id,title,sec,meta,u,rows,extraOk=true)=>out.push({id,title,sec,meta,u,ok:u<=1&&extraOk,rows});

  const rself=SELF*M.br*M.hr,rpsi=l.wR>0?.9:1,qvR=(l.gR/cs*1.1+l.S*1.4*rpsi)*M.sr/1000+rself*1.1/cs,qvRn=(l.gR/cs+l.S)*M.sr/1000+rself/cs;
  const Pk=M.mans&&M.mansOk?qvR*(M.L1+M.L2)/2*1.1:0,Pkn=M.mans&&M.mansOk?qvRn*(M.L1+M.L2)/2*1.1:0;
  // стропила
  {const b=M.br,h=M.hr,s=M.sr/1000,Lh=M.Lh,Ls=Lh/cs,self=SELF*b*h,psi=l.wR>0?.9:1;
   const qv=(l.gR/cs*1.1+l.S*1.4*psi)*s+self*1.1/cs, qw=l.wR*1.4*psi*s;
   const Mm=qv*Lh*Lh/8+qw*Ls*Ls/8, W=b*h*h/6, I=b*h**3/12, sig=Mm/W;
   const qp=(l.gR/cs+l.S)*cs*cs*s+l.wR*s+self*cs, f=5*qp*Ls**4/(384*E_MOD*I), flim=Ls/200;
   push('rafter','Стропильная нога',`${b}×${h}`,`шаг ${M.sr} мм · пролёт ${fmt(Lh/1000,2)} м по горизонтали${M.mans&&M.mansOk?' (опора на стенку мансарды)':M.purlin?' (опора на коньковый прогон)':P.strut?' (со стойкой)':''}`,Math.max(sig/R_I,f/flim),[
     ['Снег на кровлю S, кПа',fmt(l.S,2)+(l.mu<1?` (μ=${fmt(l.mu,2)})`:'')],['Ветер на скат, кПа',fmt(l.wR,3)],
     ['Нагрузка расч., кН/м',fmt(qv,2)],['Момент M, кН·м',fmt(Mm/1e6,2)],['σ / R, МПа',fmt(sig,1)+' / '+R_I],['Прогиб f / fпред, мм',fmt(f,1)+' / '+fmt(flim,1)]])}
  // балки чердака
  {const b=M.ba,h=M.ha,s=M.sr/1000,L=M.La,self=SELF*b*h;
   const qd=(l.gA*1.2+l.pA*1.3)*s+self*1.1, qn=(l.gA+l.pA)*s+self, c=bend({b,h,L,qd,qn,lim:M.mans?250:200});
   const rows=[['Нагрузка расч., кН/м',fmt(qd,2)]];
   if(Pk>0){const a=Math.min(M.yk-M.d/2,L-1),bb=Math.min(a,L-a);c.M+=Pk*a*(L-a)/L;c.sig=c.M/c.W;c.f+=Pkn*bb*Math.pow(L*L-bb*bb,1.5)/(9*Math.sqrt(3)*L*E_MOD*c.I);c.uS=c.sig/R_I;c.uF=c.f/c.fl;c.u=Math.max(c.uS,c.uF);rows.push(['Сосредоточенная от стенки мансарды, кН',fmt(Pk/1000,2)])}
   rows.push(['Момент M, кН·м',fmt(c.M/1e6,2)],['σ / R, МПа',fmt(c.sig,1)+' / '+R_I],['Прогиб f / fпред, мм',fmt(c.f,1)+' / '+fmt(c.fl,1)]);
   if(M.purlin&&!M.pur.onWall){const Lh=M.Lh,qP=(l.gR/cs*1.1+l.S*1.4)*Lh/1000+SELF*M.pur.pb*M.pur.ph*1.1,qPn=(l.gR/cs+l.S)*Lh/1000+SELF*M.pur.pb*M.pur.ph,Pp=qP*M.sr,Ppn=qPn*M.sr,a=Math.min(M.B/2-M.d/2,L-1),bb=Math.min(a,L-a);
     c.M+=Pp*a*(L-a)/L;c.sig=c.M/c.W;c.f+=Ppn*bb*Math.pow(L*L-bb*bb,1.5)/(9*Math.sqrt(3)*L*E_MOD*c.I);c.uS=c.sig/R_I;c.uF=c.f/c.fl;c.u=Math.max(c.uS,c.uF);rows.push(['Сосредоточенная от стоек прогона (через лежень), кН',fmt(Pp/1000,2)]);rows.forEach(r=>{if(r[0].startsWith('Момент'))r[1]=fmt(c.M/1e6,2);if(r[0].startsWith('σ'))r[1]=fmt(c.sig,1)+' / '+R_I;if(r[0].startsWith('Прогиб'))r[1]=fmt(c.f,1)+' / '+fmt(c.fl,1)})}
   push('attic',M.mans?'Балка перекрытия под мансардой':'Балка перекрытия чердака',`${b}×${h}`,`шаг ${M.sr} мм · пролёт ${fmt(L/1000,2)} м${M.attSup!=null?' (опора на перегородку)':''}`,c.u,rows)}
  /* опора кровли: коньковый прогон, стойки, врубка и смятие (СП 64.13330) */
  const qRf=(l.gR/cs*1.1+l.S*1.4),qRn=(l.gR/cs+l.S),sR=M.sr/1000,Rcm90=3;
  if(M.purlin){const pu=M.pur,Lh=M.Lh,qd=qRf*Lh/1000+SELF*pu.pb*pu.ph*1.1,qn=qRn*Lh/1000+SELF*pu.pb*pu.ph,cont=pu.xs.length>3,Le=pu.aS>=300?Math.max(pu.span-2*pu.aS,.4*pu.span):pu.span;
    const c=bend({b:pu.pb,h:pu.ph,L:Le,qd,qn,lim:200,cM:cont?1/10:1/8,cF:cont?2.65/384:5/384});
    push('purlin','Коньковый прогон',`${pu.pb}×${pu.ph}`,`пролёт ${pu.aS>=300?`между подкосами ${fmt(Le/1000,2)} м (стойки через ${fmt(pu.span/1000,2)} м)`:`между стойками ${fmt(pu.span/1000,2)} м`} · ${cont?'неразрезной':'однопролётный'} · грузовая ширина ${fmt(Lh/1000,2)} м`,c.u,[['Нагрузка расч., кН/м',fmt(qd,2)],['Момент M, кН·м',fmt(c.M/1e6,2)],['σ / R, МПа',fmt(c.sig,1)+' / '+R_I],['Прогиб f / fпред (L/200), мм',fmt(c.f,1)+' / '+fmt(c.fl,1)]]);
    const N=qd*pu.span*(cont?1.1:1),bm=Math.min(pu.qb,pu.qh),Ar=pu.qb*pu.qh,lam=pu.Lpost/(.289*bm),phi=lam<=70?1-.8*(lam/100)**2:3000/lam**2;
    push('post','Стойка под коньковый прогон',`${pu.qb}×${pu.qh}`,`высота ${R(pu.Lpost)} мм · шаг до ${fmt(pu.span/1000,2)} м · ${pu.onWall?'на лежне по несущей перегородке':'на лежне по балкам перекрытия'}`,N/(phi*Ar*R_C),[['Сжатие N, кН',fmt(N/1000,2)],['Гибкость λ (пред. 120)',fmt(lam,0)],['Коэфф. продольного изгиба φ',fmt(phi,2)]],lam<=120);
    out.at(-1).note='СП 64.13330: N/(φ·A·Rс) ≤ 1; λ ≤ 120 для стоек.';
    if(pu.aS>=300){const Ls=Math.hypot(pu.aS,pu.Lpost),sa=pu.Lpost/Ls,Ns=qd*pu.aS/sa,lamS=Ls/(.289*bm),phS=lamS<=70?1-.8*(lamS/100)**2:3000/lamS**2;
      push('strut_p','Подкос к коньковому прогону',`${pu.qb}×${pu.qh}`,`длина ${R(Ls)} мм · угол ${R(Math.atan2(pu.Lpost,pu.aS)*180/Math.PI)}° · вынос ${R(pu.aS)} мм`,Ns/(phS*Ar*R_C),[['Сжатие N, кН',fmt(Ns/1000,2)],['Гибкость λ (пред. 150 для связей)',fmt(lamS,0)],['φ',fmt(phS,2)]],lamS<=150);
      out.at(-1).note='Подкос врубается в стойку и прогон, крепится скобами; уменьшает пролёт прогона. СП 64.13330: для элементов связей λ ≤ 150.'}
    push('notch','Врубка стропила на прогоне',`глубина ${R(pu.notch)} мм`,`стропило ${M.br}×${M.hr} опирается на прогон шириной ${pu.pb} мм при уклоне ${M.deg}°`,pu.notch/(M.hr/3),[['Глубина врубки, мм',R(pu.notch)],['Предел по СП 64.13330 (1/3 h), мм',R(M.hr/3)],['Рекомендуемый предел (1/4 h), мм',R(M.hr/4)]]);
    out.at(-1).note='СП 64.13330: глубина врубки в опорных узлах — не более 1/3 высоты сечения. Если врубка глубже — подбалка (кобылка) или опорный брусок вместо врубки.';
    const R1=qRf*sR*Lh/1000/2*1000,Ab=M.br*pu.pb/2,sg=R1/Ab;
    push('bearing','Смятие стропила на прогоне',`площадка ${M.br}×${R(pu.pb/2)}`,`опорная реакция стропила ${fmt(R1/1000,2)} кН`,sg/Rcm90,[['Напряжение смятия, МПа',fmt(sg,2)],['Rсм.90 поперёк волокон, МПа',Rcm90]]);
    out.at(-1).note='СП 64.13330: смятие поперёк волокон в опорных частях и узловых примыканиях, Rсм.90 = 3 МПа.'}
  else if(M.gable&&!M.mans){/* висячая: коньковый узел и нижний узел стропило — затяжка */
    const B=M.B/1000,tn=M.tn,Hn=qRf*sR*B/(4*tn),d4=.4,Tn=c=>Math.min(.35*c*d4,Math.min(2.5*d4*d4+.01*c*c,4*d4*d4)),Tt=Tn(M.br/10),nT=Math.max(4,Math.ceil(Hn/Tt));
    push('node_tie','Нижний узел: стропило — затяжка (балка перекрытия)',`${nT} гвоздей 4×100`,`распор от пары стропил ${fmt(Hn,2)} кН`,nT/12,[['Распор H = q·s·B/(4·tg α), кН',fmt(Hn,2)],['Несущая способность гвоздя 4×100, кН',fmt(Tt,2)],['Нужно гвоздей в узел',nT],['Допустимо в узле без болтов',12]]);
    out.at(-1).note='СП 64.13330: T = min(0,35·c·d; 2,5·d² + 0,01·a² ≤ 4·d²). При большем числе гвоздей — болт М12 с шайбами или металлическая пластина.';
    const V=l.S*1.4*sR*B/8,Tr=Tn(2.5),nR=Math.max(4,Math.ceil(V/(2*Tr)));
    push('node_ridge','Коньковый узел: накладки на стропилах',`накладки 25×100, ${nR} гв. на сторону`,`поперечная сила при одностороннем снеге ${fmt(V,2)} кН`,nR/10,[['Сила в узле V = S·s·B/8, кН',fmt(V,2)],['Гвоздь через накладку 25 мм, кН',fmt(Tr,2)],['Гвоздей в каждое стропило (накладки с двух сторон)',nR]]);
    out.at(-1).note='Пару стропил на коньке соединяют накладками из доски 25×100 с двух сторон на гвоздях или болтом М12. Коньковая доска — не несущий элемент.'}
  /* крылья: ендовная балка и балки перекрытия крыла */
  (M.wingRoofs||[]).forEach(r=>{const k=r.k,iw=k.i+1;
    const Lw=k.Wd-M.d;if(Lw>M.La+1){const b=M.ba,h=M.ha,qd=(l.gA*1.2+l.pA*1.3)*sR+SELF*b*h*1.1,qn=(l.gA+l.pA)*sR+SELF*b*h,c=bend({b,h,L:Lw,qd,qn,lim:200});
      push('attic_w'+iw,`Балка перекрытия крыла ${iw}`,`${b}×${h}`,`пролёт ${fmt(Lw/1000,2)} м`,c.u,[['Нагрузка расч., кН/м',fmt(qd,2)],['σ / R, МПа',fmt(c.sig,1)+' / '+R_I],['Прогиб f / fпред, мм',fmt(c.f,1)+' / '+fmt(c.fl,1)]])}
    if(!r.W2){const h2=k.Wd/2,Lp=h2*Math.SQRT2,L3=Math.hypot(Lp,h2*M.tn),Wd=qRf*1e-3*h2*h2/2,Wn=qRn*1e-3*h2*h2/2,b2=2*M.br,h=M.hr;
      const Mm=Wd*Lp/8,Ws=b2*h*h/6,I=b2*h**3/12,sig=Mm/Ws,f=5*Wn*L3**3/(384*E_MOD*I),fl=L3/200;
      push('valley'+iw,`Ендовная балка крыла ${iw}`,`2×${M.br}×${h}`,`длина ${fmt(L3/1000,2)} м · собирает нагрузку с нарожников двух скатов`,Math.max(sig/R_I,f/fl),[['Нагрузка на балку (2 треугольника), кН',fmt(Wd/1000,2)],['Момент M, кН·м',fmt(Mm/1e6,2)],['σ / R, МПа',fmt(sig,1)+' / '+R_I],['Прогиб f / fпред (L/200), мм',fmt(f,1)+' / '+fmt(fl,1)]]);
      out.at(-1).note='Упрощённо: ендовная балка — однопролётная, от угла стен до конька крыла, нагрузка с нарожников обоих скатов. Верхний конец опирается на ригель между стропилами дома.'}});
  if(Pk>0){const b=M.b,d=M.kneeD,Hs=M.kneeH-M.np*M.t,Ar=b*d,lam=Hs/(.289*d),phi=lam<=70?1-.8*(lam/100)**2:3000/lam**2,u=Pk/(phi*Ar*R_C);
   push('knee','Стойка стенки мансарды',`${b}×${d}`,`под каждым стропилом, шаг ${M.sr} мм · высота ${M.kneeH} мм`,u,[['Сжатие N, кН',fmt(Pk/1000,2)],['Гибкость λ (пред. 120)',fmt(lam,0)],['φ',fmt(phi,2)]],lam<=120)}
  // лаги пола
  {const c=joistCheck(P,M.Lj);
   push('joist','Лага пола',`${M.bj}×${M.hj}`,`шаг ${M.sj} мм · пролёт ${fmt(M.Lj/1000,2)} м · промежуточных балок: ${M.nMid}`,c.u,[
     ['Нагрузка расч., кН/м',fmt(c.qd,2)],['Момент M, кН·м',fmt(c.M/1e6,2)],['σ / R, МПа',fmt(c.sig,1)+' / '+R_I],['Прогиб f / fпред (L/250), мм',fmt(c.f,1)+' / '+fmt(c.fl,1)]])}
  // балки ростверка
  [['extX','Балка ростверка под стенами 1 и 3'],['extY','Балка ростверка под стенами 2 и 4'],['mid','Промежуточная балка ростверка']].forEach(([k,title])=>{
    const ls=M.lines.filter(x=>x.kind===k); if(!ls.length) return;
    const L0=ls.reduce((a,c)=>c.qd>a.qd?c:a,ls[0]); const cont=L0.pts.length>3;
    const c=bend({b:M.bb,h:M.hb,L:L0.span,qd:L0.qd,qn:L0.qn,lim:200,cM:cont?1/10:1/8,cF:cont?2.65/384:5/384});
    push('beam_'+k,title,`${M.bb}×${M.hb}${M.ply>1?` (${M.ply}×${R(M.bb/M.ply)}×${M.hb})`:''}`,`шаг свай ${fmt(L0.span/1000,2)} м · ${cont?'неразрезная':'однопролётная'}`,c.u,[
      ['Погонная нагрузка расч., кН/м',fmt(L0.qd,2)],['Момент M, кН·м',fmt(c.M/1e6,2)],['σ / R, МПа',fmt(c.sig,1)+' / '+R_I],['Прогиб f / fпред, мм',fmt(c.f,1)+' / '+fmt(c.fl,1)]]);
  });
  // стойки наружных стен
  {const b=M.b,d=M.d,s=+P.studS/1000,Hs=M.H-M.np*M.t,N=(roofD+attD+wallD/2)*s*1000,Ar=b*d,i=.289*d,lam=Hs/i,phi=lam<=70?1-.8*(lam/100)**2:3000/lam**2;
   const qw=l.wW*1.4*s,Mw=qw*Hs*Hs/8,W=b*d*d/6,u=N/(phi*Ar*R_C)+Mw/(W*R_I);
   push('stud','Стойка несущей стены (1 и 3)',`${b}×${d}`,`шаг ${P.studS} мм · длина ${R(Hs)} мм`,u,[
     ['Сжатие N, кН',fmt(N/1000,2)],['Гибкость λ (пред. 120)',fmt(lam,0)],['Коэфф. продольного изгиба φ',fmt(phi,2)],['Ветер на стену, кПа',fmt(l.wW,3)],['Использование',pct(u)]],lam<=120)}
  // стойки несущей перегородки
  if(M.attSup!=null){const iw=M.walls.find(w=>!w.ext&&w.ux&&Math.abs(w.y0-M.attSup)<1);
    if(iw){const b=M.b,d=iw.d,s=iw.s/1000,Hs=M.H-M.np*M.t,N=(supAtt+l.gW*1.2*M.H/2000)*s*1000,Ar=b*d,lam=Hs/(.289*d),phi=lam<=70?1-.8*(lam/100)**2:3000/lam**2,u=N/(phi*Ar*R_C);
      push('stud_int','Стойка несущей перегородки '+iw.id,`${b}×${d}`,`шаг ${iw.s} мм · несёт балки чердака`,u,[['Сжатие N, кН',fmt(N/1000,2)],['Гибкость λ (пред. 120)',fmt(lam,0)],['φ',fmt(phi,2)]],lam<=120)}}
  // перемычки
  {let op=null;M.ops.forEach(o=>{if(!o.ok)return;const w=M.walls.find(x=>x.id===o.wall);if(w&&w.bearing&&(!op||o.w>op.w))op=o});
   if(op){const w=M.walls.find(x=>x.id===op.wall),L=op.w+M.b,lp=+P.lintelPly,lH=+P.lintelH;
     const qd=(w.ext?roofD+attD:supAtt)+l.gW*1.2*.4, qn=(w.ext?roofN+attN:supAttN)+l.gW*.4, c=bend({b:M.b*lp,h:lH,L,qd,qn,lim:200});
     push('lintel','Перемычка над проёмом',`${lp}×${M.b}×${lH}`,`самый широкий проём в несущей стене: ${op.w} мм (${w.name})`,c.u,[
       ['Нагрузка расч., кН/м',fmt(qd,2)],['Момент M, кН·м',fmt(c.M/1e6,2)],['σ / R, МПа',fmt(c.sig,1)+' / '+R_I],['Прогиб f / fпред, мм',fmt(c.f,1)+' / '+fmt(c.fl,1)]])}}
  // сваи
  {const u=Fd>0?Rmax/Fd:Infinity,rows=[['Заглубление в грунт, м',fmt(pc.h,2)]];
   if(pc.R!=null)rows.push(['R под остриём, кПа',fmt(pc.R,0)],['Площадь опирания A, м²',fmt(pc.A,4)],['Сопротивление под остриём, кН',fmt(pc.tip,1)],['Трение по боковой поверхности, кН',fmt(pc.fr,1)],['Несущая способность Fd, кН',fmt(pc.Fd,1)]);
   rows.push(['Допускаемая нагрузка Fd/γk (γk=1,4), кН',Fd>0?fmt(Fd,1):'0 — грунт непригоден'],['Макс. нагрузка на сваю, кН',fmt(Rmax,1)],['Вес дома с нагрузками, т',fmt(Rsum/9.81,1)]);
   push('pile','Свая: несущая способность',M.pileT.short,`${M.piles.length} шт · L=${M.pileLen} мм · ${soil.name.toLowerCase()}`,u,rows);out.at(-1).note=pc.method}
  if(soil.tau>0){const worst=M.piles.reduce((a,p)=>(!a||p.Ng<a.Ng)?p:a,null),net=pc.Fheave-.9*worst.Ng,u=net<=0?0:(pc.anchor>0?net/pc.anchor:Infinity);
   push('heave','Свая: морозное пучение',M.pileT.short,`${soil.heave} грунт · промерзание ${P.freeze} мм · самая лёгкая свая №${worst.no}`,u,[
     ['Касательные силы пучения τ, кПа',soil.tau],['Сила выдёргивания τ·u·df, кН',fmt(pc.Fheave,1)],['Постоянная нагрузка ×0,9, кН',fmt(.9*worst.Ng,1)],['Анкеровка ниже промерзания, кН',fmt(pc.anchor,1)]]);out.at(-1).note='СП 22.13330: τ·u·df − 0,9·N ≤ анкеровка сваи ниже зоны промерзания'}
  /* ---- горизонтальные нагрузки: ветер ---- */
  const H=hCalc(M,l,pc,{roofG,attG,wallG,gabG});
  H.checks.forEach(c=>out.push(c));
  return {checks:out,l,roofD,attD,wallD,Fd,Rmax,Rsum,supAtt,pc,H,V:vSummary(M,l)};
}

function hCalc(M,l,pc,g){
  const P=M.P,w0k=l.w0*l.k,gf=1.4,above=M.zRidge-M.zt,out=[];
  const cW=1.3; // наветренная + заветренная сторона (СП 20.13330, прил. В)
  const AX=M.AX||M.A,BY=M.BY||M.B,Fy=w0k*gf*(cW*AX*M.H/2+.8*(M.A+2*M.og)*above)/1e6, Fx=w0k*gf*cW*(BY*M.H/2+M.B*above/2)/1e6;
  const hy=((M.A*M.H/2)*(M.z0+.75*M.H)+(M.A*above)*(M.zt+above/3))/((M.A*M.H/2)+(M.A*above))-M.H0;
  const hx=((M.B*M.H/2)*(M.z0+.75*M.H)+(M.B*above/2)*(M.zt+above/3))/((M.B*M.H/2)+(M.B*above/2))-M.H0;
  const walls=M.rackWalls.map(w=>({w,...wallRack(M,w)}));
  const wn=f=>M.rackWalls.filter(f).map(w=>w.id.slice(1)).join(', '),dir=[['rack_y','Жёсткость стен: ветер на фасад',Fy,w=>!!w.uy,'стены '+wn(w=>!!w.uy)],['rack_x','Жёсткость стен: ветер на фронтон',Fx,w=>!!w.ux,'стены '+wn(w=>!!w.ux)]];
  dir.forEach(([id,title,F,ids,nm])=>{const ws=walls.filter(x=>ids(x.w)),cap=ws.reduce((s,x)=>s+x.cap,0);
    ws.forEach(x=>{x.V=cap>0?F*x.cap/cap:F/ws.length;const L=x.w.L/1000,Hm=M.H/1000,gl=(x.w.bearing?g.wallG+g.roofG+g.attG:g.wallG+g.gabG);
      x.T=x.V*Hm/L-.9*gl*L/2;x.anch=Math.max(1,Math.ceil(Math.max(0,x.T)/T_ANCHOR));x.v=x.V/L;x.nail=Math.min(600,Math.max(100,Math.floor(.65/Math.max(x.v,.01)*1000/50)*50))});
    out.push({id,h:true,title,sec:ws.map(x=>x.w.mode==='braces'?'укосины':'обшивка').join(' / '),meta:`ветер ${fmt(F,1)} кН воспринимают ${nm}`,u:cap>0?F/cap:Infinity,ok:cap>0&&F<=cap,
      rows:[['Ветровая сила F (расч.), кН',fmt(F,2)],...ws.map(x=>[`${x.w.name}: ${x.desc}`,fmt(x.cap,1)+' кН']),['Несущая способность всего, кН',fmt(cap,1)],['Отрыв торца стены, кН',fmt(Math.max(0,...ws.map(x=>x.T)),1)]],
      note:'Ветер на наветренную и заветренную стороны (c = 0,8 + 0,5), γf = 1,4. Перекрытие работает жёстким диском.'});
  });
  // опрокидывание дома и выдёргивание свай
  const line=(axis,c)=>M.piles.filter(p=>Math.abs((axis==='x'?p.y:p.x)-c)<1);
  const ov=[[Fy,hy,line('x',M.bb/2),(M.B-M.bb)/1000],[Fx,hx,line('y',M.bb/2),(M.A-M.bb)/1000]].map(([F,hc,ps,lev])=>{const dN=F*hc/1000/lev/Math.max(1,ps.length),gmin=Math.min(...ps.map(p=>p.Ng));return {F,hc,dN,up:dN-.9*gmin,gmin}});
  const worst=ov.reduce((a,c)=>c.up>a.up?c:a,ov[0]),uo=worst.up<=0?0:(pc.anchor>0?worst.up/pc.anchor:Infinity);
  out.push({id:'overturn',h:true,title:'Опрокидывание от ветра: сваи',sec:M.pileT.short,meta:`момент ${fmt(worst.F*worst.hc/1000,1)} кН·м на плече ${fmt(worst.hc/1000,2)} м`,u:uo,ok:uo<=1,
    rows:[['Добавка на крайнюю сваю от момента, кН',fmt(worst.dN,1)],['Постоянная нагрузка на неё ×0,9, кН',fmt(.9*worst.gmin,1)],['Выдёргивающая сила, кН',fmt(Math.max(0,worst.up),1)],['Анкеровка сваи, кН',fmt(pc.anchor,1)],['Горизонтальная сила на сваю, кН',fmt(Math.max(Fx,Fy)/M.piles.length,2)]]});
  // отрыв кровли ветром
  const up=(w0k*.6*gf-.9*l.gR)*M.sr/1000*M.Ls/1000;
  out.push({id:'rafter_up',h:true,title:'Отрыв стропил ветром',sec:'2 крепления на узел',meta:`отсос на скате c = −0,6 · шаг ${M.sr} мм`,u:up<=0?0:up/(2*T_RAFTER_FIX),ok:up<=2*T_RAFTER_FIX,
    rows:[['Отрывающая сила на стропило, кН',fmt(Math.max(0,up),2)],['Несущая способность уголка или скобы, кН',fmt(T_RAFTER_FIX,1)],['Нужно креплений на узел',Math.max(2,Math.ceil(Math.max(0,up)/T_RAFTER_FIX))]],
    note:'Стропило крепят к обвязке уголком и скобой (или скруткой к стойке). Значения креплений — типовые, сверяйте с паспортом изделия.'});
  if(M.purlin){const ur=Math.max(0,up)/2,nr=Math.max(2,Math.ceil(ur/T_RAFTER_FIX));
    out.push({id:'ridge_fix',h:true,title:'Крепление стропил к коньковому прогону',sec:`${nr} крепления на стропило`,meta:'отрыв ветром в верхнем узле',u:ur/(2*T_RAFTER_FIX),ok:ur<=2*T_RAFTER_FIX,
      rows:[['Отрывающая сила в верхнем узле, кН',fmt(ur,2)],['Несущая способность скобы или уголка, кН',fmt(T_RAFTER_FIX,1)],['Креплений на стропило',nr]],
      note:'Каждое стропило: врубка на прогон, 2 гвоздя 4×100 наискось и скоба или уголок; пару стропил над прогоном стягивают накладками 25×100.'})}
  return {Fx,Fy,hx,hy,walls,checks:out,ov};
}
function vSummary(M,l){
  const A=M.A/1000,B=M.B/1000,FA=A*B+(M.wings||[]).reduce((t,k)=>t+k.area,0),roofA=M.roofArea,plan=(M.A+2*M.og)*(M.B+2*M.ov)/1e6,wallA=(M.extPerim||2*(M.A+M.B))/1000*M.H/1000+M.walls.filter(w=>!w.ext&&w.zb==null).reduce((s,w)=>s+w.L/1000*M.H/1000,0);
  const rows=[['Кровля: покрытие, обрешётка, стропила',l.gR*roofA,1.1],['Снег',l.S*plan,1.4],[M.mans?'Перекрытие и мансарда: вес':'Чердачное перекрытие: вес',l.gA*A*B,1.2],[M.mans?'Мансарда: полезная':'Чердак: полезная',l.pA*A*B,1.3],
    ['Стены и перегородки',l.gW*wallA,1.2],['Пол первого этажа: вес',l.gF*FA,1.2],['Пол: полезная',l.pF*FA,1.3]];
  const grill=M.mem.filter(m=>m.grp==='grill').reduce((s,m)=>s+SELF*m.sec[0]*m.sec[1]*m.L*m.n/1000,0);
  rows.push(['Ростверк',grill,1.1]);
  return rows.map(([n,v,k])=>({n,norm:v,des:v*k}));
}
const PICK={
};
function getPicks(id){
  const fr=f=>frameRows(f),bm=()=>P.beamType==='pack'?[2,3,4].flatMap(n=>fr(r=>r.b>=40&&r.h>=145).map(r=>({packB:r.b,packH:r.h,beamPly:n,_a:n*r.b*r.h*r.h}))).sort((a,c)=>a._a-c._a).map(({_a,...x})=>x):dbRows('beam').map(r=>({beamB:r.b,beamH:r.h}));
  const hs=(f)=>fr(r=>r.b===+P.studB&&f(r)).map(r=>r.h);
  switch(id){
    case 'rafter':return fr(r=>r.b>=40&&r.h>=120).map(r=>({rafterB:r.b,rafterH:r.h}));
    case 'attic':return fr(r=>r.b>=40&&r.h>=120).map(r=>({attB:r.b,attH:r.h}));
    case 'joist':return fr(r=>r.b>=40&&r.h>=120).map(r=>({joistB:r.b,joistH:r.h}));
    case 'beam_extX':case 'beam_extY':case 'beam_mid':return bm();
    case 'stud':{const rs=fr(r=>r.b>=40&&r.h>=95);return [...rs.map(r=>({studB:r.b,studH:r.h})),...rs.map(r=>({studB:r.b,studH:r.h,studS:500}))]}
    case 'knee':return hs(r=>r.h>=70).map(h=>({kneeD:h}));
    case 'stud_int':return [...hs(r=>r.h>=70).map(h=>({partH:h})),...hs(r=>r.h>=70).map(h=>({partH:h,partS:400}))];
    case 'lintel':return [2,3].flatMap(n=>hs(r=>r.h>=120).map(h=>({lintelPly:n,lintelH:h,_a:n*h*h}))).sort((a,c)=>a._a-c._a).map(({_a,...x})=>x);
    case 'rack_x':case 'rack_y':return [{nailStep:100},{bracing:'sheathing'},{bracing:'sheathing',nailStep:100},{bracing:'sheathing',sheathMat:'osb12'},{bracing:'sheathing',sheathMat:'osb12',nailStep:100}].filter(x=>!(x.bracing&&P.bracing==='sheathing'&&!x.sheathMat&&!x.nailStep));
    case 'overturn':return pileCands('heave');
    case 'purlin':case 'bearing':return dbRows('beam').filter(r=>r.b>=+P.purB||id==='purlin').map(r=>({purB:r.b,purH:r.h}));
    case 'post':return dbRows('beam').map(r=>({postB:r.b,postH:r.h}));
    case 'notch':return [...dbRows('beam').filter(r=>r.b<+P.purB).map(r=>({purB:r.b,purH:r.h})),...fr(r=>r.b>=40&&r.h>+P.rafterH).map(r=>({rafterB:r.b,rafterH:r.h}))];
    case 'pile':case 'heave':return pileCands(id);
  }
  return null;
}
const patchText=p=>Object.entries(p).map(([k,v])=>({rafterB:'стропило',attB:'балка чердака',joistB:'лага',beamB:'брус ростверка',studB:'стойка',lintelPly:'перемычка',pile:'свая',pileMaxS:'шаг свай',studS:'шаг стоек',partH:'стойка перегородки',partS:'шаг стоек перегородки'}[k]?k+'='+v:'')).join('');
function pileDesc(p){return [p.pile?PILES[p.pile].name:'',p.pileLen==='auto'?'длина — автоподбор':p.pileLen?'длина '+p.pileLen+' мм':'',p.pileMaxS?'шаг свай до '+p.pileMaxS+' мм':''].filter(Boolean).join(', ')}
const bdesc=p=>p.packB?`ростверк: пакет ${p.beamPly} × ${p.packB}×${p.packH}`:`брус ростверка ${p.beamB}×${p.beamH}`;
const rdesc=p=>[p.bracing==='sheathing'?'плитная обшивка вместо укосин':'',p.sheathMat?SHEATH[p.sheathMat].n:'',p.nailStep?`гвозди обшивки шаг ${p.nailStep}`:''].filter(Boolean).join(', ');
function describePatch(id,p){
  const m={rafter:()=>`стропило ${p.rafterB}×${p.rafterH}`,attic:()=>`балка чердака ${p.attB}×${p.attH}`,joist:()=>`лага ${p.joistB}×${p.joistH}`,
    beam_extX:()=>bdesc(p),beam_extY:()=>bdesc(p),beam_mid:()=>bdesc(p),rack_x:()=>rdesc(p),rack_y:()=>rdesc(p),overturn:()=>pileDesc(p),
    purlin:()=>`коньковый прогон ${p.purB}×${p.purH}`,bearing:()=>`коньковый прогон ${p.purB}×${p.purH}`,post:()=>`стойка под прогон ${p.postB}×${p.postH}`,notch:()=>p.purB?`прогон ${p.purB}×${p.purH}`:`стропило ${p.rafterB}×${p.rafterH}`,
    stud:()=>`стойка ${p.studB}×${p.studH}${p.studS?`, шаг ${p.studS}`:''}`,stud_int:()=>`стойка перегородки ${P.studB}×${p.partH}${p.partS?`, шаг ${p.partS}`:''}`,
    lintel:()=>`перемычка ${p.lintelPly}×${P.studB}×${p.lintelH}`,knee:()=>`стойка стенки мансарды ${P.studB}×${p.kneeD}`,pile:()=>pileDesc(p),heave:()=>pileDesc(p)};
  return (m[id]||(()=>JSON.stringify(p)))();
}
function runMapFix(msgSel){const ch=mapToDb(),fx=autoFix();renderSide();rebuild();const m=msgSel&&$(msgSel);const t=[ch.length?'Сечения заменены: '+ch.join('; '):'',fx.length?'По расчёту: '+fx.join('; '):''].filter(Boolean).join('. ')||'Все сечения уже есть в базе и проходят расчёт.';if(m)m.textContent=t;return t}
function autoFix(maxIt=8){
  const done=[];
  for(let it=0;it<maxIt;it++){const {M:M2,C:C2}=buildFull(P);M=M2;C=C2;const bad=C2.checks.filter(c=>!c.ok);if(!bad.length)break;
    let applied=false;for(const c of bad){const p=pickFor(c.id);if(p){Object.assign(P,p);done.push(describePatch(c.id,p));applied=true;break}}
    if(!applied)break}
  return done;
}
function pileCands(id){
  const kind=(PILES[P.pile]||PILES.p108).kind,same=Object.keys(PILES).filter(k=>PILES[k].kind===kind),out=[];
  if(P.pileLen!=='auto')out.push({pileLen:'auto'});
  if(kind!=='manual')same.slice(same.indexOf(P.pile)+1).forEach(k=>out.push({pile:k,pileLen:'auto'}));
  if(id==='pile'){[2000,1500,1200].filter(v=>v<+P.pileMaxS).forEach(v=>{out.push({pileMaxS:v});if(kind!=='manual')same.slice(same.indexOf(P.pile)+1).forEach(k=>out.push({pile:k,pileLen:'auto',pileMaxS:v}))})}
  if(id==='heave'){if(kind==='bored')out.push({pile:'b300w',pileLen:'auto'});out.push({pile:'p108',pileLen:'auto'},{pile:'c30',pileLen:'auto'});[3000,3500].filter(v=>v>+P.pileMaxS).forEach(v=>out.push({pileMaxS:v}))}
  return out;
}
function pickFor(id){
  const list=getPicks(id); if(!list||!list.length) return null;
  for(const patch of list){if(!techOk(patch))continue;const P2={...P,...patch};
    try{const {C:C2}=buildFull(P2),c=C2.checks.find(x=>x.id===id);if(c&&c.ok&&(id!=='heave'||C2.checks.find(x=>x.id==='pile')?.ok!==false))return patch}catch(e){}}
  return null;
}

