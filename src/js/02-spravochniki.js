/* ---------- справочники ---------- */
const E_MOD=10000, R_I=13, R_C=13, SELF=5e-6; // МПа; МПа; МПа; Н/мм³ (≈500 кг/м³)
const SNOW={I:.5,II:1,III:1.5,IV:2,V:2.5,VI:3,VII:3.5,VIII:4};
const WIND={Ia:.17,I:.23,II:.30,III:.38,IV:.48,V:.60,VI:.73,VII:.85};
const TERRAIN={A:{n:'A — открытое побережье, степь',k:.75},B:{n:'B — посёлок, лес, препятствия от 10 м',k:.5},C:{n:'C — плотная застройка',k:.4}};
const ROOFS={
  metal:{name:'Металлочерепица',g:.05,min:14,lath:[25,100],step:350,counter:[50,50],osb:false,price:'roofMetal'},
  prof:{name:'Профнастил кровельный',g:.05,min:12,lath:[25,100],step:400,counter:[50,50],osb:false,price:'roofProf'},
  soft:{name:'Гибкая черепица по OSB',g:.10,min:12,lath:[25,100],step:300,counter:[50,50],osb:true,price:'roofSoft'},
  ondulin:{name:'Ондулин',g:.035,min:6,lath:[50,50],step:600,counter:null,osb:false,price:'roofOndulin'}
};
const PILES={
  p89:{kind:'screw',name:'Винтовая СВС-89, лопасть 250',short:'СВС-89',d:89,Fd:30},
  p108:{kind:'screw',name:'Винтовая СВС-108, лопасть 300',short:'СВС-108',d:108,Fd:45},
  p133:{kind:'screw',name:'Винтовая СВС-133, лопасть 350',short:'СВС-133',d:133,Fd:60},
  c20:{kind:'driven',name:'Забивная ЖБ С20.20 (200×200)',short:'С20.20',a:200,d:200,pm:'rc20'},
  c30:{kind:'driven',name:'Забивная ЖБ С30.30 (300×300)',short:'С30.30',a:300,d:300,pm:'rc30'},
  b200:{kind:'bored',name:'Буронабивная ЖБ Ø200',short:'БНС Ø200',d:200},
  b300:{kind:'bored',name:'Буронабивная ЖБ Ø300',short:'БНС Ø300',d:300},
  b300w:{kind:'bored',name:'Буронабивная Ø300 с уширением Ø500 (ТИСЭ)',short:'БНС Ø300/500',d:300,base:500},
  manual:{kind:'manual',name:'Своя: несущая способность по паспорту',short:'Свая',d:108,Fd:null}
};
const PILE_KIND={screw:'винтовые',driven:'забивные ЖБ',bored:'буронабивные ЖБ',manual:'по паспорту'};
/* грунты: R — сопротивление под остриём (СП 24.13330, табл. 7.2 / 7.7), f — трение по боковой поверхности (табл. 7.3), tau — касательные силы пучения, кПа */
const SOILS={
  loam:{name:'Суглинок, глина тугопластичные (IL≈0,2)',d0:.23,k:1,R:'c02',f:'f1',tau:90,heave:'среднепучинистый'},
  sandyLoam:{name:'Супесь пластичная (IL≈0,3)',d0:.28,k:.8,R:'c03',f:'f2',tau:90,heave:'среднепучинистый'},
  loamSoft:{name:'Суглинок мягкопластичный (IL≈0,5)',d0:.23,k:.6,R:'c05',f:'f4',tau:110,heave:'сильнопучинистый'},
  sandM:{name:'Песок средней крупности',d0:.30,k:1.2,R:'sM',f:'f1',tau:0,heave:'непучинистый'},
  sandF:{name:'Песок мелкий влажный',d0:.28,k:.9,R:'sF',f:'f2',tau:70,heave:'слабопучинистый'},
  peat:{name:'Торф, ил, насыпной грунт',d0:.23,k:0,R:null,f:null,tau:110,heave:'сильнопучинистый'}
};
const RZ=[3,4,5,7,10], FZ=[1,2,3,4,5,6,8,10];
const R_DRIVEN={sM:[3100,3200,3400,3700,4000],sF:[2000,2100,2200,2400,2600],c02:[3000,3800,4000,4300,5000],c03:[2000,2500,2800,3300,3500],c05:[1100,1250,1300,1400,1500]};
const R_BORED={sM:[1100,1200,1300,1500,1700],sF:[700,750,800,950,1100],c02:[650,700,750,850,1050],c03:[500,575,650,750,950],c05:[300,350,400,500,700]};
const F_SIDE={f1:[35,42,48,53,56,58,62,65],f2:[23,30,35,38,40,42,44,46],f3:[15,21,25,27,29,31,33,34],f4:[12,17,20,22,24,25,26,27]};
function interp(xs,ys,x){if(x<=xs[0])return ys[0];for(let i=1;i<xs.length;i++)if(x<=xs[i])return ys[i-1]+(ys[i]-ys[i-1])*(x-xs[i-1])/(xs[i]-xs[i-1]);return ys.at(-1)}
function Rtip(tbl,z){const r=interp(RZ,tbl,z);return z<3?r*Math.max(.6,.7+.1*z):r}
function fSum(ft,z1,z2){let s=0;for(let z=z1;z<z2-1e-9;z+=.25){const dz=Math.min(.25,z2-z);s+=interp(FZ,ft,z+dz/2)*dz}return s}
/* несущая способность и анкеровка одной сваи, кН */
function pileCap(P,M){
  const t=M.pileT,soil=SOILS[P.soil]||SOILS.loam,h=(M.pileLen-M.H0)/1000,df=(+P.freeze)/1000;
  const r={kind:t.kind,h,soil,df};
  if(t.kind==='screw'){r.Nperm=t.Fd*soil.k;r.Fd=r.Nperm*1.4;r.u=Math.PI*t.d/1000;r.anchor=r.Nperm+(soil.f?r.u*fSum(F_SIDE[soil.f],Math.min(df,h),h):0);r.method='Таблица производителя × коэффициент грунта '+soil.k}
  else if(t.kind==='manual'){r.Nperm=+P.pileFd;r.Fd=r.Nperm*1.4;r.u=Math.PI*t.d/1000;r.anchor=r.Nperm*.5;r.method='Значение из паспорта / геологии'}
  else if(!soil.R){r.Nperm=0;r.Fd=0;r.u=t.kind==='driven'?4*t.a/1000:Math.PI*t.d/1000;r.anchor=0;r.method='Грунт непригоден'}
  else{const dv=t.kind==='driven',As=dv?(t.a/1000)**2:Math.PI*(t.d/1000)**2/4,A=dv?As:Math.PI*((t.base||t.d)/1000)**2/4,u=dv?4*t.a/1000:Math.PI*t.d/1000;
    const R=Rtip((dv?R_DRIVEN:R_BORED)[soil.R],h),gcf=dv?1:.7,tip=R*A,fr=u*gcf*fSum(F_SIDE[soil.f],Math.min(1,h),h);
    Object.assign(r,{R,A,u,tip,fr,gcf,Fd:tip+fr,Nperm:(tip+fr)/1.4,method:dv?'СП 24.13330, забивная свая: Fd = R·A + u·Σγcf·fi·hi':'СП 24.13330, буронабивная: Fd = R·A + u·Σγcf·fi·hi, γcf = 0,7'});
    r.anchor=u*gcf*fSum(F_SIDE[soil.f],Math.min(df,h),h)+(t.base?.5*R*(A-As):0)}
  r.Fheave=soil.tau*r.u*Math.min(df,h);
  return r;
}
const LUMBER_T={planed:'Доска сухая строганая',edged:'Доска сухая обрезная',beam:'Брус сухой'};
const LUMBER_ALIAS={'строганая':'planed','строганная':'planed','planed':'planed','обрезная':'edged','edged':'edged','брус':'beam','beam':'beam'};
function defaultDB(){const r=[],add=(t,b,hs,price,lens)=>hs.forEach(h=>r.push({t,b,h,lens,price,use:true}));
  add('planed',20,[95,120,145],36000,'3000, 4000, 6000');add('planed',35,[95,120,145,195],35000,'3000, 4000, 6000');
  add('planed',45,[45,70,95,120,145,170,195,220,245],34000,'3000, 4000, 6000');
  add('edged',25,[100,150],24000,'3000, 4000, 6000');add('edged',32,[100,150],24000,'3000, 4000, 6000');add('edged',40,[100,150,200],25000,'3000, 4000, 6000');
  add('edged',50,[50,100,150,200,250],26000,'3000, 4000, 6000');
  add('beam',100,[100,150,200],27000,'3000, 6000');add('beam',150,[150,200],27000,'3000, 6000');add('beam',200,[200],28000,'3000, 6000');
  return r}
/* обшивка: расчётная несущая способность на сдвиг, кН на 1 м сплошного участка (односторонняя, гвозди 2,5–3,1 мм) */
const SHEATH={
  osb9:{n:'OSB-3 9 мм',t:9,fv:{150:3.0,100:4.2},price:'osb9'},
  osb12:{n:'OSB-3 12 мм',t:12,fv:{150:3.8,100:5.3},price:'osb12'},
  ply9:{n:'Фанера ФСФ 9 мм',t:9,fv:{150:3.4,100:4.7},price:'ply9'},
  csp12:{n:'ЦСП 12 мм',t:12,fv:{150:2.6,100:3.5},price:'csp12'}
};
/* технологии каркасного строительства: ограничения и значения по умолчанию */
const TECH={
  free:{n:'Свободная — все параметры вручную',short:'свободная'},
  canadian:{n:'Канадская (платформенная)',short:'канадская',
    lim:{studS:[400,600],joistS:[400,600],rafterS:[400,600],bracing:['sheathing'],sheathMat:['osb9','osb12','ply9'],topPlates:[2],instLayer:[false],windBoard:[false]},
    def:{studS:400,joistS:400,rafterS:600,bracing:'sheathing',sheathMat:'osb12',topPlates:2,instLayer:false,windBoard:false},
    about:'Платформенный каркас: стены собирают на готовом перекрытии, шаг стоек 400 мм (16″), двойная верхняя обвязка, над проёмами — перемычка-хедер из двух досок на сдвоенных стойках. Жёсткость даёт сплошная обшивка OSB или фанерой снаружи, укосины не применяются.',
    tips:['Шаг стоек и лаг 400 мм — под лист OSB 1250 мм стык попадает на каждую третью стойку.','Обшивку OSB крепят по всему контуру листа, зазор между листами 3 мм.','Стена плотная, «термос»: в доме нужна приточно-вытяжная вентиляция.','Стыки досок верхней и нижней доски двойной обвязки разносят не менее чем на 1,2 м, вторая доска перекрывает углы.']},
  finnish:{n:'Финская (скандинавская)',short:'финская',
    lim:{studS:[635,600],joistS:[635,600],rafterS:[635,600],bracing:['braces'],lumber:['planed'],topPlates:[1],instLayer:[true],windBoard:[true]},
    def:{studS:635,joistS:635,rafterS:635,bracing:'braces',lumber:'planed',topPlates:1,instLayer:true,windBoard:true},
    about:'Каркас из сухой строганой калиброванной доски, шаг 635 мм по осям (590 в свету — под плиту утеплителя 600 мм; классический финский шаг 600 — под плиту 565 мм), одинарная верхняя обвязка — балки и стропила ставятся точно над стойками. Жёсткость дают врезные укосины; снаружи — ветрозащитная плита и вентзазор, изнутри — пароизоляция и инсталляционный слой 50 мм для проводки. Стена «дышит».',
    tips:['Балки перекрытия и стропила стоят строго над стойками — при одинарной обвязке иначе её продавит.','Инсталляционный слой: обрешётка 45×45 с шагом 600 поверх пароизоляции, в нём — проводка и утеплитель 50 мм. Пароизоляцию не прокалывают.','Ветрозащитная плита (мягкая ДВП 25 мм) — паропроницаемая, крепится к стойкам, поверх — рейка вентзазора и фасадная доска.','Если укосина на стене не помещается из-за проёмов, эту стену закрывают OSB или фанерой — программа делает это автоматически.']}
};
const techLim=k=>(TECH[P.tech]||TECH.free).lim?.[k]||null;
const techOk=patch=>Object.entries(patch).every(([k,v])=>{const al=techLim(k);return !al||al.some(x=>String(x)===String(v))});
function enforceTech(P){const T=TECH[P.tech]||TECH.free;if(!T.lim)return [];const ch=[];Object.entries(T.lim).forEach(([k,al])=>{if(!al.some(v=>String(v)===String(P[k]))){P[k]=T.def[k]??al[0];ch.push(k)}});return ch}
function wallLayers(P){
  const SM=SHEATH[P.sheathMat]||SHEATH.osb9,L=['Внутренняя отделка (вагонка, гипсокартон)'];
  if(P.instLayer)L.push('Инсталляционный слой: обрешётка 45×45 шаг 600 + утеплитель 50 мм');
  L.push('Пароизоляция, швы на ленту',`Утеплитель ${P.studH} мм между стойками ${P.studB}×${P.studH}, шаг ${P.studS}`);
  if(P.bracing==='braces')L.push(`Врезные укосины ${P.braceB}×${P.braceH} под 45–60° (на стенах без места — ${SM.n})`);else L.push(`${SM.n} — сплошная обшивка, жёсткость стены`);
  L.push(P.windBoard?'Ветрозащитная плита (мягкая ДВП 25 мм)':'Ветро-влагозащитная мембрана','Вентзазор 25–50 мм на рейке','Фасад');return L}
const T_ANCHOR=5, T_RAFTER_FIX=2.5, R_T=7; // кН — уголок анкеровки стены; кН — крепёж стропила; МПа — растяжение, сосна 2 сорт
function dbRows(t,f){return (P.db||[]).filter(r=>r.use&&r.t===t&&(!f||f(r))).sort((a,c)=>a.b*a.h-c.b*c.h||a.h-c.h)}
const frameRows=f=>dbRows(P.lumber,f);
function findRow(b,h){return (P.db||[]).find(r=>r.use&&+r.b===+b&&+r.h===+h)}
function nearestRow(rows,b,h){let best=null,bs=Infinity;rows.forEach(r=>{const sc=Math.abs(r.h-h)+2*Math.abs(r.b-b)+(r.h<h-10?1000:0)+(r.b<b?1:0);if(sc<bs){bs=sc;best=r}});return best}
const SEC_PAIRS=[['studB','studH',()=>frameRows(r=>r.b>=40&&r.h>=95),'стойка'],['joistB','joistH',()=>frameRows(r=>r.b>=40&&r.h>=120),'лага'],['rafterB','rafterH',()=>frameRows(r=>r.b>=40&&r.h>=120),'стропило'],
  ['attB','attH',()=>frameRows(r=>r.b>=40&&r.h>=120),'балка перекрытия'],['packB','packH',()=>frameRows(r=>r.b>=40&&r.h>=145),'доска ростверка'],['beamB','beamH',()=>dbRows('beam'),'брус ростверка'],['braceB','braceH',()=>dbRows('edged',r=>r.b<=32),'укосина'],['purB','purH',()=>dbRows('beam'),'коньковый прогон'],['postB','postH',()=>dbRows('beam'),'стойка под прогон']];
const SEC_H=[['partH',()=>frameRows(r=>r.b===+P.studB&&r.h>=70),'стойка перегородки'],['lintelH',()=>frameRows(r=>r.b===+P.studB&&r.h>=120),'перемычка'],['kneeD',()=>frameRows(r=>r.b===+P.studB&&r.h>=70),'стойка стенки мансарды']];
/* подогнать все сечения проекта под базу и выбранный тип доски */
function mapToDb(){
  const ch=[];
  if(!frameRows(r=>r.b>=40&&r.h>=95).length){const alt=P.lumber==='planed'?'edged':'planed';if(dbRows(alt,r=>r.b>=40&&r.h>=95).length){P.lumber=alt;ch.push(`в базе нет подходящих позиций выбранного типа — каркас переведён на «${LUMBER_T[alt]}»`)}}
  if(P.beamType!=='pack'&&!dbRows('beam').length&&frameRows(r=>r.b>=40&&r.h>=145).length){P.beamType='pack';ch.push('бруса в базе нет — ростверк собран пакетом досок «ёлочкой»')}
  SEC_PAIRS.forEach(([kb,kh,rows,nm])=>{const rs=rows();if(!rs.length)return;if(rs.some(r=>r.b===+P[kb]&&r.h===+P[kh]))return;const r=nearestRow(rs,+P[kb],+P[kh]);if(r){ch.push(`${nm} ${P[kb]}×${P[kh]} → ${r.b}×${r.h}`);P[kb]=r.b;P[kh]=r.h}});
  SEC_H.forEach(([k,rows,nm])=>{const rs=rows();if(!rs.length)return;if(rs.some(r=>r.h===+P[k]))return;const r=nearestRow(rs,+P.studB,+P[k]);if(r){ch.push(`${nm} → ${r.b}×${r.h}`);P[k]=r.h}});
  return ch;
}
function usedNotInDb(){const out=[];SEC_PAIRS.forEach(([kb,kh,rows,nm])=>{if(kb==='packB'&&P.beamType!=='pack')return;if(kb==='beamB'&&P.beamType==='pack')return;if(kb==='braceB'&&P.bracing!=='braces')return;if((kb==='purB'||kb==='postB')&&P.rafterSys!=='purlin')return;if(!rows().some(r=>r.b===+P[kb]&&r.h===+P[kh]))out.push(`${nm} ${P[kb]}×${P[kh]}`)});return out}
const PILE_LENS={screw:[2000,2500,3000,3500,4000,4500,5000,6000],driven:[3000,4000,5000,6000,7000,8000],bored:[1500,2000,2500,3000,3500,4000,4500,5000],manual:[1500,2000,2500,3000,3500,4000,5000,6000]};
const ALL_LENS=[...new Set(Object.values(PILE_LENS).flat())].sort((a,c)=>a-c);
const ROLE={
  'Б':'Балка ростверка','ОБ':'Обвязочная доска пола','Л':'Лага пола',
  'НО':'Нижняя обвязка','ВО':'Верхняя обвязка','С':'Стойка','СП':'Стойка проёма опорная','СК':'Стойка укороченная',
  'ПР':'Перемычка (доска на ребро)','Р':'Ригель подоконный','УК':'Укосина (раскос) врезная','ИО':'Обрешётка инсталляционного слоя','УТ':'Доска тёплого угла / примыкания (плашмя)','СФ':'Стойка фронтона / надстройки','ОФ':'Обвязка надстройки',
  'БП':'Балка перекрытия (чердак / мансарда)','СН':'Стропильная нога','СНФ':'Стропило фронтонного свеса','КБ':'Коньковая доска','ПК':'Стойка под стропило',
  'КП':'Коньковый прогон','ПДК':'Подкос к коньковому прогону','СХ':'Схватка (ригель) пары стропил','СТК':'Стойка под коньковый прогон','ЛЖ':'Лежень под стойки','НР':'Нарожник (укороченное стропило у ендовы)','ЕН':'Ендовная балка (сдвоенная)','КР':'Контробрешётка','ОР':'Обрешётка','ВД':'Ветровая доска','ЛД':'Лобовая доска','РГ':'Ригель (затяжка) мансарды'
};
const ROLE_ORDER=Object.keys(ROLE);
const GRP={
  piles:{n:'Сваи',c:0x7c868c,css:'#7c868c'},
  grill:{n:'Ростверк',c:0x7d5128,css:'#7d5128'},
  floor:{n:'Перекрытие пола',c:0xc28e52,css:'#c28e52'},
  walls:{n:'Каркас наружных стен',c:0xe3bb7e,css:'#e3bb7e'},
  parts:{n:'Перегородки',c:0xd8c597,css:'#d8c597'},
  gable:{n:'Фронтоны и надстройка',c:0xd3a463,css:'#d3a463'},
  mans:{n:'Мансарда',c:0xd9b07a,css:'#d9b07a'},
  attic:{n:'Перекрытие чердака / мансарды',c:0xbb8f55,css:'#bb8f55'},
  roof:{n:'Стропильная система',c:0xa36d36,css:'#a36d36'},
  lath:{n:'Обрешётка и доборные',c:0xd9c6a3,css:'#d9c6a3'},
  cover:{n:'Кровельное покрытие',c:0x46687a,css:'#46687a'}
};
const GRP_ORDER=Object.keys(GRP);

/* ---------- пример проекта ---------- */
const DEF={
  name:'Дом 9×7, двускатная крыша',
  A:9000,B:7000,H:2800,
  tech:'free',corner:'warm',topPlates:2,instLayer:false,windBoard:false,
  lumber:'planed',studB:45,studH:145,studS:625,partH:95,partS:600,lintelH:195,lintelPly:2,wallOsb:9,
  bracing:'sheathing',sheathMat:'osb9',nailStep:150,braceB:25,braceH:100,
  pile:'p108',pileFd:50,soil:'loam',freeze:1400,pileMaxS:2500,pileLen:'auto',plinth:500,
  beamType:'brus',beamB:150,beamH:200,packB:45,packH:195,beamPly:3,beamsMid:'auto',joistB:45,joistH:195,joistS:600,floorOsb:22,
  roof:'gable',slope:30,roofMat:'metal',overhang:500,gableOver:400,rafterB:45,rafterH:195,rafterS:600,attB:45,attH:195,strut:false,rafterSys:'hang',purB:150,purH:200,postB:100,postH:100,postS:3000,purStruts:true,collar:true,mansard:false,kneeH:1200,mansH:2400,kneeD:95,gMans:.6,pMans:1.5,
  snow:'III',wind:'I',terrain:'B',gFloor:.5,pFloor:1.5,gAttic:.35,pAttic:.7,gWall:.5,
  stocks:'6000, 4500, 3000',kerf:4,
  prices:{wood:28000,osb9:780,osb12:980,osb22:1950,insul:4300,wind:2600,vapor:1700,roofMetal:650,roofProf:520,roofSoft:820,roofOndulin:430,pile:2900,pileWork:1300,rc20:1500,rc30:2400,rcDrive:3500,plate:450,concrete:6800,rebar:80,sleeve:120,boredWork:1800,nails:260,screws:950,bracket:65,antiseptic:160,anchor:190,ply9:1350,csp12:1150,windBoard:750},
  db:defaultDB(),
  openings:[
    {wall:'W1',type:'window',x:800,w:1200,h:1400,sill:900},
    {wall:'W1',type:'door',x:3900,w:1000,h:2100,sill:0},
    {wall:'W1',type:'window',x:6600,w:1500,h:1400,sill:900},
    {wall:'W2',type:'window',x:2400,w:1200,h:1400,sill:900},
    {wall:'W3',type:'window',x:1500,w:1200,h:1400,sill:900},
    {wall:'W3',type:'window',x:6000,w:900,h:600,sill:1500},
    {wall:'W4',type:'window',x:3800,w:1200,h:1400,sill:900},
    {wall:'I1',type:'door',x:2000,w:900,h:2100,sill:0},
    {wall:'I1',type:'door',x:6000,w:900,h:2100,sill:0},
    {wall:'I2',type:'door',x:800,w:800,h:2100,sill:0}
  ],
  rooms:[],
  blocks:[],
  walls:[
    {axis:'x',c:3500,from:0,to:9000,bearing:true},
    {axis:'y',c:4500,from:3550,to:7000,bearing:false}
  ]
};
const LS_KEY='karkas-proekt-v1';
function loadP(){try{const s=localStorage.getItem(LS_KEY);if(s){const o=JSON.parse(s);return normalize(o)}}catch(e){}return clone(DEF)}
function normalize(o){const p=Object.assign(clone(DEF),o);
  if(!o.lumber)p.lumber='edged';if(!Array.isArray(o.db)||!o.db.length)p.db=defaultDB();
  if(!o.beamType){if(+o.beamPly>1){p.beamType='pack';p.packB=R(+o.beamB/+o.beamPly);p.packH=+o.beamH}else{p.beamType='brus';p.beamPly=3}}
  if(!o.sheathMat)p.sheathMat=+o.wallOsb===12?'osb12':'osb9';p.prices=Object.assign(clone(DEF.prices),o.prices||{});if(!Array.isArray(p.openings))p.openings=[];if(!Array.isArray(p.walls))p.walls=[];if(!Array.isArray(p.rooms))p.rooms=[];if(!Array.isArray(p.blocks))p.blocks=[];return p}
function saveP(){try{localStorage.setItem(LS_KEY,JSON.stringify(P))}catch(e){}}
let P=loadP();

