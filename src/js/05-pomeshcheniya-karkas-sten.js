/* ---------- АР: помещения ---------- */
const ROOM_KIND={living:'жилое',aux:'подсобное',tech:'техническое'};
/* помещения ищутся по стенам: внутренний контур режется гранями перегородок на прямоугольные ячейки, свободные соседние ячейки объединяются */
function detectRooms(M,P){
  const d=M.d,A=M.A,B=M.B,obs=[];
  M.walls.filter(w=>!w.ext&&w.zb==null).forEach(w=>{const x0=w.x0-(w.uy?w.d/2:0),y0=w.y0-(w.ux?w.d/2:0),x1=w.ux?w.x0+w.L:w.x0+w.d/2,y1=w.uy?w.y0+w.L:w.y0+w.d/2;const tol=40;obs.push(w.ux?[x0-tol,y0,x1+tol,y1]:[x0,y0-tol,x1,y1+tol])}); /* допуск на примыкание: торец перегородки, не доведённый до стены на 40 мм, считается примкнувшим */
  const rects=[[d,d,A-d,B-d],...(M.wings||[]).map(k=>k.inner)];
  const cut=(lo,hi,vals)=>[...new Set([lo,hi,...vals.filter(v=>v>lo+1&&v<hi-1)].map(v=>Math.round(v)))].sort((a,c)=>a-c);
  const xs=cut(Math.min(...rects.map(r=>r[0])),Math.max(...rects.map(r=>r[2])),[...obs.flatMap(o=>[o[0],o[2]]),...rects.flatMap(r=>[r[0],r[2]])]),
        ys=cut(Math.min(...rects.map(r=>r[1])),Math.max(...rects.map(r=>r[3])),[...obs.flatMap(o=>[o[1],o[3]]),...rects.flatMap(r=>[r[1],r[3]])]);
  const nx=xs.length-1,ny=ys.length-1,id=(i,j)=>j*nx+i,par=[...Array(nx*ny).keys()];
  const fnd=a=>{while(par[a]!==a){par[a]=par[par[a]];a=par[a]}return a},uni=(a,c)=>{a=fnd(a);c=fnd(c);if(a!==c)par[c]=a};
  const free=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const cx=(xs[i]+xs[i+1])/2,cy=(ys[j]+ys[j+1])/2;free[id(i,j)]=rects.some(r=>cx>r[0]&&cx<r[2]&&cy>r[1]&&cy<r[3])&&!obs.some(o=>cx>o[0]&&cx<o[2]&&cy>o[1]&&cy<o[3])}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){if(!free[id(i,j)])continue;if(i+1<nx&&free[id(i+1,j)])uni(id(i,j),id(i+1,j));if(j+1<ny&&free[id(i,j+1)])uni(id(i,j),id(i,j+1))}
  const reg=new Map();
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=id(i,j);if(!free[k])continue;const r=fnd(k);if(!reg.has(r))reg.set(r,{cells:[],area:0,best:null});const g=reg.get(r),c=[xs[i],ys[j],xs[i+1],ys[j+1]],a=(c[2]-c[0])*(c[3]-c[1]);g.cells.push(c);g.area+=a;if(!g.best||a>g.best.a)g.best={a,c}}
  const out=[...reg.values()].filter(g=>g.area>=.3e6).map(g=>({cells:g.cells,area:g.area/1e6,x:R((g.best.c[0]+g.best.c[2])/2),y:R((g.best.c[1]+g.best.c[3])/2),
    x0:Math.min(...g.cells.map(c=>c[0])),y0:Math.min(...g.cells.map(c=>c[1])),x1:Math.max(...g.cells.map(c=>c[2])),y1:Math.max(...g.cells.map(c=>c[3]))}));
  out.sort((a,c)=>(c.y1-a.y1)||(a.x0-c.x0));
  const inR=(r,x,y)=>r.cells.some(c=>x>=c[0]-1&&x<=c[2]+1&&y>=c[1]-1&&y<=c[3]+1),used=new Set();
  out.forEach((r,i)=>{r.no=i+1;const k=(P.rooms||[]).findIndex((q,qi)=>!used.has(qi)&&inR(r,+q.x,+q.y));
    if(k>=0){used.add(k);const q=P.rooms[k];r.ref=k;r.name=q.name||('Помещение '+r.no);r.kind=ROOM_KIND[q.kind]?q.kind:'aux'}else{r.ref=-1;r.name='Помещение '+r.no;r.kind='aux'}});
  return out;
}
function tep(M){
  const rs=M.rooms||[],tot=rs.reduce((s,r)=>s+r.area,0),liv=rs.filter(r=>r.kind==='living').reduce((s,r)=>s+r.area,0);
  const mans=M.mans&&M.mansOk?M.mansArea:0,wA=(M.wings||[]).reduce((t,k)=>t+k.area,0),build=M.A*M.B/1e6+wA;
  const hRoof=M.gable?(M.zRidge-M.zr0):(M.Hr||0),vol=build*((M.zt+M.ha-M.H0)/1000)+M.A*M.B*hRoof/2/1e9;/* крыша крыльев — следующий этап */
  return {build,tot,liv,mans,total:tot+mans,vol,floors:M.mans&&M.mansOk?'1 + мансарда':'1'}
}

/* сплошные участки стены (без проёмов и стоек обрамления) */
function solidSegs(w){const b=w.b,ops=w.ops.filter(o=>o.ok).sort((a,c)=>a.x-c.x),out=[];let cur=0;
  ops.forEach(o=>{const a=o.x-2*b;if(a-cur>1)out.push([cur,a]);cur=o.x+o.w+2*b});if(w.L-cur>1)out.push([cur,w.L]);return out}
/* укосины: угол 45–60° к горизонту, от нижней до верхней обвязки на сплошном участке; нужны обоих направлений */
function braceLayout(w,M){
  const t=w.b,Hs=(w.H??M.H)-M.np*t,run45=Hs,run60=Hs/Math.tan(rad(60)),list=[];let nR=0,nL=0;
  w.segs.forEach(([a,e])=>{const ws=e-a;
    const put=(dir,run)=>{const th=Math.atan(Hs/run);if(dir>0){list.push({u0:a,v0:t,u1:a+run,v1:t+Hs,th,run,dir});nR++}else{list.push({u0:e,v0:t,u1:e-run,v1:t+Hs,th,run,dir});nL++}};
    if(ws>=2*run60){const run=Math.min(run45,ws/2);put(1,run);put(-1,run)}
    else if(ws>=run60){put(nR<=nL?1:-1,Math.min(run45,ws))}});
  return nR&&nL?list:null;
}
function braceCap(M,br){
  const b=+M.P.braceB,h=+M.P.braceH,s=+M.P.studS,c=Math.cos(br.th),A=b*h,lam=(s/c)/(.289*b),phi=lam<=70?1-.8*(lam/100)**2:3000/lam**2;
  const Nc=phi*A*R_C/1000,Nt=A*R_T/1000,d=.4,cc=b/10,Tn=Math.min(.35*cc*d,Math.min(2.5*d*d+.01*cc*cc,4*d*d)),nEff=6+Math.floor(br.run/s)+1,Nj=nEff*Tn;
  return {c:Math.min(Nc,Nj)*c,t:Math.min(Nt,Nj)*c,Nc,Nt,Nj,lam,nEff,Tn};
}
function wallRack(M,w){
  const P=M.P,Hs=(w.H??M.H)-M.np*M.t;
  if(w.mode==='braces'){let pos=0,neg=0;w.braces.forEach(br=>{const k=braceCap(M,br);if(br.dir>0){pos+=k.c;neg+=k.t}else{pos+=k.t;neg+=k.c}});
    return {cap:Math.min(pos,neg),desc:`укосины: ${w.braces.length} шт, ${w.braces.map(b=>R(b.th*180/Math.PI)+'°').join(', ')}`,solid:w.segs.reduce((s,[a,e])=>s+e-a,0)}}
  const SM=SHEATH[P.sheathMat]||SHEATH.osb9,fv=SM.fv[+P.nailStep]||SM.fv[150],bmin=Math.max(600,Hs/4);let cap=0,sol=0;
  w.segs.forEach(([a,e])=>{const bi=e-a;if(bi<bmin)return;sol+=bi;cap+=fv*bi/1000*Math.min(1,bi/(Hs/2))});
  return {cap,desc:`${SM.n}, гвозди шаг ${P.nailStep}`,solid:sol};
}
function pileOk(C){return C.checks.every(c=>!(c.id==='pile'||c.id==='heave')||c.ok)}
function buildFull(P){
  let M=build(P),C=calc(M);
  if(P.pileLen==='auto'&&!pileOk(C)){const M0=M,C0=C,lens=PILE_LENS[M.pileKind]||[];let i=lens.indexOf(M.pileLen);
    while(!pileOk(C)&&i>=0&&i<lens.length-1){i++;M=build(P,{pileLen:lens[i]});C=calc(M)}
    if(!pileOk(C)){M=M0;C=C0}}
  return {M,C};
}
function frameWall(w,M){
  const P=M.P,b=w.b,t=b,Hs=(w.H??M.H)-M.np*t,L=w.L,s=w.s,d=w.d,lH=+P.lintelH,lp=+P.lintelPly;
  const topF=w.top?(u=>w.top(u)):(()=>t+Hs), bev=w.top?b/2*M.tn:0;
  const out=[];
  const V=(role,u,v0,v1,ex={})=>out.push({kind:'v',role,u,v0,v1,bw:b,depth:d,...ex});
  const Hh=(role,u0,u1,v0,v1,ex={})=>out.push({kind:'h',role,u0,u1,v0,v1,depth:d,...ex});
  const ops=w.ops.filter(o=>o.ok).sort((a,c)=>a.x-c.x);
  const zone=u=>ops.some(o=>u>o.x-2*b-1&&u<o.x+o.w+2*b+1);
  const g0=grid(b/2,L-b/2,s,b,w.origin);
  const st=[];
  g0.forEach((u,i)=>{if(i===0||i===g0.length-1||!zone(u))st.push(u)});
  w.extra.forEach(u=>{if(u>b&&u<L-b&&!zone(u)&&!st.some(x=>Math.abs(x-u)<b))st.push(u)});
  st.sort((a,c)=>a-c);
  const allV=[...st]; ops.forEach(o=>allV.push(o.x-1.5*b,o.x+o.w+1.5*b));
  allV.sort((a,c)=>a-c);
  let segs=[[0,L]];
  ops.filter(o=>o.type==='door').forEach(o=>{segs=segs.flatMap(([a,e])=>(o.x>=e||o.x+o.w<=a)?[[a,e]]:[[a,o.x],[o.x+o.w,e]].filter(([p,q])=>q-p>1))});
  segs.forEach(([a,e])=>Hh('НО',a,e,0,t,{splitAt:rel(allV.filter(u=>u>a&&u<e),a)}));
  if(!w.top){Hh('ВО',0,L,Hs+t,Hs+2*t,{splitAt:rel(allV,0)});if(M.np>2)Hh('ВО',0,L,Hs+2*t,Hs+3*t,{splitAt:rel(allV,0).slice(1)})}
  st.forEach(u=>{const tv=topF(u);if(tv-t>=120)V('С',u,t,tv,w.top?{L:r10(tv-t+bev)}:{})});
  /* тёплый угол и тёплое примыкание: доска плашмя у внутренней грани вместо замкнутой полости */
  if(M.warm&&!w.top){const [fb,fh]=M.fb,FB=(u,side)=>{if(zone(u))return;out.push({kind:'v',role:'УТ',u,v0:t,v1:t+Hs,bw:fh,depth:fb,off:side*(d/2-fb/2),sec:[fb,fh]})};
    (w.corners||[]).forEach(u=>FB(u,w.cside||1));
    (w.junc||[]).forEach(j=>[-1,1].forEach(k=>{const u=j.u+k*fh/2;if(st.some(x=>Math.abs(x-u)<(fh+b)/2-1))return;FB(u,j.side)}))}
  ops.forEach(o=>{
    const top=o.sill+o.h;
    [o.x-1.5*b,o.x+o.w+1.5*b].forEach(u=>{const tv=topF(u);V('С',u,t,tv,w.top?{L:r10(tv-t+bev)}:{})});
    V('СП',o.x-.5*b,t,top); V('СП',o.x+o.w+.5*b,t,top);
    out.push({kind:'h',role:'ПР',u0:o.x-b,u1:o.x+o.w+b,v0:top,v1:top+lH,depth:lp*b,n:lp,sec:[b,lH],op:o});
    const inner=g0.filter(u=>u>o.x+b/2&&u<o.x+o.w-b/2);
    inner.forEach(u=>{const tv=topF(u);if(tv-(top+lH)>=60)V('СК',u,top+lH,tv,w.top?{L:r10(tv-top-lH+bev)}:{})});
    if(o.type==='window'){Hh('Р',o.x,o.x+o.w,o.sill-b,o.sill);if(o.sill-b-t>=60)inner.forEach(u=>V('СК',u,t,o.sill-b))}
  });
  return out;
}

