function build(P,OPT={}){
  const n=v=>+v;
  const A=n(P.A),B=n(P.B),H=n(P.H),b=n(P.studB),d=n(P.studH),t=b;
  const pack=P.beamType==='pack',ply=pack?Math.max(2,n(P.beamPly)||3):1,bb=pack?n(P.packB)*ply:n(P.beamB),hb=pack?n(P.packH):n(P.beamH);
  const bj=n(P.joistB),hj=n(P.joistH),sj=Math.max(200,n(P.joistS));
  const H0=n(P.plinth),z0=H0+hb+hj+n(P.floorOsb),zt=z0+H;
  const ba=n(P.attB),ha=n(P.attH),br=n(P.rafterB),hr=n(P.rafterH),sr=Math.max(300,n(P.rafterS));
  const deg=Math.min(60,Math.max(3,n(P.slope))),al=rad(deg),tn=Math.tan(al),cs=Math.cos(al),sn=Math.sin(al);
  const ov=n(P.overhang),og=n(P.gableOver),gable=P.roof!=='shed',mat=ROOFS[P.roofMat]||ROOFS.metal;
  const zr0=zt+ha;
  /* опорный узел стропила на стене: зарубка с горизонтальной площадкой длиной lb по верху балки, глубина lb·tg α ≤ h/4 (СП 64.13330) */
  const hr0=n(P.rafterH),tn0=Math.tan(rad(Math.min(60,Math.max(3,n(P.slope))))),lb=Math.max(40,Math.min(n(P.studH),hr0/4/tn0)),zs=zr0-lb*tn0;
  const M={zs,seat:{lb,depth:lb*tn0},P,np:1+(Math.max(1,Math.min(2,n(P.topPlates)||2))),pack,A,B,H,b,d,t,bb,hb,ply,bj,hj,sj,H0,z0,zt,ba,ha,br,hr,sr,deg,al,tn,cs,sn,ov,og,gable,mat,zr0,mem:[],errs:[],piles:[],lines:[],walls:[],ops:[]};
  const mem=M.mem;
  const add=o=>{mem.push(o);return o};
  const bar=(grp,role,sec,cnt,p0,p1,up,sy,sz,extra={})=>add({grp,role,sec,n:cnt,L:dist3(p0,p1),p0,p1,up,sy,sz,...extra});

  /* опоры балок чердака: несущая перегородка вдоль X около середины */
  const sup=(P.walls||[]).filter(w=>w.axis==='x'&&w.bearing).map(w=>+w.c).filter(c=>Math.abs(c-B/2)<=.2*B).sort((a,c)=>Math.abs(a-B/2)-Math.abs(c-B/2))[0];
  M.attSup=sup??null;
  M.La=M.attSup!=null?Math.max(M.attSup-d/2,B-d/2-M.attSup):B-d;
  M.Lh0=gable?(B-d)/2:(B-d); M.Lh=P.strut?M.Lh0/2:M.Lh0;
  M.Ls=gable?(B/2+ov)/cs:(B+2*ov)/cs;
  const zU=y=>gable?zs+Math.min(y,B-y)*tn:zs+y*tn; M.zU=zU;
  M.mans=!!P.mansard&&gable; M.kneeH=n(P.kneeH)||1200; M.mansH=n(P.mansH)||2400; M.kneeD=n(P.kneeD)||100; M.zm=zt+ha+n(P.floorOsb);
  if(M.mans){M.yk=Math.max(d+200,(M.kneeH+M.zm-zs)/tn);M.zc=M.zm+M.mansH;M.yc=(M.zc-zs)/tn;M.y15=Math.max(d,(M.zm+1500-zs)/tn);
    M.mansOk=M.yc<B/2-300&&M.yk<B/2-600;M.L1=M.yk-d/2;M.L2=B/2-M.yk;if(M.mansOk)M.Lh=Math.max(M.L1,M.L2);
    M.mansArea=Math.max(0,B-2*M.y15)*(A-2*d)/1e6;M.mansFloor=Math.max(0,B-2*M.yk)*(A-2*d)/1e6}

  /* крылья (Г- и Т-образный план): прямоугольный блок примыкает к стене 2 или 3 основного дома.
     Стена основного дома на стыке остаётся — она становится внутренней несущей стеной. */
  /* Крыло задаётся в системе своей стороны: a — вдоль стены (от начала оси), r — наружу от стены.
     Стены 2 и 4 — торцевые (крыло продолжает конёк дома), стены 1 и 3 — длинные (конёк крыла поперёк, ендовы). */
  M.wings=[];M.AX=A;M.BY=B;M.X0=0;M.Y0=0;
  const FR={W1:{G:(a,r)=>[a,-r],T:[1,0],N:[0,-1],o:0},W2:{G:(a,r)=>[A+r,a],T:[0,1],N:[1,0],o:-A},W3:{G:(a,r)=>[a,B+r],T:[1,0],N:[0,1],o:-B},W4:{G:(a,r)=>[-r,a],T:[0,1],N:[-1,0],o:0}};
  (P.blocks||[]).forEach((bk,i)=>{const side=FR[bk.side]?bk.side:'W2',fr=FR[side],end=side==='W2'||side==='W4',off=n(bk.off),Wd=n(bk.w),D=n(bk.depth),Ls=end?B:A,nm='крыло '+(i+1),id0=5+3*i,ids=[0,1,2].map(k=>'W'+(id0+k));
    if(!(Wd>=2000&&D>=1500&&off>=0&&off+Wd<=Ls+1)){M.errs.push({wall:'K'+(i+1),msg:`Крыло ${i+1} не построено: ширина должна быть от 2000 мм, вынос от 1500 мм, и крыло должно помещаться вдоль стены ${side.slice(1)} (её длина ${Ls} мм)`});return}
    const box=(a0,r0,a1,r1)=>{const p=fr.G(a0,r0),q=fr.G(a1,r1);return [Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[0],q[0]),Math.max(p[1],q[1])]};
    const [x0,y0,x1,y1]=box(off,0,off+Wd,D);
    const hit=M.wings.find(q=>Math.min(x1,q.x1)-Math.max(x0,q.x0)>1&&Math.min(y1,q.y1)-Math.max(y0,q.y0)>1);
    if(hit){M.errs.push({wall:'K'+(i+1),msg:`Крыло ${i+1} не построено: оно накладывается на крыло ${hit.i+1}. Раздвиньте крылья вдоль стены`});return}
    M.wings.push({i,side,end,off,G:fr.G,T:fr.T,N:fr.N,o:fr.o,x0,y0,x1,y1,ids,id0,D,Wd,nm,area:(x1-x0)*(y1-y0)/1e6,inner:box(off+d,0,off+Wd-d,D-d)});
    M.AX=Math.max(M.AX,x1);M.BY=Math.max(M.BY,y1);M.X0=Math.min(M.X0,x0);M.Y0=Math.min(M.Y0,y0)});
  M.extPerim=2*(A+B)+M.wings.reduce((t,k)=>t+2*k.D+k.Wd,0);
  /* ростверк и сваи */
  M.nMid=P.beamsMid==='auto'?autoMid(P):Math.max(0,n(P.beamsMid)||0);
  M.yMid=[]; for(let i=1;i<=M.nMid;i++) M.yMid.push(bb/2+i*(B-bb)/(M.nMid+1));
  M.Lj=(B-bb)/(M.nMid+1);
  const pmax=Math.max(800,n(P.pileMaxS));
  const div=(a,e)=>{const k=Math.max(1,Math.ceil((e-a)/pmax-1e-9));return [...Array(k+1)].map((_,i)=>a+i*(e-a)/k)};
  const xL=bb/2,xR=A-bb/2,yB=bb/2,yT=B-bb/2;
  const xsP=div(xL,xR), ysKey=[yB,...M.yMid,yT];
  let ysP=[yB]; for(let i=0;i<ysKey.length-1;i++) ysP.push(...div(ysKey[i],ysKey[i+1]).slice(1));
  M.lines=[
    {id:'X1',kind:'extX',axis:'x',c:yB,pts:xsP,name:'Балка под стеной 1'},
    {id:'X3',kind:'extX',axis:'x',c:yT,pts:xsP,name:'Балка под стеной 3'},
    ...M.yMid.map((y,i)=>({id:'XM'+(i+1),kind:'mid',axis:'x',c:y,pts:xsP,name:'Промежуточная балка '+(i+1)})),
    {id:'Y4',kind:'extY',axis:'y',c:xL,pts:ysP,name:'Балка под стеной 4'},
    {id:'Y2',kind:'extY',axis:'y',c:xR,pts:ysP,name:'Балка под стеной 2'}
  ];
  /* фундамент под крыльями: балки под стенами крыла и промежуточные по расчёту лаг; на стыке — балка основного дома */
  /* лаги всегда идут вдоль Y, балки ростверка — вдоль X; у торцевого крыла лаги поперёк крыла, у бокового — вдоль выноса */
  M.wings.forEach(k=>{const E=k.end,far=k.side==='W2'?k.x1-bb/2:k.side==='W4'?k.x0+bb/2:k.side==='W3'?k.y1-bb/2:k.y0+bb/2;
    const ya=E?k.y0+bb/2:Math.min(k.side==='W3'?yT:yB,far),yb=E?k.y1-bb/2:Math.max(k.side==='W3'?yT:yB,far),xa=E?(k.side==='W2'?xR:xL):k.x0+bb/2,xb=E?far:k.x1-bb/2;
    let nW=4;for(let q=0;q<=4;q++){const L=(yb-ya)/(q+1);if(L<=6000&&joistCheck(P,L).u<=1){nW=q;break}}
    const yM=[...Array(nW)].map((_,q)=>ya+(q+1)*(yb-ya)/(nW+1)),lj=(yb-ya)/(nW+1);
    const xsW=div(Math.min(xa,xb),Math.max(xa,xb)),ysK=[ya,...yM,yb];let ysW=[ya];for(let q=0;q<ysK.length-1;q++)ysW.push(...div(ysK[q],ysK[q+1]).slice(1));
    const tg='Крыло '+(k.i+1)+': ',xl=[];
    if(E)xl.push({c:ya,kind:'extX',bear:true,name:tg+'балка под боковой стеной'},{c:yb,kind:'extX',bear:true,name:tg+'балка под боковой стеной'});
    else xl.push({c:far,kind:'extX',gab:true,name:tg+'балка под торцевой стеной'});
    yM.forEach((y,q)=>xl.push({c:y,kind:'mid',name:tg+'промежуточная балка '+(q+1)}));
    xl.forEach((l,q)=>M.lines.push({id:'K'+(k.i+1)+'X'+(q+1),axis:'x',pts:xsW,lj,wing:k.i,...l}));
    (E?[{c:far,gab:true,name:tg+'балка под торцевой стеной'}]:[{c:xa,bear:true,name:tg+'балка под боковой стеной'},{c:xb,bear:true,name:tg+'балка под боковой стеной'}]).forEach((l,q)=>M.lines.push({id:'K'+(k.i+1)+'Y'+(q+1),kind:'extY',axis:'y',pts:ysW,lj,wing:k.i,...l}));
    k.grill={yA:ya,yB:yb,xa,xb,far,yM,xsW,ysW,lj,nMid:nW}});
  M.lines.forEach(l=>{l.span=Math.max(...l.pts.slice(1).map((p,i)=>p-l.pts[i]))});
  const pm=new Map();
  M.lines.forEach(l=>l.pts.forEach(p=>{const x=l.axis==='x'?p:l.c,y=l.axis==='x'?l.c:p,k=R(x)+'_'+R(y);if(!pm.has(k))pm.set(k,{x,y,key:k})}));
  /* сваи ближе 250 мм друг к другу (стык балок дома и крыла) объединяются в одну; нагрузки сводятся к ней через M.pileAlias */
  M.pileAlias={};{const keep=[];[...pm.values()].forEach(q=>{const h=keep.find(k=>Math.hypot(k.x-q.x,k.y-q.y)<250);if(h){M.pileAlias[q.key]=h.key;pm.delete(q.key)}else keep.push(q)})}
  M.piles=[...pm.values()].sort((a,c)=>R(c.y)-R(a.y)||a.x-c.x); M.piles.forEach((p,i)=>p.no=i+1);
  M.pileT=PILES[P.pile]||PILES.p108; M.pileD=M.pileT.d; M.pileKind=M.pileT.kind;
  M.pileNeed=Math.max(n(P.freeze)+(M.pileKind==='driven'?500:300),M.pileKind==='driven'?2500:1500)+H0+(M.pileKind==='bored'?0:100);
  const lens=PILE_LENS[M.pileKind]||PILE_LENS.screw;
  M.pileLen=OPT.pileLen||(P.pileLen==='auto'?(lens.find(v=>v>=M.pileNeed)||lens.at(-1)):n(P.pileLen));

  const zb=H0+hb/2;
  /* балка ростверка: брус или пакет досок «ёлочкой» — стыки досок вразбежку, только над сваями */
  const gbar=(x0,y0,x1,y1,pts)=>{const ax=Math.abs(x1-x0)>1,st=ax?x0:y0,rp=rel(pts,st);
    if(!pack){bar('grill','Б',[bb,hb],1,[x0,y0,zb],[x1,y1,zb],[0,0,1],hb,bb,{splitAt:rp});return}
    const pb=n(P.packB);for(let j=0;j<ply;j++){const off=(j-(ply-1)/2)*pb,sp=rp.filter((_,i)=>(i+j)%2===1);
      bar('grill','Б',[pb,hb],1,[x0+(ax?0:off),y0+(ax?off:0),zb],[x1+(ax?0:off),y1+(ax?off:0),zb],[0,0,1],hb,pb,{splitAt:sp.length?sp:rp,ply:j})}};
  [yB,yT].forEach(y=>gbar(0,y,A,y,xsP));
  M.yMid.forEach(y=>gbar(bb,y,A-bb,y,xsP));
  [xL,xR].forEach(x=>gbar(x,bb,x,B-bb,ysP));
  M.wings.forEach(k=>{const g=k.grill;
    if(k.end){const mx0=k.side==='W2'?k.x0:k.x0+bb,mx1=k.side==='W2'?k.x1-bb:k.x1;[g.yA,g.yB].forEach(y=>gbar(k.x0,y,k.x1,y,g.xsW));g.yM.forEach(y=>gbar(mx0,y,mx1,y,g.xsW));gbar(g.far,k.y0+bb,g.far,k.y1-bb,g.ysW)}
    else{const sy0=k.side==='W3'?k.y0:k.y0+bb,sy1=k.side==='W3'?k.y1-bb:k.y1;gbar(k.x0,g.far,k.x1,g.far,g.xsW);g.yM.forEach(y=>gbar(k.x0+bb,y,k.x1-bb,y,g.xsW));[g.xa,g.xb].forEach(x=>gbar(x,sy0,x,sy1,g.ysW))}});

  /* пол */
  const zj=H0+hb+hj/2;
  M.xsJ=grid(bj/2,A-bj/2,sj,bj,0);
  [bj/2,B-bj/2].forEach(y=>bar('floor','ОБ',[bj,hj],1,[0,y,zj],[A,y,zj],[0,0,1],hj,bj,{splitAt:rel(M.xsJ,0)}));
  M.xsJ.forEach(x=>bar('floor','Л',[bj,hj],1,[x,bj,zj],[x,B-bj,zj],[0,0,1],hj,bj,{splitAt:rel(M.yMid,bj)}));
  M.wings.forEach(k=>{const g=k.grill;
    if(k.end){const xs=grid(k.x0+bj/2,k.x1-bj/2,sj,bj,0);[k.y0+bj/2,k.y1-bj/2].forEach(y=>bar('floor','ОБ',[bj,hj],1,[k.x0,y,zj],[k.x1,y,zj],[0,0,1],hj,bj,{splitAt:rel(xs,k.x0)}));
      xs.forEach(x=>bar('floor','Л',[bj,hj],1,[x,k.y0+bj,zj],[x,k.y1-bj,zj],[0,0,1],hj,bj,{splitAt:rel(g.yM,k.y0+bj)}));k.xsJ=xs}
    else{const xs=grid(k.x0+bj/2,k.x1-bj/2,sj,bj,0),W3=k.side==='W3',yf=W3?k.y1-bj/2:k.y0+bj/2,j0=W3?B:k.y0+bj,j1=W3?k.y1-bj:0;bar('floor','ОБ',[bj,hj],1,[k.x0,yf,zj],[k.x1,yf,zj],[0,0,1],hj,bj,{splitAt:rel(xs,k.x0)});
      xs.forEach(x=>bar('floor','Л',[bj,hj],1,[x,j0,zj],[x,j1,zj],[0,0,1],hj,bj,{splitAt:rel(g.yM,j0)}));k.xsJ=xs}});

  /* стены */
  const mkW=(id,name,x0,y0,ux,uy,L,origin,ext,dd,s,bearing)=>({id,name,x0,y0,ux,uy,L,origin,ext,d:dd,b,s,bearing,ops:[],extra:[]});
  const ss=Math.max(300,n(P.studS));
  M.walls.push(mkW('W1','Стена 1',0,d/2,1,0,A,0,true,d,ss,true));
  M.walls.push(mkW('W2','Стена 2',A-d/2,d,0,1,B-2*d,-d,true,d,ss,false));
  M.walls.push(mkW('W3','Стена 3',0,B-d/2,1,0,A,0,true,d,ss,true));
  M.walls.push(mkW('W4','Стена 4',d/2,d,0,1,B-2*d,-d,true,d,ss,false));
  M.wings.forEach(k=>{const {x0,y0,x1,y1,ids,id0,D,Wd,nm}=k;let ws;
    const S=(q,t)=>`Стена ${id0+q} (${nm}, ${t})`;
    if(k.end){const W2=k.side==='W2',xe=W2?x1-d/2:x0+d/2;ws=[mkW(ids[0],S(0,'боковая'),x0,y0+d/2,1,0,D,0,true,d,ss,false),mkW(ids[1],S(1,'торцевая'),xe,y0+d,0,1,Wd-2*d,-d,true,d,ss,false),mkW(ids[2],S(2,'боковая'),x0,y1-d/2,1,0,D,0,true,d,ss,false)];
      ws[0].inw=[0,1];ws[1].inw=[W2?-1:1,0];ws[2].inw=[0,-1]}
    else{const W3=k.side==='W3',ys=W3?y0:y0+d,ye=W3?y1-d/2:y0+d/2;ws=[mkW(ids[0],S(0,'боковая'),x0+d/2,ys,0,1,D-d,0,true,d,ss,false),mkW(ids[1],S(1,'торцевая'),x0,ye,1,0,Wd,0,true,d,ss,false),mkW(ids[2],S(2,'боковая'),x1-d/2,ys,0,1,D-d,0,true,d,ss,false)];
      ws[0].inw=[1,0];ws[1].inw=[0,W3?-1:1];ws[2].inw=[-1,0]}
    ws.forEach(w=>{w.wing=k.i;M.walls.push(w)})});
  const dp=n(P.partH), ps=Math.max(300,n(P.partS));
  /* перегородки: в основном доме или в крыле — в том прямоугольнике, где лежит большая часть перегородки */
  const inRects=[[d,d,A-d,B-d],...M.wings.map(k=>k.inner)];
  (P.walls||[]).forEach((iw,i)=>{
    const id='I'+(i+1),hz=iw.axis==='x',c=n(iw.c);let best=null,bo=0;
    inRects.forEach(r=>{const lo=hz?r[1]:r[0],hi=hz?r[3]:r[2],a0=hz?r[0]:r[1],a1=hz?r[2]:r[3];if(c<lo+dp/2||c>hi-dp/2)return;const ov=Math.min(n(iw.to),a1)-Math.max(n(iw.from),a0);if(ov>bo){bo=ov;best=[a0,a1]}});
    if(!best||bo<400){M.errs.push({wall:id,msg:'Перегородка '+id+' вне контура дома или короче 400 мм'});return}
    const f=Math.max(n(iw.from),best[0]),e=Math.min(n(iw.to),best[1]);
    M.walls.push(hz?mkW(id,'Перегородка '+id,f,c,1,0,e-f,-f,false,dp,ps,!!iw.bearing):mkW(id,'Перегородка '+id,c,f,0,1,e-f,-f,false,dp,ps,!!iw.bearing));
  });

  /* крыши крыльев: двускатные, тот же уклон и высота карниза; крыло сзади — конёк поперёк основного, две ендовы */
  M.wingRoofs=[];
  M.wings.forEach(k=>{if(!gable){M.errs.push({wall:'K'+(k.i+1),msg:`Крыша крыла ${k.i+1} не построена: крыши крыльев делаются при двускатной крыше дома`});return}
    if(!k.end&&k.Wd>B){M.errs.push({wall:'K'+(k.i+1),msg:`Крыша крыла ${k.i+1} не построена: крыло шире дома (${k.Wd} > ${B} мм) — его конёк оказался бы выше основного. Уменьшите ширину крыла`});return}
    M.wingRoofs.push({k,half:k.Wd/2,W2:k.end,end:k.end,xc:(k.x0+k.x1)/2,yc:(k.y0+k.y1)/2})});
  if(gable){const zb=M.mans?M.zm:zr0;
    M.wingRoofs.forEach(r=>{const k=r.k,id='GК'+(k.i+1),nm=`Фронтон крыла ${k.i+1}`,fe={W2:k.x1-d/2,W4:k.x0+d/2,W3:k.y1-d/2,W1:k.y0+d/2}[k.side],w=k.end?mkW(id,nm,fe,k.y0,0,1,k.Wd,0,true,d,ss,false):mkW(id,nm,k.x0,fe,1,0,k.Wd,0,true,d,ss,false);w.inw=k.end?[k.side==='W2'?-1:1,0]:[0,k.side==='W3'?-1:1];
      w.gable=true;w.wingGable=true;w.zb=zr0;w.top=u=>Math.min(u,k.Wd-u)*tn;w.ridgeH=R(r.half*tn+hr/cs);M.walls.push(w)});
    [['G4','Фронтон 4 (левый)',d/2],['G2','Фронтон 2 (правый)',A-d/2]].forEach(([id,name,x])=>{const w=mkW(id,name,x,0,0,1,B,0,true,d,ss,false);w.gable=true;w.zb=zb;w.top=u=>zU(u)-zb;M.walls.push(w)});
    if(M.mans&&M.mansOk)[['K1','Стенка мансарды 1',M.yk],['K3','Стенка мансарды 3',B-M.yk]].forEach(([id,name,y])=>{const w=mkW(id,name,d,y,1,0,A-2*d,-d,false,M.kneeD,sr,true);w.zb=M.zm;w.H=M.kneeH;w.knee=true;M.walls.push(w)})}
  // угловые стойки и стойки примыкания
  const warm=P.corner!=='three';M.warm=warm;
  {const r=nearestRow(frameRows(x=>x.b>=40&&x.h>=90&&x.h<=120),45,100);M.fb=r?[r.b,r.h]:[45,100]}
  ['W1','W3'].forEach(id=>{const w=M.walls.find(x=>x.id===id);if(warm){w.corners=[d,w.L-d];w.cside=id==='W1'?1:-1}else w.extra.push(d+b/2,w.L-d-b/2)});
  M.walls.filter(w=>!w.ext&&w.zb==null).forEach(w=>{[0,w.L].forEach(u=>{const px=w.x0+w.ux*u,py=w.y0+w.uy*u;
    M.walls.forEach(h=>{if(h===w||h.ux===w.ux||h.zb!=null)return;const dd=h.ux?Math.abs(py-h.y0):Math.abs(px-h.x0),pr=h.ux?px-h.x0:py-h.y0;
      if(dd<=h.d/2+25&&pr>0&&pr<h.L){if(warm){const ox=w.x0+w.ux*(u?0:w.L),oy=w.y0+w.uy*(u?0:w.L),hx=h.x0+h.ux*pr,hy=h.y0+h.uy*pr,side=Math.sign(-h.uy*(ox-hx)+h.ux*(oy-hy))||1;(h.junc=h.junc||[]).push({u:pr,side,dp:w.d})}else h.extra.push(pr)}})})});
  // проёмы
  const lH=n(P.lintelH);
  (P.openings||[]).forEach((o,i)=>{
    const w=M.walls.find(x=>x.id===o.wall);
    const op={i,wall:o.wall,type:o.type==='door'?'door':'window',x:n(o.x),w:n(o.w),h:n(o.h),sill:o.type==='door'?0:n(o.sill),ok:true,msg:''};
    if(!w){op.ok=false;op.msg='Стена '+o.wall+' не найдена'}
    else{
      const mrg=(w.ext&&w.ux)?d+3*b:3*b;
      if(op.w<300||op.h<300){op.ok=false;op.msg='Слишком маленький проём (меньше 300 мм)'}
      else if(op.x<mrg||op.x+op.w>w.L-mrg){op.ok=false;op.msg=`Проём должен отстоять от концов стены не меньше чем на ${mrg} мм (длина стены ${R(w.L)} мм)`}
      else{const lim=w.top?Math.min(w.top(op.x-2*b),w.top(op.x+op.w+2*b))-t:(w.H??H)-M.np*t;if(op.sill+op.h+lH>lim){op.ok=false;op.msg=w.top?`Проём не помещается под скатом: верх проёма должен быть не выше ${R(lim-lH)} мм от пола мансарды/чердака`:`Перемычка ${lH} мм не помещается под обвязкой: верх проёма должен быть не выше ${R(lim-lH)} мм от пола`}}
    }
    M.ops.push(op); if(w) w.ops.push(op);
  });
  M.walls.forEach(w=>{const os=w.ops.filter(o=>o.ok).sort((a,c)=>a.x-c.x);for(let i=1;i<os.length;i++){if(os[i].x-(os[i-1].x+os[i-1].w)<4*b){os[i].ok=false;os[i].msg='Слишком близко к соседнему проёму: нужно не меньше '+4*b+' мм между проёмами'}}});
  const omk={},ocnt={window:0,door:0};
  M.ops.forEach(o=>{if(!o.ok)return;const k=o.type+'|'+o.w+'|'+o.h+'|'+o.sill;if(!omk[k]){ocnt[o.type]++;omk[k]=(o.type==='door'?'Д-':'ОК-')+ocnt[o.type]}o.mark=omk[k]});

  const pushLoc=(w,m,grp)=>{
    const PT=u=>[w.x0+w.ux*u,w.y0+w.uy*u], N=[-w.uy,w.ux,0], zB=w.zb??z0; let o;
    if(m.kind==='v'){const [x0,y0]=PT(m.u),of=m.off||0,x=x0+N[0]*of,y=y0+N[1]*of;o={p0:[x,y,zB+m.v0],p1:[x,y,zB+m.v1],up:N,sy:m.depth,sz:m.bw}}
    else if(m.kind==='d'){const a=PT(m.u0),e=PT(m.u1),of=m.off||0;o={p0:[a[0]+N[0]*of,a[1]+N[1]*of,zB+m.v0],p1:[e[0]+N[0]*of,e[1]+N[1]*of,zB+m.v1],up:N,sy:m.depth,sz:m.bw}}
    else{const a=PT(m.u0),e=PT(m.u1),zc=zB+(m.v0+m.v1)/2,of=m.off||0;o={p0:[a[0]+N[0]*of,a[1]+N[1]*of,zc],p1:[e[0]+N[0]*of,e[1]+N[1]*of,zc],up:[0,0,1],sy:m.v1-m.v0,sz:m.depth}}
    const L=m.L??(m.kind==='v'?m.v1-m.v0:m.u1-m.u0);
    if(m.kind==='d'&&m.L==null)m.L=Math.hypot(m.u1-m.u0,m.v1-m.v0);
    add({grp:m.grp||grp,role:m.role,sec:m.sec||[w.b,w.d],n:m.n||1,L,wall:w.id,loc:m,splitAt:m.splitAt,...o});
  };
  M.walls.forEach(w=>frameWall(w,M).forEach(m=>pushLoc(w,m,w.gable?'gable':w.knee?'mans':w.ext?'walls':'parts')));
  /* инсталляционный слой (финская технология): горизонтальная обрешётка по внутренней стороне наружных стен */
  if(P.instLayer){const row=findRow(45,45),sec=row?[45,45]:[50,50],io=sec[0];
    M.walls.filter(w=>/^W[1-4]$/.test(w.id)).forEach(w=>{const sg=(w.id==='W1'||w.id==='W2')?1:-1,off=sg*(w.d/2+io/2),u0=w.ux?w.d:0,u1=w.ux?w.L-w.d:w.L;
      for(let v=300;v<M.H-M.np*M.t;v+=600)pushLoc(w,{kind:'h',role:'ИО',u0,u1,v0:v-sec[1]/2,v1:v+sec[1]/2,depth:io,off,sec,splitAt:grid(w.b/2,w.L-w.b/2,w.s,w.b,w.origin).map(u=>u-u0).filter(x=>x>1)},'walls')})}
  /* жёсткость стен первого этажа: укосины по СНиП (45–60°) или плитная обшивка */
  M.rackWalls=M.walls.filter(w=>/^W\d+$/.test(w.id));
  M.rackWalls.forEach(w=>{w.segs=solidSegs(w);w.mode='sheath';
    if(P.bracing==='braces'){const br=braceLayout(w,M);if(br){w.mode='braces';w.braces=br}else{w.fallback=true}}
    if(w.mode==='braces'){const bt=n(P.braceB),bh=n(P.braceH),off=w.d/2-bt/2;
      w.braces.forEach(br=>pushLoc(w,{kind:'d',role:'УК',u0:br.u0,v0:br.v0,u1:br.u1,v1:br.v1,bw:bh,depth:bt,off,sec:[bt,bh],L:r10(Math.hypot(br.u1-br.u0,br.v1-br.v0)+100)},'walls'))}});

  /* фронтоны / надстройка */
  if(!gable)['W2','W4'].forEach(id=>{const w=M.walls.find(x=>x.id===id);
    let ys=grid(b/2,B-d-b,w.s,b,0);
    ys.forEach(y=>{const hg=zU(y)-zr0;if(hg<120)return;
      pushLoc(w,{kind:'v',role:'СФ',u:y-w.y0,v0:H+ha,v1:H+ha+hg,bw:b,depth:d,L:r10(hg+b/2*tn),grp:'gable'},'gable')})});
  M.Hr=0;
  if(!gable){const Hr=(B-d)*tn;M.Hr=Hr;const w=M.walls.find(x=>x.id==='W3');
    if(Hr>=3*t+100){const g=grid(b/2,A-b/2,w.s,b,0);
      pushLoc(w,{kind:'h',role:'ОФ',u0:0,u1:A,v0:H+ha,v1:H+ha+t,depth:d,grp:'gable',splitAt:g},'gable');
      pushLoc(w,{kind:'h',role:'ОФ',u0:0,u1:A,v0:H+ha+Hr-t,v1:H+ha+Hr,depth:d,grp:'gable',splitAt:g},'gable');
      g.forEach(u=>pushLoc(w,{kind:'v',role:'СФ',u,v0:H+ha+t,v1:H+ha+Hr-t,bw:b,depth:d,grp:'gable'},'gable'));
    }}

  /* чердачное перекрытие */
  M.xsA=grid(d/2,A-d/2,sr,ba,0);
  const za=zt+ha/2;
  M.xsA.forEach(x=>bar('attic','БП',[ba,ha],1,[x,0,za],[x,B,za],[0,0,1],ha,ba,{splitAt:M.attSup!=null?[M.attSup]:[]}));

  /* стропила */
  const xsR=[...M.xsA], barge=og>=150?[-og+br/2,A+og-br/2]:[];
  M.xsR=xsR; M.barge=barge;
  const slopes=gable?[{y0:-ov,y1:B/2,dir:1},{y0:B+ov,y1:B/2,dir:-1}]:[{y0:-ov,y1:B+ov,dir:1}];
  slopes.forEach(sl=>{sl.e=[0,sl.dir*cs,sn];sl.n=[0,-sl.dir*sn,cs];sl.zA=zs-ov*tn;sl.len=Math.abs(sl.y1-sl.y0)/cs;sl.zB=sl.zA+Math.abs(sl.y1-sl.y0)*tn});
  M.slopes=slopes;
  const at=(sl,x,s,off)=>[x,sl.y0+sl.e[1]*s+sl.n[1]*off,sl.zA+sl.e[2]*s+sl.n[2]*off];
  const Lraf=r10(M.Ls+hr*tn);
  /* стропила ската, в который врезается боковое крыло, укорачиваются до ендовы (нарожники) */
  const cutS=(sl,x)=>{if(!gable)return 0;let sv=0;(M.wingRoofs||[]).filter(r=>!r.end&&(r.k.side==='W3'?sl.dir<0:sl.dir>0)).forEach(r=>{const dx=Math.abs(x-r.xc);if(dx<r.half+ov)sv=Math.max(sv,(ov+r.half-dx)/cs)});return sv};
  /* узел на коньке: «в стык с подрезкой» — торцы пары сходятся на оси конька; «внахлёст» — стропила второго ската сдвинуты на толщину и заходят за конёк на 1,5h */
  const lap=gable&&P.ridgeJoint==='lap',ext=lap?r10(1.5*hr):0;M.ridgeJoint=gable?(lap?'lap':'butt'):null;M.ridgeExt=ext;
  /* свес: кобылка (короткая доска сбоку стропила) — стропило обрезано у стены; авто — при свесе от 600 мм или если стропило со свесом длиннее доски на складе */
  const rRow=findRow(br,hr),maxStock=rRow?Math.max(...parseStocks(rRow.lens||'6000')):6000,fill=gable&&(P.eaveFilly==='yes'||(P.eaveFilly!=='no'&&(ov>=600||Lraf>maxStock)));
  const fr=fill?(nearestRow(frameRows(r=>r.b>=40&&r.h>=95&&r.h<=hr),50,150)||{b:br,h:Math.min(hr,150)}):null,fOver=Math.max(600,ov),tail=50;
  M.filly=fill?{b:fr.b,h:fr.h,over:fOver,tail,L:r10((ov+fOver)/cs+fr.h*tn)}:null;
  const kb=gable&&!lap&&!M.purlin?br:0;
  slopes.forEach(sl=>{[...xsR.map(x=>[x,'СН']),...barge.map(x=>[x,'СНФ'])].forEach(([x,role])=>{const sv=cutS(sl,x);if(sv>=sl.len-80)return;
    const xx=lap&&sl.dir<0?(x>A/2&&role==='СНФ'?x-br:x+br):x,fl=fill&&role==='СН'&&sv===0,s0=fl?(ov-tail)/cs:sv,s1=sl.len+ext-kb/2/cs,yEnd=sl.y1+sl.dir*(ext*cs-kb/2);
    const pc=hr/2*tn;bar('roof',sv>0?'НР':role,[br,hr],1,at(sl,xx,sv>0?s0:s0-pc,hr/2),at(sl,xx,s1+pc,hr/2),sl.n,hr,br,{L:r10(s1-s0+hr*tn),cuts:[sv>0?null:{y:sl.y0+sl.dir*s0*cs},{y:yEnd}]});
    if(fl){const xf=xx+(x>A/2?-1:1)*(br+fr.b)/2;bar('roof','КОБ',[fr.b,fr.h],1,at(sl,xf,0,hr-fr.h/2),at(sl,xf,(ov+fOver)/cs,hr-fr.h/2),sl.n,fr.h,fr.b,{L:M.filly.L,cuts:[{y:sl.y0},null]})}})});
  M.zRidge=gable?zs+B/2*tn+hr/cs:zs+(B+ov)*tn+hr/cs;
  M.purlin=gable&&!M.mans&&P.rafterSys==='purlin';
  if(M.purlin){const pb=n(P.purB),ph=n(P.purH),qb=n(P.postB),qh=n(P.postH),ps=Math.max(1000,n(P.postS)),zPt=zs+(B/2-pb/2)*tn,zL1=zt+ha+qb;
    const nn=Math.max(1,Math.ceil((A-2*d)/ps)),xsP=[d/2,...[...Array(nn-1)].map((_,i)=>d+(A-2*d)*(i+1)/nn),A-d/2];
    bar('roof','КП',[pb,ph],1,[-og,B/2,zPt-ph/2],[A+og,B/2,zPt-ph/2],[0,0,1],ph,pb,{splitAt:rel(xsP,-og)});
    xsP.forEach(x=>bar('roof','СТК',[qb,qh],1,[x,B/2,zL1],[x,B/2,zPt-ph],[0,1,0],qh,qb,{}));
    bar('roof','ЛЖ',[qb,qh],1,[0,B/2,zt+ha+qb/2],[A,B/2,zt+ha+qb/2],[0,0,1],qb,qh,{splitAt:rel(M.xsA,0)});
    const span=Math.max(...xsP.slice(1).map((x,i)=>x-xsP[i])),Lp=zPt-ph-zL1,aS=P.purStruts?Math.max(0,Math.min(Lp,span/3)):0;
    if(aS>=300)xsP.forEach((x,i)=>[-1,1].forEach(dir=>{const nb=xsP[i+dir];if(nb==null)return;bar('roof','ПДК',[qb,qh],1,[x+dir*qh/2,B/2,zL1],[x+dir*(qh/2+aS),B/2,zPt-ph],[0,1,0],qh,qb,{L:r10(Math.hypot(aS,Lp)+qh)})}));
    let nC=0,cs2=null;if(P.collar){const zc=zL1+Lp*.6,yC=(zc-zr0)/tn,row=findRow(25,150),sc=row?[25,150]:[n(P.braceB),n(P.braceH)];cs2=sc;
      if(yC>d&&yC<B/2-pb)xsR.forEach(x=>{[-1,1].forEach(sd=>bar('roof','СХ',sc,1,[x+sd*(br/2+sc[0]/2),yC,zc],[x+sd*(br/2+sc[0]/2),B-yC,zc],[0,0,1],sc[1],sc[0],{}));nC++})}
    M.pur={pb,ph,qb,qh,xs:xsP,zPt,Lpost:Lp,notch:pb/2*tn,span,aS,nC,cs2,onWall:M.attSup!=null&&Math.abs(M.attSup-B/2)<=300}}
  if(gable&&!M.purlin&&P.ridgeJoint!=='lap'){const zTop=zs+B/2*tn+hr/cs;bar('roof','КБ',[br,hr],1,[-og,B/2,zTop-hr/2],[A+og,B/2,zTop-hr/2],[0,0,1],hr,br,{splitAt:rel(xsR,-og)})}
  if(M.mans&&M.mansOk){const hc=150,yT=(M.zc+hc/2-zr0-hr/cs)/tn;M.yT=yT;xsR.forEach(x=>bar('mans','РГ',[50,hc],1,[x+br,yT,M.zc+hc/2],[x+br,B-yT,M.zc+hc/2],[0,0,1],hc,50,{}))}
  if(P.strut&&!M.mans&&!M.purlin){(gable?[B/4,3*B/4]:[B/2]).forEach(y=>xsR.forEach(x=>{const hh=zU(y)-zr0;bar('roof','ПК',[br,150],1,[x+br,y,zr0],[x+br,y,zr0+hh],[0,1,0],150,br,{})}))}
  M.strutY=P.strut&&!M.mans&&!M.purlin?(gable?[B/4,3*B/4]:[B/2]):[];
  const cb=mat.counter, lt=mat.lath;
  slopes.forEach(sl=>{
    if(cb)[...xsR,...barge].forEach(x=>bar('lath','КР',[cb[0],cb[1]],1,at(sl,x,0,hr+cb[0]/2),at(sl,x,sl.len,hr+cb[0]/2),sl.n,cb[0],cb[1]));
    const offL=hr+(cb?cb[0]:0)+lt[0]/2, rows=[];
    for(let s=60;s<sl.len-120;s+=mat.step) rows.push(s); rows.push(sl.len-60);
    rows.forEach(s=>{const q=at(sl,0,s,offL);bar('lath','ОР',[lt[0],lt[1]],1,[-og,q[1],q[2]],[A+og,q[1],q[2]],sl.n,lt[0],lt[1],{splitAt:rel([...xsR,...barge],-og)})});
    sl.rows=rows.length;
    const offC=hr+(cb?cb[0]:0)+lt[0]+6, c0=at(sl,0,sl.len/2,offC);
    bar('cover',null,null,1,[-og,c0[1],c0[2]],[A+og,c0[1],c0[2]],sl.n,10,sl.len,{});
    [-og-12,A+og+12].forEach(x=>bar('lath','ВД',[25,150],1,at(sl,x,0,hr/2),at(sl,x,sl.len,hr/2),sl.n,150,25));
    const ye=sl.y0-sl.dir*12, ze=sl.zA+hr/cs/2;
    bar('lath','ЛД',[25,150],1,[-og,ye,ze],[A+og,ye,ze],[0,0,1],150,25,{splitAt:rel([...xsR,...barge],-og)});
  });
  M.roofArea=slopes.reduce((s,sl)=>s+sl.len*(A+2*og),0)/1e6;
  /* крыши крыльев */
  const zE=zs-ov*tn,offC=hr+(cb?cb[0]:0)+lt[0]+6;
  const rafter=(px,py,ux,uy,t0,t1,role,n=1)=>{const nn=[-ux*sn,-uy*sn,cs],B0=t=>[px+ux*t,py+uy*t,zE+t*tn],q=(t,o)=>{const b=B0(t);return [b[0]+nn[0]*o,b[1]+nn[1]*o,b[2]+nn[2]*o]};
    return {nn,q,m:role?bar('roof',role,[br,hr],n,q(t0,hr/2),q(t1,hr/2),nn,hr,br*n,{L:r10((t1-t0)/cs+hr*tn)}):null}};
  M.roofInfo={eaves:gable?2*(A+2*og):(A+2*og),ridge:gable?A+2*og:0,valleys:0,valleyN:0};
  /* крыши крыльев в системе стороны: a — вдоль стены, r — наружу. Шаг стропил привязан к осям дома (k.o) */
  M.wingRoofs.forEach(r=>{const k=r.k,h=r.half,T=h+ov,zRk=zs+h*tn+hr/cs,G=k.G,Tv=k.T,Nv=k.N,a0=k.off,a1=k.off+k.Wd,ac=(a0+a1)/2,D=k.D,re=D+og,zA0=zE;
    const P3=(a,rr,z)=>[...G(a,rr),z],mv=(p,rr)=>[p[0]+Nv[0]*rr,p[1]+Nv[1]*rr,p[2]],A_=(x,y)=>Tv[0]?x:y;
    const slope=(ae,dir,rs,rEnd)=>{const st=G(ae,0),f=rafter(st[0],st[1],Tv[0]*dir,Tv[1]*dir,0,T,null),rows=[];for(let s0=60;s0<T/cs-120;s0+=mat.step)rows.push(s0*cs);rows.push(T-60*cs);
      rows.forEach(t=>{const a=f.q(t,hr+(cb?cb[0]:0)+lt[0]/2),r0=rs(t);bar('lath','ОР',[lt[0],lt[1]],1,mv(a,r0),mv(a,rEnd),f.nn,lt[0],lt[1],{splitAt:rel(ts,r0)})});
      const c=f.q(T/2,offC);bar('cover',null,null,1,mv(c,rs(0)),mv(c,rEnd),f.nn,10,T/cs,{})};
    let ts;
    if(k.end){ts=grid(br/2,re-br/2,sr,br,k.o);
      ts.forEach((rr,i)=>{const role=(i===ts.length-1&&og>=150)?'СНФ':'СН',p=G(a0-ov,rr),q=G(a1+ov,rr);rafter(p[0],p[1],Tv[0],Tv[1],0,T,role);rafter(q[0],q[1],-Tv[0],-Tv[1],0,T,role);
        if(rr>br&&rr<D-br)bar('attic','БП',[ba,ha],1,P3(a0,rr,za),P3(a1,rr,za),[0,0,1],ha,ba,{})});
      bar('roof','КБ',[br,hr],1,P3(ac,0,zRk-hr/2),P3(ac,re,zRk-hr/2),[0,0,1],hr,br,{splitAt:rel(ts,0)});
      slope(a0-ov,1,()=>0,re);slope(a1+ov,-1,()=>0,re);
      r.polys=[{pl:[[a0-ov,0],[a0-ov,re],[ac,re],[ac,0]].map(q=>G(...q)),z:(x,y)=>zA0+(A_(x,y)-(a0-ov))*tn,sk:[2,3]},{pl:[[ac,0],[ac,re],[a1+ov,re],[a1+ov,0]].map(q=>G(...q)),z:(x,y)=>zA0+(a1+ov-A_(x,y))*tn,sk:[0,3]}];
      r.ridge=[G(ac,0),G(ac,re)];r.valleys=[];
      M.roofArea+=2*T/cs*re/1e6;M.roofInfo.eaves+=2*re;M.roofInfo.ridge+=re;r.ridgeZ=zRk}
    else{ts=grid(-h+br,re-br/2,sr,br,k.o);
      ts.forEach((rr,i)=>{const t0=Math.max(0,ov-rr);if(t0>T-80)return;const role=t0>0?'НР':(i===ts.length-1&&og>=150)?'СНФ':'СН',p=G(a0-ov,rr),q=G(a1+ov,rr);
        rafter(p[0],p[1],Tv[0],Tv[1],t0,T,role);rafter(q[0],q[1],-Tv[0],-Tv[1],t0,T,role);
        if(rr>ba&&rr<D-ba)bar('attic','БП',[ba,ha],1,P3(a0,rr,za),P3(a1,rr,za),[0,0,1],ha,ba,{})});
      bar('roof','КБ',[br,hr],1,P3(ac,-h,zRk-hr/2),P3(ac,re,zRk-hr/2),[0,0,1],hr,br,{splitAt:rel(ts,-h)});
      const zAp=zs+h*tn;r.valleys=[];[a0-ov,a1+ov].forEach(ae=>{const p0=P3(ac,-h,zAp+hr/2),p1=P3(ae,ov,zE+hr/2),L=dist3(p0,p1);bar('roof','ЕН',[br,hr],2,p0,p1,[0,0,1],hr,2*br,{L:r10(L+hr)});M.roofInfo.valleys+=L;M.roofInfo.valleyN++;r.valleys.push([G(ac,-h),G(ae,ov)])});
      slope(a0-ov,1,t=>Math.min(re,ov-t),re);slope(a1+ov,-1,t=>Math.min(re,ov-t),re);
      r.polys=[{pl:[[a0-ov,ov],[ac,-h],[ac,re],[a0-ov,re]].map(q=>G(...q)),z:(x,y)=>zA0+(A_(x,y)-(a0-ov))*tn,sk:[0,1]},{pl:[[a1+ov,ov],[a1+ov,re],[ac,re],[ac,-h]].map(q=>G(...q)),z:(x,y)=>zA0+(a1+ov-A_(x,y))*tn,sk:[2,3]}];
      r.ridge=[G(ac,-h),G(ac,re)];
      M.roofArea+=2*T/cs*(re-ov)/1e6;M.roofInfo.eaves+=2*(re-ov)-(k.Wd+2*ov);M.roofInfo.ridge+=re+h;r.ridgeZ=zRk}});

  M.rooms=detectRooms(M,P);
  return M;
}
