/* ---------- АР: мебель, сантехника и инженерное оборудование (P.furn) ----------
   Предмет: {t: ключ каталога, x, y — центр, мм; w, d — ширина и глубина; h — высота; e — высота низа над полом; rot — 0/90/180/270}.
   «Спинка» (сторона v = +d/2) при rot=0 смотрит на +Y. На расчёт конструкций мебель не влияет. */
/** @type {Array<[string, any[][]]>} */
const FURN_CAT=[
  ['Гостиная',[['sofa','Диван',2100,900,850],['armch','Кресло',850,850,850],['ctable','Стол журнальный',1000,600,450],['tvcab','ТВ-тумба',1600,450,500],['ward','Шкаф',1200,600,2100]]],
  ['Спальня',[['bed2','Кровать двуспальная',1600,2000,500],['bed1','Кровать односпальная',900,2000,500],['night','Тумба прикроватная',450,400,500],['wardk','Шкаф-купе',1800,600,2300]]],
  ['Кухня',[['kitch','Кухня (столешница)',2400,600,900],['stove','Плита',600,600,900],['ksink','Мойка',800,600,900],['fridge','Холодильник',600,650,1900],['dtable','Стол обеденный',1200,800,750],['chair','Стул',450,450,900]]],
  ['Санузел',[['bath','Ванна',1700,750,600],['shower','Душевая кабина',900,900,2100],['wc','Унитаз',380,650,800],['sink','Раковина',600,450,850],['washer','Стиральная машина',600,600,850]]],
  ['Котельная',[['boilw','Котёл настенный',450,350,750,900],['boilf','Котёл напольный',500,600,850],['tank','Бойлер косвенного нагрева',600,600,1500],['exp','Расширительный бак',400,400,600],['manif','Коллектор (гребёнка)',700,200,400,1000],['rad','Радиатор',1000,100,550,150]]],
  ['Прочее',[['stove2','Печь / камин',900,700,1200],['desk','Письменный стол',1200,600,750],['shelf','Стеллаж',900,350,1800]]]];
const FURN=Object.fromEntries(FURN_CAT.flatMap(([cat,items])=>items.map(([t,n,w,d,h,e])=>[t,{t,n,cat,w,d,h,e:e||0}])));
const FURN_COL={Гостиная:0x8d7b68,Спальня:0x9b8aa6,Кухня:0xb59a6a,Санузел:0xe8eef2,Котельная:0xb33a2a,Прочее:0x8c8c8c};
function furnNew(t,x,y){const c=FURN[t];return {t,x:R(x),y:R(y),w:c.w,d:c.d,h:c.h,e:c.e,rot:0}}
/* габарит в плане (оси дома) */
function furnFoot(f){const q=(+f.rot||0)%180!==0,w=q?+f.d:+f.w,d=q?+f.w:+f.d;return [f.x-w/2,f.y-d/2,f.x+w/2,f.y+d/2]}
/* условное изображение: примитивы в координатах дома, мм. r — прямоугольник [x0,y0,x1,y1], c — круг [x,y,r], l — линия [x0,y0,x1,y1] */
function furnPrims(f){const w=+f.w,d=+f.d,rot=((+f.rot||0)%360+360)%360,
    T=(u,v)=>rot===90?[f.x-v,f.y+u]:rot===180?[f.x-u,f.y-v]:rot===270?[f.x+v,f.y-u]:[f.x+u,f.y+v],
    out=[],r=(u0,v0,u1,v1)=>{const a=T(u0,v0),b=T(u1,v1);out.push(['r',Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])])},
    c=(u,v,rr)=>{const a=T(u,v);out.push(['c',a[0],a[1],rr])},l=(u0,v0,u1,v1)=>{const a=T(u0,v0),b=T(u1,v1);out.push(['l',a[0],a[1],b[0],b[1]])},W=w/2,D=d/2;
  r(-W,-D,W,D);
  switch(f.t){
    case 'sofa':r(-W,D-180,W,D);r(-W,-D,-W+160,D-180);r(W-160,-D,W,D-180);break;
    case 'armch':r(-W,D-170,W,D);r(-W,-D,-W+150,D-170);r(W-150,-D,W,D-170);break;
    case 'chair':r(-W,D-90,W,D);break;
    case 'bed2':r(-W+80,D-380,-40,D-80);r(40,D-380,W-80,D-80);l(-W,D-520,W,D-520);break;
    case 'bed1':r(-W+80,D-380,W-80,D-80);l(-W,D-520,W,D-520);break;
    case 'ward':case 'wardk':l(-W,-D+60,W,-D+60);l(0,-D,0,-D+60);break;
    case 'kitch':l(-W,-D+50,W,-D+50);break;
    case 'stove':[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>c(a*W/2,b*D/2,Math.min(W,D)/3.2));break;
    case 'ksink':r(-W+90,-D+80,W-90,D-120);c(0,0,30);break;
    case 'fridge':l(-W,-D+40,W,-D+40);l(-W,-D,W,D);break;
    case 'bath':r(-W+70,-D+70,W-70,D-70);c(W-220,0,25);break;
    case 'shower':l(-W,-D,W,D);l(-W,D,W,-D);c(0,0,40);break;
    case 'wc':r(-W,D-170,W,D);c(0,-40,Math.min(W,D)*.75);break;
    case 'sink':r(-W+60,-D+50,W-60,D-90);c(0,-20,25);break;
    case 'washer':c(0,-20,Math.min(W,D)*.7);break;
    case 'boilw':case 'boilf':c(0,0,Math.min(W,D)*.6);l(-W*.35,0,W*.35,0);break;
    case 'tank':case 'exp':c(0,0,Math.min(W,D)*.85);break;
    case 'manif':[-.6,-.2,.2,.6].forEach(k=>c(k*W,0,Math.min(35,D/3)));break;
    case 'rad':for(let u=-W+100;u<W-50;u+=100)l(u,-D,u,D);break;
    case 'stove2':r(-W+120,-D+120,W-120,D-200);break;
    case 'shelf':l(-W,0,W,0);break;
    case 'dtable':case 'ctable':case 'desk':case 'tvcab':case 'night':break}
  return out}
