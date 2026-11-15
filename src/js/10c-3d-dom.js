/* ---------- 3D: вид «Дом» (АР) — стены с проёмами, фронтоны, полы помещений, окна, двери, мебель, кровля ---------- */
let V3='frame';const arLayers={arRoof:true,arFurn:true,arPart:true};
const AR_GRP=[['arRoof','Крыша'],['arPart','Перегородки'],['arFurn','Мебель']];
/* плоский многоугольник (с отверстиями) в 3D → треугольники */
function planarGeo(pts,holes=[]){const n=[0,0,0];pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];n[0]+=(p[1]-q[1])*(p[2]+q[2]);n[1]+=(p[2]-q[2])*(p[0]+q[0]);n[2]+=(p[0]-q[0])*(p[1]+q[1])});
  const ax=n.map(Math.abs),drop=ax.indexOf(Math.max(...ax)),ij=[0,1,2].filter(i=>i!==drop),V=p=>new THREE.Vector2(p[ij[0]],p[ij[1]]);
  const tri=THREE.ShapeUtils.triangulateShape(pts.map(V),holes.map(h=>h.map(V))),all=[...pts,...holes.flat()],g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(all.flat(),3));g.setIndex(tri.flat());g.computeVertexNormals();return g}
/* обрезать многоугольник по высоте z ≥ z0 (Сазерленд — Ходжмен) */
function clipZ(pts,z0){const out=[];pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length],pin=p[2]>=z0-.5,qin=q[2]>=z0-.5;if(pin)out.push(p);if(pin!==qin){const t=(z0-p[2])/(q[2]-p[2]);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,z0])}});return out}
function buildHouse3D(){
  const G={};['arWalls','arRoof','arPart','arFurn','arFloor'].forEach(k=>{const g=new THREE.Group();g.name=k;G[k]=g;R3.root.add(g);R3.groups[k]=g});
  const mWall=mat3('arW',0xEFE7D8),mPart=mat3('arP',0xF7F4EE),mRoof=mat3('arR',0x5E6B78,{side:THREE.DoubleSide}),mEdge=mat3('arE',0x47525d,{side:THREE.DoubleSide}),
    mGlass=mat3('arG',0x9cc3e0,{transparent:true,opacity:.45}),mDoor=mat3('arD',0x8a5a33),mGab=mat3('arGb',0xEFE7D8,{side:THREE.DoubleSide});
  const z0=M.z0,zTop=M.zr0,box=(grp,mt,x0,y0,z1,x1,y1,z2,info)=>{if(x1-x0<1||y1-y0<1||z2-z1<1)return;const m=new THREE.Mesh(boxGeo(x1-x0,y1-y0,z2-z1),mt);m.position.set((x0+x1)/2,(y0+y1)/2,(z1+z2)/2);m.userData.m={ar:info};grp.add(m)};
  /* стены: сплошные участки, под окнами и над проёмами; наружные — от низа ростверка до верха перекрытия */
  M.walls.filter(w=>w.zb==null).forEach(w=>{const ext=w.ext,grp=ext?G.arWalls:G.arPart,mt=ext?mWall:mPart,zb=ext?M.H0:z0,zt=ext?zTop:M.zt,info=w.name;
    const seg=(u0,u1,z1,z2)=>{if(w.ux)box(grp,mt,w.x0+u0,w.y0-w.d/2,z1,w.x0+u1,w.y0+w.d/2,z2,info);else box(grp,mt,w.x0-w.d/2,w.y0+u0,z1,w.x0+w.d/2,w.y0+u1,z2,info)};
    const os=w.ops.filter(o=>o.ok).sort((a,c)=>a.x-c.x);let u=0;
    os.forEach(o=>{seg(u,o.x,zb,zt);const zs=z0+o.sill,ze=zs+o.h;if(zs>zb+1)seg(o.x,o.x+o.w,zb,zs);seg(o.x,o.x+o.w,ze,zt);
      const pane=o.type==='door'?mDoor:mGlass,th=o.type==='door'?40:20;
      if(w.ux)box(grp,pane,w.x0+o.x,w.y0-th/2,zs,w.x0+o.x+o.w,w.y0+th/2,ze,(o.type==='door'?'Дверь ':'Окно ')+o.mark);else box(grp,pane,w.x0-th/2,w.y0+o.x,zs,w.x0+th/2,w.y0+o.x+o.w,ze,(o.type==='door'?'Дверь ':'Окно ')+o.mark);u=o.x+o.w});
    seg(u,w.L,zb,zt)});
  /* фронтоны и кровля — из тех же граней, что и лист «Фасады» */
  const F=facadeFaces(),ops=F.filter(f=>f.k==='window'||f.k==='door');
  F.filter(f=>f.k==='wall').forEach(f=>{const pts=clipZ(f.pts,zTop);if(pts.length<3||Math.max(...pts.map(p=>p[2]))<zTop+20)return;
    const ax=f.nv[0]!==0?0:1,c=f.pts[0][ax],holes=ops.filter(o=>o.nv[0]===f.nv[0]&&o.nv[1]===f.nv[1]&&Math.abs(o.pts[0][ax]-c)<2&&o.pts[0][2]>=zTop-1).map(o=>o.pts);
    const m=new THREE.Mesh(planarGeo(pts,holes),mGab);m.userData.m={ar:'Фронтон'};G.arRoof.add(m);
    holes.forEach(h=>{const g=new THREE.Mesh(planarGeo(h),mGlass);g.userData.m={ar:'Окно во фронтоне'};G.arRoof.add(g)})});
  F.filter(f=>f.k==='roof'||f.k==='edge').forEach(f=>{const m=new THREE.Mesh(planarGeo(f.pts),f.k==='roof'?mRoof:mEdge);m.userData.m={ar:'Кровля: '+M.mat.name.toLowerCase()};G.arRoof.add(m)});
  /* полы помещений */
  const fc={living:0xD8C29C,aux:0xCDBFA8,tech:0xBDB6AA};
  (M.rooms||[]).forEach(r=>r.cells.forEach(c=>box(G.arFloor,mat3('arF'+r.kind,fc[r.kind]||0xCDBFA8),c[0],c[1],z0-30,c[2],c[3],z0,`${r.name}, ${fmt(r.area,1)} м²`)));
  /* мебель и оборудование */
  (P.furn||[]).forEach(f=>{const c=FURN[f.t];if(!c)return;const [x0,y0,x1,y1]=furnFoot(f),e=+f.e||0;box(G.arFurn,mat3('arM'+c.cat,FURN_COL[c.cat]),x0,y0,z0+e,x1,y1,z0+e+(+f.h||500),c.n+` ${f.w}×${f.d}×${f.h}`)});
}
