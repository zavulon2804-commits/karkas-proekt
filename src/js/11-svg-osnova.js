/* ---------- СВГ-чертежи ---------- */
const SVG_CSS=`<style>.m{stroke:#111;stroke-width:.5;fill:none}.t{stroke:#111;stroke-width:.18;fill:none}.ax{stroke:#333;stroke-width:.18;stroke-dasharray:8 1.2 1 1.2;fill:none}.hd{stroke:#111;stroke-width:.25;stroke-dasharray:2 1;fill:none}.w{fill:#F4E6CC;stroke:#111;stroke-width:.25}.w2{fill:#E2C08E;stroke:#111;stroke-width:.25}.w3{fill:#C98B55;stroke:#111;stroke-width:.3}.ctx{fill:#EEEEEE;stroke:#888;stroke-width:.2}.wb{fill:#8AA6E8;stroke:#111;stroke-width:.25}.wl{fill:#EBD9B8;stroke:#111;stroke-width:.4}.wlp{fill:#F3EBDA;stroke:#111;stroke-width:.3}.op{fill:#fff;stroke:#111;stroke-width:.25}.pile{fill:#fff;stroke:#111;stroke-width:.35}.fr{fill:none;stroke:#111;stroke-width:.6}.blk{fill:#111;stroke:none}.gnd{stroke:#111;stroke-width:.6}text{font-family:"Arial Narrow","Liberation Sans Narrow",Arial,Helvetica,sans-serif;font-style:italic;fill:#111}.b{font-weight:bold}.wt{fill:#fff;stroke:none}</style>`;
const f2=v=>Math.round(v*100)/100;
const Ln=(x1,y1,x2,y2,c='t')=>`<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" class="${c}"/>`;
const Rc=(x,y,w,h,c='t')=>`<rect x="${f2(Math.min(x,x+w))}" y="${f2(Math.min(y,y+h))}" width="${f2(Math.abs(w))}" height="${f2(Math.abs(h))}" class="${c}"/>`;
const Tx=(x,y,s,o={})=>`<text x="${f2(x)}" y="${f2(y)}" font-size="${o.size||2.5}" text-anchor="${o.a||'middle'}"${o.rot?` transform="rotate(${o.rot} ${f2(x)} ${f2(y)})"`:''}${o.cls?` class="${o.cls}"`:''}>${esc(s)}</text>`;
const Ci=(x,y,r,c='t')=>`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" class="${c}"/>`;
const Pg=(pts,c='t')=>`<polygon points="${pts.map(p=>f2(p[0])+','+f2(p[1])).join(' ')}" class="${c}"/>`;
const Pl=(pts,c='t')=>`<polyline points="${pts.map(p=>f2(p[0])+','+f2(p[1])).join(' ')}" class="${c}"/>`;
const SCALES=[10,20,25,40,50,75,100,125,150,200,250,300];
const fit=(wm,hm,wp,hp)=>SCALES.find(s=>wm/s<=wp&&hm/s<=hp)||300;
function dimH(x1,x2,y,yref,txt,alt=0){let s='';const sg=yref==null?1:Math.sign(y-yref)||1;
  if(yref!=null){s+=Ln(x1,yref+sg*1,x1,y+sg*1.6);s+=Ln(x2,yref+sg*1,x2,y+sg*1.6)}
  s+=Ln(Math.min(x1,x2)-1.6,y,Math.max(x1,x2)+1.6,y);s+=Ln(x1-.9,y+.9,x1+.9,y-.9,'m')+Ln(x2-.9,y+.9,x2+.9,y-.9,'m');
  const w=Math.abs(x2-x1),tl=String(txt).length*1.35,size=w<tl?1.8:2.5;s+=Tx((x1+x2)/2,y-.8-(w<tl*.75?alt*2.2:0),txt,{size});return s}
function dimV(y1,y2,x,xref,txt,alt=0){let s='';const sg=xref==null?1:Math.sign(x-xref)||1;
  if(xref!=null){s+=Ln(xref+sg*1,y1,x+sg*1.6,y1);s+=Ln(xref+sg*1,y2,x+sg*1.6,y2)}
  s+=Ln(x,Math.min(y1,y2)-1.6,x,Math.max(y1,y2)+1.6);s+=Ln(x-.9,y1+.9,x+.9,y1-.9,'m')+Ln(x-.9,y2+.9,x+.9,y2-.9,'m');
  const h=Math.abs(y2-y1),tl=String(txt).length*1.35,size=h<tl?1.8:2.5;s+=Tx(x-.8-(h<tl*.75?alt*2.2:0),(y1+y2)/2,txt,{size,rot:-90});return s}
function chainH(vals,X,y,yref){const v=[...new Set(vals.map(a=>R(a)))].sort((a,c)=>a-c);let s='';for(let i=0;i<v.length-1;i++)s+=dimH(X(v[i]),X(v[i+1]),y,yref,v[i+1]-v[i],i%2);return s}
function chainV(vals,Y,x,xref){const v=[...new Set(vals.map(a=>R(a)))].sort((a,c)=>a-c);let s='';for(let i=0;i<v.length-1;i++)s+=dimV(Y(v[i]),Y(v[i+1]),x,xref,v[i+1]-v[i],i%2);return s}
const elvTxt=v=>{const m=v/1000;return Math.abs(m)<.0005?'±0,000':(m>0?'+':'−')+Math.abs(m).toFixed(3).replace('.',',')};
function elev(x,y,label,right=true){const d=right?1:-1;return Pg([[x,y],[x-1.3,y-2.2],[x+1.3,y-2.2]],'t')+Ln(x,y-2.2,x+d*15,y-2.2)+Tx(x+d*1.6,y-3,label,{a:right?'start':'end',size:2.2})}
function bubble(x,y,l){return Ci(x,y,3.6,'t')+Tx(x,y+1,l,{size:3})}
const AX_LET='АБВГДЕЖИКЛМНПРСТУФШЭЮЯ'; // без Ё З Й О Х Ц Ч Щ Ъ Ы Ь (ГОСТ Р 21.101)
/* координационные оси: по осям наружных стен и перегородок */
function planAxes(M){const axU=a=>[...new Set(a.map(v=>R(v)))].sort((p,q)=>p-q).filter((v,i,arr)=>!i||v-arr[i-1]>150),WL=M.walls.filter(x=>x.zb==null);
  return {ax:axU(WL.filter(x=>x.uy).map(x=>x.x0)),ay:axU(WL.filter(x=>x.ux).map(x=>x.y0))}}
function tableBlock(x,y,w,h,title,cols,rows){
  const rh=4.0,hh=5.2,W=cols.reduce((a,c)=>a+c.w,0);let s=Tx(x,y-1.2,title,{a:'start',size:2.6,cls:'b'});
  const per=Math.max(1,Math.floor((h-hh)/rh)),ncol=Math.max(1,Math.floor((w+3)/(W+3)));
  const chunks=[];for(let i=0;i<rows.length&&chunks.length<ncol;i+=per)chunks.push(rows.slice(i,i+per));
  chunks.forEach((ch,ci)=>{const x0=x+ci*(W+3);s+=Rc(x0,y,W,hh+ch.length*rh,'m');s+=Ln(x0,y+hh,x0+W,y+hh,'m');let cx=x0;
    cols.forEach((c,i)=>{s+=Tx(cx+c.w/2,y+3.8,c.t,{size:2});if(i<cols.length-1)s+=Ln(cx+c.w,y,cx+c.w,y+hh+ch.length*rh);cx+=c.w});
    ch.forEach((r,ri)=>{const yy=y+hh+ri*rh;if(ri)s+=Ln(x0,yy,x0+W,yy);let cx2=x0;cols.forEach((c,i)=>{const v=r[i];s+=Tx(c.a==='start'?cx2+1:cx2+c.w/2,yy+2.95,v,{size:2.1,a:c.a||'middle'});cx2+=c.w})})});
  const shown=chunks.reduce((a,c)=>a+c.length,0);if(shown<rows.length)s+=Tx(x,y+h+3,`… ещё ${rows.length-shown} поз. — см. спецификацию`,{a:'start',size:2});
  return s}
function frame(meta){const x=230,y=237;let s=Rc(20,5,395,287,'fr')+Rc(x,y,185,55,'fr');
  s+=Ln(x,y+15,x+185,y+15,'m')+Ln(x,y+35,x+185,y+35,'m')+Ln(x+125,y+15,x+125,y+55,'m')+Ln(x+125,y+22,x+185,y+22,'t')+Ln(x+145,y+15,x+145,y+35,'t')+Ln(x+165,y+15,x+165,y+35,'t')+Ln(x+125,y+45,x+185,y+45,'t');
  s+=Tx(x+92.5,y+9.6,meta.project,{size:4.2,cls:'b'});s+=Tx(x+62.5,y+24,meta.title,{size:3.4,cls:'b'});s+=Tx(x+62.5,y+30.5,meta.sub||'',{size:2.4});
  s+=Tx(x+62.5,y+43,'Каркасный дом на сваях: '+(PILE_KIND[M?.pileKind]||''),{size:2.6});s+=Tx(x+62.5,y+50,'Расчёт упрощённый, проект согласовать с инженером',{size:2.1});
  s+=Tx(x+135,y+20,'Стадия',{size:2});s+=Tx(x+155,y+20,'Лист',{size:2});s+=Tx(x+175,y+20,'Листов',{size:2});
  s+=Tx(x+135,y+30,'Р',{size:3.2});s+=Tx(x+155,y+30,meta.n,{size:3.2});s+=Tx(x+175,y+30,meta.total,{size:3.2});
  s+=Tx(x+155,y+41.5,meta.scale==='—'?'—':'М 1:'+meta.scale,{size:3});s+=Tx(x+155,y+51.5,meta.code+' · '+new Date().toLocaleDateString('ru-RU'),{size:2.4});
  return s}
function wrapSheet(body,meta){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm">${SVG_CSS}<rect x="0" y="0" width="420" height="297" fill="#fff"/>${body}${frame(meta)}</svg>`}
const markRows=(pred)=>S.marks.filter(pred).map(g=>[g.mark,ROLE[g.role],g.sec.join('×'),fmt(g.L),g.qty]);
const MARK_COLS=[{t:'Марка',w:12},{t:'Наименование',w:44,a:'start'},{t:'Сечение',w:16},{t:'Длина',w:14},{t:'Шт',w:10}];

