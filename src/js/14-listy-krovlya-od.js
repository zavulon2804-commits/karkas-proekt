function sheetRoofPlan(code){
  const {A,B,ov,og,tn}=M,WR=M.wingRoofs||[];
  const WP=WR.flatMap(r=>r.polys.flatMap(q=>q.pl)),xmin=Math.min(-og,...WP.map(p=>p[0])),ymin=Math.min(-ov,...WP.map(p=>p[1])),xmax=Math.max(A+og,...WP.map(p=>p[0])),ymax=Math.max(B+ov,...WP.map(p=>p[1]));
  const W0=xmax-xmin,H0=ymax-ymin,mL=46,mR=24,mT=26,mB=44,aw=385-96,s=fit(W0,H0,aw-mL-mR,222-mT-mB);
  const w=W0/s,h=H0/s,pxL=25+mL+(aw-mL-mR-w)/2,pyT=10+mT+(222-mT-mB-h)/2;
  const X=x=>pxL+(x-xmin)/s,Y=y=>pyT+(ymax-y)/s;let g=Tx(25+aw/2,16,`План кровли  М 1:${s}`,{size:3.5,cls:'b'});
  const pa=planAxes(M),ax=pa.ax,ay=pa.ay;
  ax.forEach((x,i)=>{g+=Ln(X(x),Y(ymax)-5,X(x),Y(ymin)+35,'ax')+bubble(X(x),Y(ymin)+38.6,i+1)});
  ay.forEach((y,i)=>{g+=Ln(X(xmax)+5,Y(y),X(xmin)-35,Y(y),'ax')+bubble(X(xmin)-38.6,Y(y),AX_LET[i]||'?')});
  const poly=(pts,fill)=>`<polygon points="${pts.map(q=>f2(X(q[0]))+','+f2(Y(q[1]))).join(' ')}" fill="${fill}" stroke="#111" stroke-width=".5"/>`;
  /* основная кровля */
  const sl=M.gable?[[-ov,B/2],[B/2,B+ov]]:[[-ov,B+ov]];
  sl.forEach(([y0,y1],i)=>g+=`<rect x="${f2(X(-og))}" y="${f2(Y(y1))}" width="${f2((A+2*og)/s)}" height="${f2((y1-y0)/s)}" fill="${i?'#EEF2F5':'#E6ECF1'}" stroke="none"/>`);
  g+=Rc(X(-og),Y(B+ov),(A+2*og)/s,(B+2*ov)/s,'m');
  /* кровли крыльев поверх основной */
  WR.forEach(r=>{g+=poly(r.polys[0].pl,'#E9EEF2')+poly(r.polys[1].pl,'#F0F3F6')+Ln(X(r.ridge[0][0]),Y(r.ridge[0][1]),X(r.ridge[1][0]),Y(r.ridge[1][1]),'m');
    r.valleys.forEach(([a,b],j)=>{g+=Ln(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),'m');const mx=(X(a[0])+X(b[0]))/2,my=(Y(a[1])+Y(b[1]))/2;g+=Tx(mx+(j?1.5:-1.5),my,'ендова',{size:2,a:j?'start':'end'})})});
  /* стены пунктиром */
  [[0,0,A,B],...(M.wings||[]).map(k=>[k.x0,k.y0,k.x1,k.y1])].forEach(q=>g+=Rc(X(q[0]),Y(q[3]),(q[2]-q[0])/s,(q[3]-q[1])/s,'hd'));
  if(M.gable){g+=Ln(X(-og),Y(B/2),X(A+og),Y(B/2),'m');g+=Tx(X(A/2),Y(B/2)-1.2,'конёк',{size:2.2})}
  /* стрелки уклона — по направлению стока воды */
  const pct=R(tn*100),lab=`${M.deg}° (${pct} %)`;
  const arrowV=(x,yA,yB)=>{const ya=Y(yA),yb=Y(yB),dir=Math.sign(yb-ya)||1;return Ln(X(x),ya,X(x),yb,'m')+Pg([[X(x),yb],[X(x)-1.1,yb-dir*3],[X(x)+1.1,yb-dir*3]],'blk')+Tx(X(x)+1.6,(ya+yb)/2+.8,lab,{size:2.4,a:'start'})};
  const arrowH=(y,xA,xB)=>{const xa=X(xA),xb=X(xB),dir=Math.sign(xb-xa)||1;return Ln(xa,Y(y),xb,Y(y),'m')+Pg([[xb,Y(y)],[xb-dir*3,Y(y)-1.1],[xb-dir*3,Y(y)+1.1]],'blk')+Tx((xa+xb)/2,Y(y)-1.2,lab,{size:2.2})};
  const free=(x,sd='W3')=>!WR.some(r=>!r.end&&r.k.side===sd&&Math.abs(x-r.xc)<r.half+ov+300);
  const xs=[A*.25,A*.75];
  if(M.gable)xs.forEach(x=>{if(free(x,'W1'))g+=arrowV(x,B/2-ov*.4-B*.08,B/2-B*.36);if(free(x))g+=arrowV(x,B/2+ov*.4+B*.08,B/2+B*.36)});
  else xs.forEach(x=>g+=arrowV(x,B*.8,B*.2));
  WR.forEach(r=>{const k=r.k,h2=r.half,ac=k.off+k.Wd/2,rm=r.end?k.D/2:(ov+k.D+og)/2;[-1,1].forEach(dir=>{const p=k.G(ac+dir*h2*.15,rm),q=k.G(ac+dir*h2*.8,rm);g+=k.T[1]?arrowV(p[0],p[1],q[1]):arrowH(p[1],p[0],q[0])})});
  /* отметки */
  const zE=M.slopes[0].zA,zR=M.zRidge;
  if(free(A*.5,'W1'))g+=Tx(X(A*.5),Y(-ov)-1.6,`отм. карниза ${elvTxt(zE-M.z0)}`,{size:2.2});if(M.gable&&free(A*.5))g+=Tx(X(A*.5),Y(B+ov)+3.6,`отм. карниза ${elvTxt(zE-M.z0)}`,{size:2.2});
  g+=M.gable?Tx(X(A*.5),Y(B/2)+3.4,`отм. конька ${elvTxt(zR-M.z0)}`,{size:2.2}):Tx(X(A*.5),Y(B+ov)-1.6,`верх ската, отм. ${elvTxt(zR-M.z0)}`,{size:2.2});
  WR.forEach(r=>{const k=r.k,p=k.G(k.off+k.Wd/2,r.end?k.D/2:k.D-500);g+=Tx(X(p[0])+(r.end?0:1.4),Y(p[1])+(r.end?3.4:0),`отм. конька ${elvTxt(r.ridgeZ-M.z0)}`,{size:2.2,a:r.end?'middle':'start'})});
  /* размеры */
  const xb=[...new Set([xmin,0,A,A+og,xmax,...WR.flatMap(r=>r.end?[]:[r.k.x0-ov,r.k.x1+ov])])],yb=[...new Set([ymin,0,...(M.gable?[B/2]:[]),B,B+ov,ymax,...WR.flatMap(r=>r.end?[r.k.y0-ov,r.k.y1+ov]:[])])];
  g+=chainH(xb,X,Y(ymin)+9,Y(ymin))+chainH([xmin,...ax,xmax],X,Y(ymin)+17,Y(ymin))+dimH(X(xmin),X(xmax),Y(ymin)+25,Y(ymin),R(W0));
  g+=chainV(yb,Y,X(xmin)-9,X(xmin))+chainV([ymin,...ay,ymax],Y,X(xmin)-17,X(xmin))+dimV(Y(ymin),Y(ymax),X(xmin)-25,X(xmin),R(H0));
  /* ведомость */
  const ri=M.roofInfo||{eaves:(M.gable?2:1)*(A+2*og),ridge:M.gable?A+2*og:0,valleys:0,valleyN:0},ex=25+aw+3;
  const rows=[['Тип',M.gable?'двускатная':'односкатная'],['Уклон',`${M.deg}° (${pct} %)`],['Покрытие',M.mat.name],
    ['Площадь скатов',`${fmt(M.roofArea,1)} м²`],['Карнизный свес',`${M.ov} мм`],['Фронтонный свес',`${M.og} мм`],
    ['Длина карнизов (желоба)',`${fmt(ri.eaves/1000,1)} м`],['Длина коньков',ri.ridge?`${fmt(ri.ridge/1000,1)} м`:'—'],
    ...(ri.valleyN?[['Ендовы',`${ri.valleyN} шт, ${fmt(ri.valleys/1000,1)} м`]]:[]),['Мин. уклон покрытия',`${M.mat.min}°`]];
  g+=tableBlock(ex,30,91,80,'Кровля',[{t:'Показатель',w:55,a:'start'},{t:'Значение',w:36}],rows);
  [`Стрелка — направление стока воды.`,`Водосточные трубы — ориентировочно`,`1 шт на 10 м желоба, не реже чем`,`по углам дома.`,...(ri.valleyN?['Под ендовой — сплошная обрешётка','и ендовная планка.']:[]),M.deg<M.mat.min?`Уклон меньше допустимого для покрытия!`:''].filter(Boolean).forEach((t,i)=>g+=Tx(ex,30+5.2+rows.length*4+10+i*4.2,t,{a:'start',size:2.2}));
  return {code,title:'План кровли',sub:`${M.gable?'Двускатная':'Односкатная'}${WR.length?` + крылья: ${WR.length}`:''}, ${M.deg}°, ${M.mat.name.toLowerCase()}, ${fmt(M.roofArea,1)} м²`,scale:s,body:g};
}
function sheetRoof(){
  const {A,B,ov,og,tn,cs,hr,br}=M,zMin=-700,zMax=M.zRidge+250,yMin=-ov-300,yMax=B+ov+300;
  const Wsec=yMax-yMin,Wpl=A+2*og,Hsec=zMax-zMin,Hpl=B+2*ov;
  const s=SCALES.find(s=>(Wsec+Wpl)/s+30+30+26<=385&&Math.max(Hsec,Hpl)/s+12+26<=222)||300;
  const pxS=25+30,pyS=10+14+(222-14-26-Hsec/s)/2;
  const Xs=y=>pxS+(y-yMin)/s,Zs=z=>pyS+(zMax-z)/s;
  let g=Tx(pxS+Wsec/s/2,17,`Разрез 1-1  М 1:${s}`,{size:3.4,cls:'b'});
  g+=Ln(Xs(yMin),Zs(0),Xs(yMax),Zs(0),'gnd');for(let y=yMin;y<yMax;y+=300*s/50*1.2)g+=Ln(Xs(y),Zs(0)+.2,Xs(y)-1.6,Zs(0)+1.8);
  M.lines.filter(l=>l.axis==='x'&&l.wing==null).forEach(l=>{g+=Rc(Xs(l.c-M.pileD/2),Zs(M.H0),M.pileD/s,(M.H0-zMin)/s,'pile');g+=Pl([[Xs(l.c-M.pileD),Zs(zMin)],[Xs(l.c)-.8,Zs(zMin)-1],[Xs(l.c)+.8,Zs(zMin)+1],[Xs(l.c+M.pileD),Zs(zMin)]],'t');
    g+=Rc(Xs(l.c-M.bb/2),Zs(M.H0+M.hb),M.bb/s,M.hb/s,'w2')+Ln(Xs(l.c-M.bb/2),Zs(M.H0),Xs(l.c+M.bb/2),Zs(M.H0+M.hb))+Ln(Xs(l.c-M.bb/2),Zs(M.H0+M.hb),Xs(l.c+M.bb/2),Zs(M.H0))});
  g+=Rc(Xs(0),Zs(M.H0+M.hb+M.hj),B/s,M.hj/s,'w');g+=Rc(Xs(0),Zs(M.z0),B/s,(M.z0-M.H0-M.hb-M.hj)/s,'w2');
  [[0,M.d],[B-M.d,B]].forEach(([a,e])=>g+=Rc(Xs(a),Zs(M.zt),(e-a)/s,M.H/s,'wl'));
  M.walls.filter(w=>!w.ext&&w.ux).forEach(w=>g+=Rc(Xs(w.y0-w.d/2),Zs(M.zt),w.d/s,M.H/s,'wlp'));
  g+=Rc(Xs(0),Zs(M.zt+M.ha),B/s,M.ha/s,'w');
  if(M.mans&&M.mansOk){g+=Rc(Xs(0),Zs(M.zm),B/s,(M.zm-M.zt-M.ha)/s,'w2');[M.yk,B-M.yk].forEach(y=>g+=Rc(Xs(y-M.kneeD/2),Zs(M.zm+M.kneeH),M.kneeD/s,M.kneeH/s,'wlp'));
    g+=Rc(Xs(M.yT),Zs(M.zc+150),(B-2*M.yT)/s,150/s,'w3');g+=Tx(Xs(B/2),Zs(M.zm+M.mansH/2),'МАНСАРДА',{size:3,cls:'b'})}
  const ex=M.ridgeExt||0;M.slopes.forEach(sl=>{const ze=sl.zA,yy=sl.y1+sl.dir*ex*cs,zr=sl.zB+ex*M.sn,o=hr/cs;g+=Pg([[Xs(sl.y0),Zs(ze)],[Xs(yy),Zs(zr)],[Xs(yy),Zs(zr+o)],[Xs(sl.y0),Zs(ze+o)]],'w2');
    const ofr=(hr+(M.mat.counter?M.mat.counter[0]:0)+M.mat.lath[0]+8)/cs;g+=Ln(Xs(sl.y0),Zs(ze+ofr),Xs(yy),Zs(zr+ofr),'m')});
  if(M.purlin){const pu=M.pur;g+=Rc(Xs(B/2-pu.pb/2),Zs(pu.zPt),pu.pb/s,pu.ph/s,'w3')+Rc(Xs(B/2-pu.qh/2),Zs(pu.zPt-pu.ph),pu.qh/s,pu.Lpost/s,'w2')+Rc(Xs(B/2-pu.qh/2),Zs(M.zt+M.ha+pu.qb),pu.qh/s,pu.qb/s,'w2');
    if(pu.nC){const zc=M.zt+M.ha+pu.qb+pu.Lpost*.6,yC=(zc-M.zr0)/M.tn;g+=Rc(Xs(yC),Zs(zc+pu.cs2[1]/2),(B-2*yC)/s,pu.cs2[1]/s,'w2')+Tx(Xs(B/2)-pu.qh/2/s-1.5,Zs(zc)-1.6,`СХ ${pu.cs2.join('×')}`,{a:'end',size:2.1})}
    g+=Ln(Xs(B/2)+pu.pb/2/s,Zs(pu.zPt-pu.ph/2),Xs(B/2)+pu.pb/2/s+14,Zs(pu.zPt-pu.ph/2)-6)+Tx(Xs(B/2)+pu.pb/2/s+15,Zs(pu.zPt-pu.ph/2)-6.6,`КП ${pu.pb}×${pu.ph}, врубка ${R(pu.notch)}`,{a:'start',size:2.1})+Tx(Xs(B/2)+pu.qh/2/s+1.5,Zs(pu.zPt-pu.ph-pu.Lpost/2),`СТК ${pu.qb}×${pu.qh}`,{a:'start',size:2.1})}
  else if(M.gable&&M.ridgeJoint!=='lap')g+=Rc(Xs(B/2-br/2),Zs(M.zRidge),br/s,hr/s,'w3');
  if(M.gable){const zk=M.zr0+B/2*M.tn+hr/cs/2;if(M.ridgeJoint==='lap')g+=Ci(Xs(B/2),Zs(zk),Math.max(.6,6/s),'m');g+=Ln(Xs(B/2)-2,Zs(zk),Xs(B/2)-16,Zs(zk)-9)+Tx(Xs(B/2)-17,Zs(zk)-9.6,M.ridgeJoint==='lap'?`конёк: внахлёст, заход ${M.ridgeExt}, болт М12`:'конёк: в стык с подрезкой, накладки',{a:'end',size:2.1})}
  M.strutY.forEach(y=>g+=Rc(Xs(y-br/2),Zs(M.zU(y)),br/s,(M.zU(y)-M.zr0)/s,'w3'));
  const a0=Xs(0)+(M.gable?14:16),z0p=Zs(M.zr0);g+=`<path d="M${f2(Xs(0)+12)} ${f2(z0p)} A12 12 0 0 0 ${f2(Xs(0)+12*Math.cos(M.al))} ${f2(z0p-12*Math.sin(M.al))}" class="t"/>`+Ln(Xs(0),z0p,Xs(0)+15,z0p)+Tx(a0+1,z0p-2,`${M.deg}°`,{size:2.4,a:'start'});
  g+=chainH([-ov,0,B,B+ov],Xs,Zs(zMin)+7,null);g+=chainH([0,...M.lines.filter(l=>l.axis==='x'&&l.wing==null).map(l=>l.c),B],Xs,Zs(zMin)+15,null);
  g+=chainV([0,M.H0,M.z0,M.zt,M.zr0,...(M.mans&&M.mansOk?[M.zm,M.zm+M.kneeH,M.zc]:[]),R(M.zRidge)],Zs,Xs(yMin)-7,Xs(yMin)+2);
  [[0,'земля'],[M.H0,'оголовки'],[M.z0,'пол'],[M.zt,'верх стен'],...(M.mans&&M.mansOk?[[M.zm,'пол мансарды'],[M.zc,'потолок мансарды']]:[]),[R(M.zRidge),'конёк']].forEach(([z,t])=>g+=elev(Xs(yMax)-2,Zs(z),elvTxt(z-M.z0)+' '+t));
  // план стропил
  const pxP=pxS+Wsec/s+30,pyP=10+14+(222-14-26-Hpl/s)/2,Xp=x=>pxP+(x+og)/s,Yp=y=>pyP+(B+ov-y)/s;
  g+=Tx(pxP+Wpl/s/2,17,`План стропильной системы  М 1:${s}`,{size:3.4,cls:'b'});
  g+=Rc(Xp(-og),Yp(B+ov),Wpl/s,Hpl/s,'m')+Rc(Xp(0),Yp(B),A/s,B/s,'hd');
  [...M.xsR,...M.barge].forEach(x=>g+=Rc(Xp(x-br/2),Yp(B+ov),br/s,Hpl/s,'w'));
  if(M.purlin){g+=Rc(Xp(-og),Yp(B/2)-M.pur.pb/2/s,Wpl/s,M.pur.pb/s,'w3')+Ln(Xp(-og)-3,Yp(B/2),Xp(A+og)+3,Yp(B/2),'ax');M.pur.xs.forEach(x=>g+=Rc(Xp(x)-M.pur.qb/2/s,Yp(B/2)-M.pur.qh/2/s,M.pur.qb/s,M.pur.qh/s,'blk'))}
  else if(M.gable)g+=Rc(Xp(-og),Yp(B/2)-br/2/s,Wpl/s,br/s,'w3')+Ln(Xp(-og)-3,Yp(B/2),Xp(A+og)+3,Yp(B/2),'ax');
  M.strutY.forEach(y=>g+=Ln(Xp(0),Yp(y),Xp(A),Yp(y),'hd'));
  const xc=A/2;g+=Ln(Xp(xc),Yp(B+ov)-6,Xp(xc),Yp(B+ov)-1,'m')+Ln(Xp(xc),Yp(-ov)+1,Xp(xc),Yp(-ov)+6,'m')+Tx(Xp(xc)+2.5,Yp(B+ov)-3,'1',{size:3})+Tx(Xp(xc)+2.5,Yp(-ov)+5.5,'1',{size:3});
  g+=chainH([-og,...M.barge,...M.xsR,A+og],Xp,Yp(-ov)+8,Yp(-ov))+dimH(Xp(-og),Xp(A+og),Yp(-ov)+16,Yp(-ov),R(A+2*og));
  g+=chainV([-ov,0,...(M.gable?[B/2]:[]),B,B+ov],Yp,Xp(-og)-8,Xp(-og));
  const rm=M.mem.find(m=>m.role==='СН');
  g+=tableBlock(25,240,200,48,'Стропильная система и чердак',MARK_COLS,markRows(x=>x.grp==='roof'||x.grp==='attic'||x.grp==='lath'));
  const nt=[`Покрытие: ${M.mat.name}. Обрешётка ${M.mat.lath.join('×')} с шагом ${M.mat.step} мм${M.mat.counter?`, контробрешётка ${M.mat.counter.join('×')}`:''}.`,M.purlin?`Стропила — на обвязку и коньковый прогон КП (врубка ${R(M.pur.notch)} мм, 2 гв. 4×100 + скоба); стойки СТК шаг до ${fmt(M.pur.span/1000,2)} м на лежне ЛЖ${M.pur.aS>=300?`, подкосы ПДК вынос ${R(M.pur.aS)}`:''}${M.pur.nC?`, схватки СХ ${M.pur.cs2.join('×')} с двух сторон каждой пары`:''}.`:`Балки чердака БП — затяжки по осям стропил, шаг ${M.sr} мм. Нижний узел — ${C.checks.find(c=>c.id==='node_tie')?.sec||'гвозди по расчёту'}; конёк — ${C.checks.find(c=>c.id==='node_ridge')?.sec||'накладки'}.`,rm?`Длина стропила ${rm.mark} дана с запасом на запилы.`:''];
  nt.forEach((t,i)=>g+=Tx(pxP,226+i*3.6-(nt.length-1)*3.6+0,t,{a:'start',size:2.1}));
  return {code:'КР-1',title:'Стропильная система',sub:`${M.gable?'Двускатная':'Односкатная'}, уклон ${M.deg}°, ${M.mat.name.toLowerCase()}`,scale:s,body:g};
}
function sheetGeneral(list){
  const T=TECH[P.tech]||TECH.free,l=C.l;let g=Tx(25+385/2,16,'Общие данные',{size:3.8,cls:'b'});
  const col=(x,y,title,lines,w=180)=>{let s=Tx(x,y,title,{a:'start',size:3,cls:'b'}),yy=y+5.5;lines.forEach(t=>{const parts=[];let cur='';String(t).split(' ').forEach(wd=>{if((cur+' '+wd).length*1.25>w){parts.push(cur);cur=wd}else cur=cur?cur+' '+wd:wd});if(cur)parts.push(cur);parts.forEach((pt,i)=>{s+=Tx(x+(i?4:0),yy,(i?'':'— ')+pt,{a:'start',size:2.3});yy+=3.6})});return [s,yy+3]};
  let y=26,r;
  [r,y]=col(25,y,'Технология',[T.n,...(T.about?[T.about]:[]),`Пиломатериал: ${LUMBER_T[P.lumber]}`]);g+=r;
  [r,y]=col(25,y,'Район строительства и нагрузки',[P.site?`${P.site.name} (${P.site.admin}), данные ${P.site.years}, режим: ${siteKey(P)==='p50'?'1 раз в 50 лет':'средние значения'}`:'Район задан вручную',`Снег Sg = ${fmt(l.Sg,2)} кПа (${snowLbl(P)}), на кровлю S = ${fmt(l.S,2)} кПа`,`Ветер w0 = ${fmt(l.w0,3)} кПа (${windLbl(P)}), местность ${P.terrain}`,`Глубина промерзания ${P.freeze} мм, грунт: ${(SOILS[P.soil]||SOILS.loam).name}`,`Пол ${fmt(l.gF+l.pF,2)} кПа, ${M.mans?'мансарда':'чердак'} ${fmt(l.gA+l.pA,2)} кПа (нормативные)`]);g+=r;
  [r,y]=col(25,y,'Состав наружной стены (изнутри наружу)',wallLayers(P).map((t,i)=>`${i+1}. ${t}`));g+=r;
  {const T=tep(M);[r,y]=col(25,y,'Технико-экономические показатели',[`Этажность: ${T.floors}`,`Площадь застройки: ${fmt(T.build,1)} м²`,`Общая площадь: ${fmt(T.total,1)} м² (1 этаж ${fmt(T.tot,1)}${T.mans?` + мансарда ${fmt(T.mans,1)}`:''})`,`Жилая площадь: ${fmt(T.liv,1)} м²`,`Строительный объём: ≈ ${fmt(T.vol,0)} м³ (от верха свай до конька)`]);g+=r}
  [r,y]=col(25,y,'Фундамент и перекрытия',[`${M.pileT.name}, ${M.piles.length} шт, L = ${M.pileLen} мм`,`Ростверк: ${M.pack?`пакет ${M.ply} × ${P.packB}×${P.packH} «ёлочкой», стыки над сваями`:`брус ${M.bb}×${M.hb}`}`,`Лаги ${M.bj}×${M.hj} шаг ${M.sj}, OSB пола ${P.floorOsb} мм`,`Кровля: ${M.gable?'двускатная':'односкатная'} ${M.deg}°, ${M.mat.name.toLowerCase()}, стропила ${M.br}×${M.hr} шаг ${M.sr}${M.mans?', мансарда':''}`]);g+=r;
  g+=tableBlock(230,30,180,200,'Ведомость листов',[{t:'Лист',w:12},{t:'Шифр',w:18},{t:'Наименование',w:100,a:'start'}],list.map((x,i)=>[i+1,x.code,x.title]));
  return {code:'ОД',title:'Общие данные',sub:`Технология: ${T.short}`,scale:'—',body:g};
}
