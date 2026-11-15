/* ---------- фасады: ортогональные виды модели (стены по контуру, фронтоны, кровля с толщиной, проёмы, сваи), видимость — по глубине ---------- */
function facadeFaces(){
  const {A,B,ov,og,tn,cs,hr,H0,hb,z0,zr0}=M,zA=M.slopes[0].zA,T=hr/cs+50,F=[];
  const rects=[[0,0,A,B],...(M.wings||[]).map(k=>[k.x0,k.y0,k.x1,k.y1])];
  /* кровельные плоскости в плане: многоугольник, высота низа z(x,y), какие кромки видимые (карниз/фронтон) */
  const RP=[];
  if(M.gable){RP.push({pl:[[-og,-ov],[A+og,-ov],[A+og,B/2],[-og,B/2]],z:(x,y)=>zA+(y+ov)*tn,sk:[2]},{pl:[[-og,B/2],[A+og,B/2],[A+og,B+ov],[-og,B+ov]],z:(x,y)=>zA+(B+ov-y)*tn,sk:[0]});
    (M.wingRoofs||[]).forEach(r=>r.polys.forEach(q=>RP.push({pl:q.pl,z:q.z,sk:q.sk})))}
  else RP.push({pl:[[-og,-ov],[A+og,-ov],[A+og,B+ov],[-og,B+ov]],z:(x,y)=>zA+(y+ov)*tn,sk:[]});
  const inPl=(pl,x,y)=>{let c=false;for(let i=0,j=pl.length-1;i<pl.length;j=i++){const [xi,yi]=pl[i],[xj,yj]=pl[j];
      if(Math.abs((xj-xi)*(y-yi)-(yj-yi)*(x-xi))<1e-3*Math.hypot(xj-xi,yj-yi)&&x>=Math.min(xi,xj)-1&&x<=Math.max(xi,xj)+1&&y>=Math.min(yi,yj)-1&&y<=Math.max(yi,yj)+1)return true;
      if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c};
  RP.forEach((r,i)=>r.main=M.gable?i<2:true);
  const roofZ=(x,y,mo)=>RP.reduce((m,r)=>(!mo||r.main)&&inPl(r.pl,x,y)?Math.max(m,r.z(x,y)):m,zr0);
  /* наружные стены по контуру: кромки прямоугольников без общих участков */
  rects.forEach((r,ri)=>[[r[0],r[1],r[2],r[1],[0,-1]],[r[2],r[1],r[2],r[3],[1,0]],[r[0],r[3],r[2],r[3],[0,1]],[r[0],r[1],r[0],r[3],[-1,0]]].forEach(([x0,y0,x1,y1,nv])=>{
    const hz=y0===y1,c=hz?y0:x0;let segs=[[hz?x0:y0,hz?x1:y1]],cut=[];
    rects.forEach((q,qi)=>{if(qi===ri)return;const cov=hz?((q[1]===c||q[3]===c)?[q[0],q[2]]:null):((q[0]===c||q[2]===c)?[q[1],q[3]]:null);if(!cov)return;
      segs=segs.flatMap(([a,b])=>{const lo=Math.max(a,cov[0]),hi=Math.min(b,cov[1]);if(hi-lo<1)return [[a,b]];if(ri===0)cut.push([lo,hi]);return [[a,lo],[hi,b]].filter(([p,q2])=>q2-p>1)})});
    segs.forEach(([a,b])=>{const P3=t=>hz?[t,c]:[c,t],us=[...new Set([a,b,...[...Array(Math.ceil((b-a)/100))].map((_,i)=>a+i*100),...RP.flatMap(r=>r.pl.map(p=>hz?p[0]:p[1])).filter(v=>v>a&&v<b)])].sort((p,q2)=>p-q2);
      let top=us.map(t=>{const [x,y]=P3(t);return [x,y,roofZ(x,y)]});top=top.filter((p,i)=>{if(!i||i===top.length-1)return true;const a2=top[i-1],b2=top[i+1],k1=(p[2]-a2[2])/((hz?p[0]-a2[0]:p[1]-a2[1])||1),k2=(b2[2]-p[2])/((hz?b2[0]-p[0]:b2[1]-p[1])||1);return Math.abs(k1-k2)>1e-6});
      const [xa,ya]=P3(a),[xb,yb]=P3(b);F.push({k:'wall',nv,pts:[[xa,ya,H0],[xb,yb,H0],...top.reverse()],line:[[xa,ya,H0+hb],[xb,yb,H0+hb]]})});
    /* часть стены основного дома над крышей крыла (фронтон над примыканием) */
    cut.forEach(([a,b])=>{const P3=t=>hz?[t,c]:[c,t],us=[...new Set([a,b,...[...Array(Math.ceil((b-a)/100))].map((_,i)=>a+i*100)])].sort((p,q2)=>p-q2),top=us.map(t=>{const [x,y]=P3(t);return [x,y,roofZ(x,y,true)]});
      if(Math.max(...top.map(p=>p[2]))<zr0+50)return;const [xa,ya]=P3(a),[xb,yb]=P3(b);F.push({k:'wall',nv,pts:[[xa,ya,zr0],[xb,yb,zr0],...top.reverse()]})})}));
  /* проёмы на наружной плоскости своей стены */
  M.walls.filter(w=>w.ext).forEach(w=>{const id=w.id,inw=w.inw||(/^GК/.test(id)?(w.uy?[-1,0]:[0,-1]):{W1:[0,1],W3:[0,-1],W2:[-1,0],W4:[1,0],G2:[-1,0],G4:[1,0]}[id]);if(!inw)return;const nv=[-inw[0],-inw[1]],zb=w.zb??z0;
    w.ops.filter(o=>o.ok).forEach(o=>{const z1=zb+o.sill,z2=z1+o.h,q=(u,z)=>w.ux?[w.x0+u,w.y0+nv[1]*w.d/2,z]:[w.x0+nv[0]*w.d/2,w.y0+u,z];
      F.push({k:o.type,nv,op:o,pts:[q(o.x,z1),q(o.x+o.w,z1),q(o.x+o.w,z2),q(o.x,z2)]})})});
  /* сваи */
  (M.piles||[]).forEach(p=>{const r=M.pileD/2;F.push({k:'pile',pts:[[p.x-r,p.y,0],[p.x+r,p.y,0],[p.x+r,p.y,H0],[p.x-r,p.y,H0]],pts2:[[p.x,p.y-r,0],[p.x,p.y+r,0],[p.x,p.y+r,H0],[p.x,p.y-r,H0]]})});
  /* кровля: верхняя плоскость и видимые кромки (карниз, фронтонный свес) */
  RP.forEach(r=>{const up=p=>[p[0],p[1],r.z(p[0],p[1])+T],dn=p=>[p[0],p[1],r.z(p[0],p[1])];const c0=r.pl[0];F.push({k:'roof',pts:r.pl.map(up),gr:[r.z(c0[0]+1,c0[1])-r.z(c0[0],c0[1]),r.z(c0[0],c0[1]+1)-r.z(c0[0],c0[1])]});
    r.pl.forEach((p,i)=>{if(r.sk.includes(i))return;const q=r.pl[(i+1)%r.pl.length];F.push({k:'edge',pts:[dn(p),dn(q),up(q),up(p)]})})});
  return F}
const FAC_FILL={wall:'#F2EEE6',roof:'#C3CCD4',edge:'#8E9AA6',pile:'#FFFFFF',window:'#DCE7F1',door:'#E9D8BE'};
function sheetFacades(code){
  const F=facadeFaces(),pa=planAxes(M),AXL=M.AX||M.A,BYL=M.BY||M.B;
  const V=[{t:`Фасад 1–${pa.ax.length}`,u:p=>p[0],d:p=>-p[1],vd:[0,-1],axes:pa.ax.map((x,i)=>[x,i+1])},
    {t:`Фасад ${pa.ax.length}–1`,u:p=>-p[0],d:p=>p[1],vd:[0,1],axes:pa.ax.map((x,i)=>[-x,i+1])},
    {t:`Фасад ${AX_LET[0]}–${AX_LET[pa.ay.length-1]}`,u:p=>p[1],d:p=>p[0],vd:[1,0],axes:pa.ay.map((y,i)=>[y,AX_LET[i]])},
    {t:`Фасад ${AX_LET[pa.ay.length-1]}–${AX_LET[0]}`,u:p=>-p[1],d:p=>-p[0],vd:[-1,0],axes:pa.ay.map((y,i)=>[-y,AX_LET[i]])}];
  const area=pp=>Math.abs(pp.reduce((a,p,i)=>{const q=pp[(i+1)%pp.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2);
  V.forEach(v=>{v.f=F.map(f=>{if((f.k==='window'||f.k==='door')&&f.nv[0]*v.vd[0]+f.nv[1]*v.vd[1]<.5)return null;
      if(f.gr&&-(f.gr[0]*v.vd[0]+f.gr[1]*v.vd[1])<-1e-6)return null;
      const pts=f.k==='pile'&&v.vd[1]===0?f.pts2:f.pts,pr=pts.map(p=>[v.u(p),p[2]]);if(area(pr)<2e3)return null;
      const ds=pts.map(v.d);return {...f,pr,near:Math.max(...ds)+(f.k==='window'||f.k==='door'?2:0),avg:ds.reduce((a,c)=>a+c,0)/ds.length}}).filter(Boolean)
      .sort((a,c)=>a.near-c.near||a.avg-c.avg);
    const us=v.f.flatMap(f=>f.pr.map(p=>p[0]));v.u0=Math.min(...us);v.u1=Math.max(...us);v.zmax=Math.max(...v.f.flatMap(f=>f.pr.map(p=>p[1])))});
  const CW=192,CH=112,dw=CW-36,dh=CH-30,s=fit(Math.max(...V.map(v=>v.u1-v.u0)),Math.max(...V.map(v=>v.zmax))+400,dw,dh);
  let g='';
  V.forEach((v,i)=>{const cx=25+(i%2)*(CW+1),cy=10+Math.floor(i/2)*(CH+1),wv=(v.u1-v.u0)/s,ox=cx+30+(dw-wv)/2,base=cy+CH-20;
    const X=u=>ox+(u-v.u0)/s,Z=z=>base-z/s;
    g+=Tx(cx+CW/2,cy+6,`${v.t}  М 1:${s}`,{size:3.2,cls:'b'});
    v.f.forEach(f=>{g+=`<polygon points="${f.pr.map(p=>f2(X(p[0]))+','+f2(Z(p[1]))).join(' ')}" fill="${FAC_FILL[f.k]}" stroke="#111" stroke-width="${f.k==='wall'||f.k==='roof'?.35:.22}"/>`;
      if(f.line)g+=Ln(X(v.u(f.line[0])),Z(f.line[0][2]),X(v.u(f.line[1])),Z(f.line[1][2]));
      if(f.k==='window'||f.k==='door'){const us2=f.pr.map(p=>p[0]),a=Math.min(...us2),b=Math.max(...us2),z1=f.pr[0][1],z2=f.pr[2][1],e=60;
        g+=Rc(X(a+e),Z(z2-e),(b-a-2*e)/s,(z2-z1-(f.k==='door'?e:2*e))/s);
        if(f.k==='window'){if(b-a>900)g+=Ln(X((a+b)/2),Z(z2-e),X((a+b)/2),Z(z1+e));g+=Ln(X(a+e),Z(z2-(z2-z1)*.3),X(b-e),Z(z2-(z2-z1)*.3))}
        else g+=Ci(X(b-e-120),Z(z1+1000),.5);
        g+=Tx(X((a+b)/2),Z(z2)-1,f.op.mark,{size:1.8})}});
    g+=Ln(X(v.u0)-6,Z(0),X(v.u1)+6,Z(0),'gnd');
    for(let x=X(v.u0)-5;x<X(v.u1)+5;x+=3)g+=Ln(x,Z(0)+.2,x-1.4,Z(0)+1.6);
    /* крайние оси */
    const ax=[...v.axes].sort((a,c)=>a[0]-c[0]),ex=[ax[0],ax.at(-1)];
    ex.forEach(([u,l])=>g+=Ln(X(u),Z(0),X(u),base+11.4,'ax')+bubble(X(u),base+15,l));
    g+=dimH(X(ex[0][0]),X(ex[1][0]),base+6.5,null,R(Math.abs(ex[1][0]-ex[0][0])));
    /* отметки */
    const zA=M.slopes[0].zA,zR=v.zmax,xm=cx+27,mk=[[0,'земля'],[M.z0,'пол'],[zA,'карниз'],[zR,'конёк']];
    mk.forEach(([z,t],j)=>{const y=Z(z);g+=Ln(xm,y,X(v.u0)-1,y)+elev(xm,y,elvTxt(z-M.z0),false)+Tx(xm-1.6,y+2.6,t,{a:'end',size:1.9})})});
  const ow=M.ops.filter(o=>o.ok).length;
  return {code,title:'Фасады',sub:`4 вида, проёмов ${ow}; кровля — ${M.mat.name.toLowerCase()}`,scale:s,body:g}}
