/* ---------- 3D ---------- */
const layers={piles:true,grill:true,floor:true,walls:true,parts:true,gable:true,mans:true,attic:true,roof:true,lath:false,cover:false};
let R3=null;
function render3DTab(){
  const el=$('#tab-3d');
  if(!el.dataset.ready){
    el.innerHTML=`<div class="v3mode" role="group" aria-label="Что показать"><button class="btn sm" data-v3="house" aria-pressed="${V3==='house'}">Дом (АР)</button><button class="btn sm" data-v3="frame" aria-pressed="${V3==='frame'}">Каркас (КР)</button></div>
      <div class="layers" id="layersAr"${V3==='house'?'':' hidden'}>${AR_GRP.map(([g,n])=>`<button class="chip" data-a="${g}" aria-pressed="${arLayers[g]}">${n}</button>`).join('')}</div>
      <div class="layers" id="layers"${V3==='frame'?'':' hidden'}>${GRP_ORDER.map(g=>`<button class="chip" data-l="${g}" aria-pressed="${layers[g]}"><i style="background:${GRP[g].css}"></i>${GRP[g].n}</button>`).join('')}</div>
      <div class="viewer" id="viewer"><canvas id="c3d"></canvas><div class="vhelp">Вращать — тянуть · Сдвиг — правая кнопка или Shift · Масштаб — колесо, щипок</div>
      <div class="vinfo" id="vinfo">Нажмите на элемент, чтобы увидеть его марку и размеры.</div>
      <div class="vbtns"><button class="btn sm" id="vReset">Вид по умолчанию</button></div></div>`;
    el.dataset.ready='1';
    el.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const g=b.dataset.l;layers[g]=!layers[g];b.setAttribute('aria-pressed',layers[g]);if(R3)applyLayers()});
    $('#vReset').onclick=()=>{if(R3){fitCam();draw3()}};
    el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const g=b.dataset.a;arLayers[g]=!arLayers[g];b.setAttribute('aria-pressed',arLayers[g]);if(R3)applyLayers()});
    el.querySelectorAll('[data-v3]').forEach(b=>b.onclick=()=>{V3=b.dataset.v3;el.querySelectorAll('[data-v3]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v3===V3));$('#layers').hidden=V3!=='frame';$('#layersAr').hidden=V3!=='house';if(R3)applyLayers()});
  }
  if(!window.THREE){$('#vinfo').textContent='3D-библиотека загружается… Если модель не появится — нет интернета; остальные вкладки работают.';return}
  if(!R3){init3D();if(/^3D-библиотека/.test($('#vinfo').textContent))$('#vinfo').textContent='Нажмите на элемент, чтобы увидеть его марку и размеры.'}
  if(dirty3d){build3D();dirty3d=false}
  resize3();
}
function init3D(){
  const cv=$('#c3d');
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.05,500);
  scene.add(new THREE.HemisphereLight(0xffffff,0x56605a,.85*Math.PI));
  const dl=new THREE.DirectionalLight(0xffffff,.65*Math.PI);dl.position.set(-12,20,14);scene.add(dl);
  const dl2=new THREE.DirectionalLight(0xffffff,.25*Math.PI);dl2.position.set(14,8,-10);scene.add(dl2);
  const root=new THREE.Group();root.rotation.x=-Math.PI/2;root.scale.setScalar(.001);scene.add(root);
  R3={renderer,scene,camera,root,groups:{},cam:{theta:-2.2,phi:1.05,r:22,target:new THREE.Vector3()},geoCache:new Map(),mats:{}};
  const pts=new Map();let last=null,moved=0,pinch=0;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});last={x:e.clientX,y:e.clientY,b:e.button,s:e.shiftKey};moved=0;if(pts.size===2){const a=[...pts.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
  cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){const a=[...pts.values()],dd=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch){R3.cam.r=Math.min(120,Math.max(2,R3.cam.r*pinch/dd))}pinch=dd;moved+=10;draw3();return}
    const dx=e.clientX-last.x,dy=e.clientY-last.y;moved+=Math.abs(dx)+Math.abs(dy);last.x=e.clientX;last.y=e.clientY;
    const c=R3.cam;
    if(last.b===2||last.s||e.shiftKey){const cam=R3.camera;const right=new THREE.Vector3().setFromMatrixColumn(cam.matrix,0),up=new THREE.Vector3().setFromMatrixColumn(cam.matrix,1);const k=c.r*.0016;c.target.addScaledVector(right,-dx*k).addScaledVector(up,dy*k)}
    else{c.theta+=dx*.008;c.phi=Math.min(Math.PI-.05,Math.max(.08,c.phi-dy*.008))}
    draw3()});
  const up=e=>{if(pts.has(e.pointerId)){pts.delete(e.pointerId);if(moved<4&&e.button===0)pick3(e)}if(pts.size<2)pinch=0};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>pts.delete(e.pointerId));
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('wheel',e=>{e.preventDefault();R3.cam.r=Math.min(120,Math.max(2,R3.cam.r*Math.pow(1.0015,e.deltaY)));draw3()},{passive:false});
  window.addEventListener('resize',()=>{if(curTab==='3d')resize3()});
}
function mat3(key,color,opts={}){if(!R3.mats[key])R3.mats[key]=new THREE.MeshLambertMaterial({color,...opts});return R3.mats[key]}
function boxGeo(L,y,z){const k=R(L)+'|'+R(y)+'|'+R(z);let g=R3.geoCache.get(k);if(!g){g=new THREE.BoxGeometry(L,y,z);R3.geoCache.set(k,g)}return g}
function build3D(){
  const {root}=R3;
  while(root.children.length){const c=root.children.pop();c.traverse(o=>{if(o.geometry&&!o.geometry.userData.cached)o.geometry.dispose?.()})}
  R3.groups={};
  GRP_ORDER.forEach(g=>{const G=new THREE.Group();G.name=g;R3.groups[g]=G;root.add(G)});
  const edgeMat=new THREE.LineBasicMaterial({color:0x3b2a18,transparent:true,opacity:.28});
  M.mem.forEach(m=>{
    const p0=new THREE.Vector3(...m.p0),p1=new THREE.Vector3(...m.p1),L=p0.distanceTo(p1);if(L<1)return;
    const x=p1.clone().sub(p0).normalize();let y=new THREE.Vector3(...m.up);y.sub(x.clone().multiplyScalar(y.dot(x))).normalize();const z=new THREE.Vector3().crossVectors(x,y);
    const g=boxGeo(L,Math.max(1,m.sy),Math.max(1,m.sz));
    const color=m.role==='ПР'?0xb0612b:m.role==='Р'?0xc98a4c:m.role==='УК'?0x8f4f22:m.role==='УТ'?0x4a6fd0:GRP[m.grp].c;
    const mt=m.grp==='cover'?mat3('cover',GRP.cover.c,{transparent:true,opacity:.55,side:THREE.DoubleSide}):mat3('c'+color,color);
    const mesh=new THREE.Mesh(g,mt);mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));mesh.position.copy(p0).add(p1).multiplyScalar(.5);mesh.userData.m=m;
    if(m.grp!=='cover'&&m.grp!=='lath'){const eg=new THREE.EdgesGeometry(g);const ln=new THREE.LineSegments(eg,edgeMat);mesh.add(ln)}
    R3.groups[m.grp].add(mesh);
  });
  const pm=mat3('pile',GRP.piles.c),capm=mat3('cap',0x5c666b);
  const below=M.pileLen-M.H0;
  const conc=mat3('conc',0xa9aaa4),t=M.pileT;
  M.piles.forEach(p=>{let c;
    if(t.kind==='driven'){c=new THREE.Mesh(boxGeo(t.a,t.a,M.pileLen),conc);c.position.set(p.x,p.y,M.H0-M.pileLen/2)}
    else{const cg=new THREE.CylinderGeometry(M.pileD/2,M.pileD/2,M.pileLen,t.kind==='bored'?20:16);c=new THREE.Mesh(cg,t.kind==='bored'?conc:pm);c.rotation.x=Math.PI/2;c.position.set(p.x,p.y,M.H0-M.pileLen/2)}
    c.userData.m={pile:p};R3.groups.piles.add(c);
    const cap=new THREE.Mesh(boxGeo(t.kind==='driven'?300:250,t.kind==='driven'?300:250,8),capm);cap.position.set(p.x,p.y,M.H0+4);R3.groups.piles.add(cap);
    if(t.kind==='screw'||t.kind==='manual'){const bl=new THREE.Mesh(new THREE.CylinderGeometry(M.pileD*1.5,M.pileD*1.5,8,20),pm);bl.rotation.x=Math.PI/2;bl.position.set(p.x,p.y,-below+250);R3.groups.piles.add(bl)}
    if(t.base){const sp=new THREE.Mesh(new THREE.SphereGeometry(t.base/2,18,12),conc);sp.position.set(p.x,p.y,-below+t.base/2);R3.groups.piles.add(sp)}});
  const gpad=3000,AXg=M.AX||M.A,BYg=M.BY||M.B,gw=AXg+2*gpad,gh=BYg+2*gpad;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(gw,gh),new THREE.MeshLambertMaterial({color:0x7d9a6a,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));
  ground.position.set(AXg/2,BYg/2,0);ground.renderOrder=-1;root.add(ground);
  const gridH=new THREE.GridHelper(Math.max(gw,gh),Math.round(Math.max(gw,gh)/1000),0x5d7350,0x8aa07b);gridH.rotation.x=Math.PI/2;gridH.position.set(AXg/2,BYg/2,1);gridH.material.transparent=true;gridH.material.opacity=.35;root.add(gridH);
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--scene').trim()||'#dce3de';R3.renderer.setClearColor(new THREE.Color(bg));
  buildHouse3D();
  applyLayers(false);
  if(!R3.fitted){fitCam();R3.fitted=true}
  draw3();
}
function applyLayers(redraw=true){Object.entries(R3.groups).forEach(([g,G])=>G.visible=V3==='house'?(/^ar/.test(g)&&(arLayers[g]??true))||g==='piles':!/^ar/.test(g)&&!!layers[g]);if(redraw)draw3()}
function fitCam(){const c=R3.cam,AX=M.AX||M.A,BY=M.BY||M.B;c.target.set(AX/2000,M.zRidge/2000,-BY/2000);c.r=Math.max(AX,BY,M.zRidge)/1000*2.1;c.theta=-2.25;c.phi=1.08}
function resize3(){if(!R3)return;const cv=R3.renderer.domElement,w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;R3.renderer.setSize(w,h,false);R3.camera.aspect=w/h;R3.camera.updateProjectionMatrix();draw3()}
function draw3(){if(!R3)return;const {cam,camera}=R3,t=cam.target;camera.position.set(t.x+cam.r*Math.sin(cam.phi)*Math.cos(cam.theta),t.y+cam.r*Math.cos(cam.phi),t.z+cam.r*Math.sin(cam.phi)*Math.sin(cam.theta));camera.lookAt(t);R3.renderer.render(R3.scene,camera)}
function pick3(e){
  const cv=R3.renderer.domElement,rc=cv.getBoundingClientRect(),v=new THREE.Vector2((e.clientX-rc.left)/rc.width*2-1,-(e.clientY-rc.top)/rc.height*2+1);
  const ray=new THREE.Raycaster();ray.setFromCamera(v,R3.camera);
  const objs=[];Object.values(R3.groups).forEach(G=>{if(G.visible)G.children.forEach(o=>{if(o.isMesh&&o.userData.m)objs.push(o)})});
  const hit=ray.intersectObjects(objs,false)[0];const info=$('#vinfo');
  if(!hit){info.textContent='Нажмите на элемент, чтобы увидеть его марку и размеры.';return}
  const m=hit.object.userData.m;
  if(m.ar){info.textContent=m.ar;return}
  if(m.pile){info.innerHTML=`<b>Свая №${m.pile.no}</b> · ${esc(M.pileT.name)} · L=${M.pileLen} мм · нагрузка ${fmt(m.pile.N,1)} из ${fmt(C.Fd,1)} кН`;return}
  if(!m.role){info.textContent=GRP[m.grp].n;return}
  info.innerHTML=`<span class="mk">${esc(m.mark||m.role)}</span> · ${esc(ROLE[m.role])} · ${m.sec.join('×')} мм · L=${fmt(r10(m.L))} мм${m.n>1?` · ${m.n} доски`:''}${m.wall?` · ${esc(M.walls.find(w=>w.id===m.wall)?.name||'')}`:''}`;
}

window.addEventListener('three-ready',()=>{if(curTab==='3d')renderActive()});
