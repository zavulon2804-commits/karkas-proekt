/* ---------- АР: отделка помещений и фасада, площади и смета отделки ----------
   Вид отделки — по умолчанию из P.finWall/finFloor/finCeil/finFacade, для помещения — P.rooms[i].wallF/floorF/ceilF.
   Состав: [материал, ед., расход на 1 м², цена ₽ за ед.]. Цены — ориентировочные, правятся в справочнике ниже. */
/** @type {any} */
const FIN={
  wall:{paint:{n:'ГКЛ 12,5 + шпаклёвка + покраска',c:[['ГКЛ 12,5 мм','м²',1.1,190],['Шпаклёвка финишная','кг',1,45],['Грунтовка','л',.15,120],['Краска интерьерная','л',.3,450],['Саморезы для ГКЛ','шт',25,.6]],col:0xEFEAE0},
    wallpaper:{n:'ГКЛ 12,5 + шпаклёвка + обои',c:[['ГКЛ 12,5 мм','м²',1.1,190],['Шпаклёвка финишная','кг',.8,45],['Обои флизелиновые','м²',1.15,350],['Клей обойный','кг',.03,800],['Саморезы для ГКЛ','шт',25,.6]],col:0xE6DCCB},
    lining:{n:'Вагонка сосна, класс АВ + масло',c:[['Вагонка сосна 12,5×96','м²',1.1,650],['Кляймеры','шт',18,1.5],['Масло / лак','л',.12,900]],col:0xE3C99B},
    tile:{n:'ГКЛВ 12,5 + гидроизоляция + плитка',c:[['ГКЛВ 12,5 мм','м²',1.1,270],['Гидроизоляция обмазочная','кг',1,160],['Плитка керамическая','м²',1.1,1100],['Клей плиточный','кг',5,25],['Затирка','кг',.4,180]],col:0xDCE4E8},
    osb:{n:'OSB-3 12 мм + покраска',c:[['OSB-3 12 мм','м²',1.1,520],['Краска по дереву','л',.3,550]],col:0xD9BF8E}},
  floor:{laminate:{n:'Ламинат 33 кл. на подложке',c:[['Ламинат 33 класс','м²',1.07,950],['Подложка 3 мм','м²',1.05,90]],sk:1,col:0xC9A877},
    tile:{n:'Керамогранит на клею',c:[['Керамогранит','м²',1.08,1300],['Клей плиточный','кг',6,25],['Затирка','кг',.3,180],['Гидроизоляция обмазочная','кг',1.2,160]],col:0xC8CCCC},
    board:{n:'Инженерная доска',c:[['Инженерная доска','м²',1.05,3500],['Подложка','м²',1.05,150]],sk:1,col:0xA9825A},
    vinyl:{n:'Кварцвинил SPC',c:[['Кварцвинил SPC','м²',1.07,1600],['Подложка','м²',1.05,120]],sk:1,col:0xBFA58A},
    linoleum:{n:'Линолеум бытовой',c:[['Линолеум','м²',1.1,700]],sk:1,col:0xB9AE97}},
  ceil:{gkl:{n:'ГКЛ 9,5 + шпаклёвка + покраска',c:[['ГКЛ 9,5 мм','м²',1.1,170],['Шпаклёвка финишная','кг',.8,45],['Краска для потолков','л',.3,420],['Саморезы для ГКЛ','шт',25,.6]]},
    lining:{n:'Вагонка сосна + масло',c:[['Вагонка сосна 12,5×96','м²',1.1,650],['Кляймеры','шт',18,1.5],['Масло / лак','л',.12,900]]},
    stretch:{n:'Натяжной потолок ПВХ',c:[['Натяжной потолок ПВХ (с монтажом)','м²',1,650]]}},
  facade:{imit:{n:'Имитация бруса 20×145',c:[['Имитация бруса 20×145','м²',1.12,750],['Брусок обрешётки 25×50','м',2.2,40],['Антисептик','л',.25,250]],col:0xD8B47E},
    siding:{n:'Виниловый сайдинг',c:[['Сайдинг виниловый','м²',1.12,450],['Брусок обрешётки 25×50','м',2.2,40],['Планки и профили','м²',1,90]],col:0xE8E4DA},
    plank:{n:'Планкен лиственница',c:[['Планкен лиственница 20×140','м²',1.1,1900],['Брусок обрешётки 25×50','м',2.2,40],['Масло для фасада','л',.15,1200]],col:0xB98552},
    fiber:{n:'Фиброцементный сайдинг',c:[['Фиброцементный сайдинг','м²',1.1,1600],['Брусок обрешётки 25×50','м',2.2,40],['Крепёж и профили','м²',1,150]],col:0xC9CBC6},
    block:{n:'Блок-хаус 36×140',c:[['Блок-хаус 36×140','м²',1.12,950],['Брусок обрешётки 25×50','м',2.2,40],['Антисептик','л',.25,250]],col:0xD4A86C}}};
/** @type {any[]} */
const FIN_SKIRT=['Плинтус напольный','м',1.05,250];
const FIN_WET=/сануз|ванн|душ|туал|с\/у|wc|постир|баня|парил/i,FIN_TILEFLOOR=/котел|котёл|кухн|прихож|тамбур|холл|топоч/i;
const finOpts=t=>Object.entries(FIN[t]).map(([k,v])=>[k,v.n]);
/* длина контура объединения прямоугольников (кромки, общие с соседними клетками, не считаются) */
function cellsPerim(cells){let L=0;cells.forEach((c,ci)=>[[c[0],c[1],c[2],c[1],'h'],[c[0],c[3],c[2],c[3],'h'],[c[0],c[1],c[0],c[3],'v'],[c[2],c[1],c[2],c[3],'v']].forEach(([x0,y0,x1,y1,o])=>{
  let segs=[o==='h'?[x0,x1]:[y0,y1]];const k=o==='h'?y0:x0;
  cells.forEach((q,qi)=>{if(qi===ci)return;const cov=o==='h'?((Math.abs(q[1]-k)<1||Math.abs(q[3]-k)<1)?[q[0],q[2]]:null):((Math.abs(q[0]-k)<1||Math.abs(q[2]-k)<1)?[q[1],q[3]]:null);if(!cov)return;
    segs=segs.flatMap(([a,b])=>{const lo=Math.max(a,cov[0]),hi=Math.min(b,cov[1]);return hi-lo<1?[[a,b]]:[[a,lo],[hi,b]].filter(([p,q2])=>q2-p>1)})});
  segs.forEach(([a,b])=>L+=b-a)}));return L}
function roomFin(r){const q=r.ref>=0?(P.rooms||[])[r.ref]:null,wet=FIN_WET.test(r.name||''),tf=wet||FIN_TILEFLOOR.test(r.name||'');
  const pick=(t,f,def)=>{const v=q?.[f];return FIN[t][v]?v:def};
  return {wall:pick('wall','wallF',wet?'tile':(FIN.wall[P.finWall]?P.finWall:'paint')),floor:pick('floor','floorF',tf?'tile':(FIN.floor[P.finFloor]?P.finFloor:'laminate')),ceil:pick('ceil','ceilF',FIN.ceil[P.finCeil]?P.finCeil:'gkl')}}
function finishCalc(M){
  const rooms=M.rooms||[],H=M.H,opA=rooms.map(()=>0),inRoom=(x,y)=>rooms.findIndex(r=>r.cells.some(c=>x>c[0]-1&&x<c[2]+1&&y>c[1]-1&&y<c[3]+1));
  M.ops.filter(o=>o.ok).forEach(o=>{const w=M.walls.find(q=>q.id===o.wall);if(!w||w.zb!=null)return;const u=o.x+o.w/2,px=w.x0+w.ux*u,py=w.y0+w.uy*u,n=[-w.uy,w.ux],off=w.d/2+30;
    [1,-1].forEach(sg=>{const i=inRoom(px+n[0]*off*sg,py+n[1]*off*sg);if(i>=0)opA[i]+=o.w*o.h/1e6})});
  const items=new Map(),add=(grp,c,qty)=>{const k=c[0]+'|'+c[1];const it=items.get(k)||{grp,name:c[0],unit:c[1],price:c[3],qty:0};it.qty+=qty;items.set(k,it)};
  const cost=(t,key,area)=>{const f=FIN[t][key];let s=0;f.c.forEach(c=>{add(t,c,c[2]*area);s+=c[2]*area*c[3]});return s};
  const out=rooms.map((r,i)=>{const f=roomFin(r),per=cellsPerim(r.cells)/1000,wallA=per*H/1000,net=Math.max(0,wallA-opA[i]);
    let sum=cost('wall',f.wall,net)+cost('floor',f.floor,r.area)+cost('ceil',f.ceil,r.area);
    if(FIN.floor[f.floor].sk){add('floor',FIN_SKIRT,per*FIN_SKIRT[2]);sum+=per*FIN_SKIRT[2]*FIN_SKIRT[3]}
    return {no:r.no,name:r.name,area:r.area,per,wallA,opA:opA[i],net,f,sum}});
  /* фасад: наружные грани стен с фронтонами (как на листе «Фасады») минус проёмы */
  let facA=0,facOp=0;try{facadeFaces().forEach(fc=>{if(fc.k!=='wall'&&fc.k!=='window'&&fc.k!=='door')return;const ax=fc.nv&&fc.nv[0]!==0?1:0,pts=fc.pts.map(p=>[p[ax],p[2]]),A=Math.abs(pts.reduce((a,p,j)=>{const q=pts[(j+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2)/1e6;if(fc.k==='wall')facA+=A;else facOp+=A})}catch(e){}
  const fk=FIN.facade[P.finFacade]?P.finFacade:'imit',facNet=Math.max(0,facA-facOp),facSum=cost('facade',fk,facNet);
  const list=[...items.values()].map(it=>({...it,qty:it.unit==='шт'?Math.ceil(it.qty):it.qty,sum:(it.unit==='шт'?Math.ceil(it.qty):it.qty)*it.price}));
  return {rooms:out,facade:{key:fk,area:facA,op:facOp,net:facNet,sum:facSum},items:list,total:out.reduce((s,r)=>s+r.sum,0)+facSum}}
