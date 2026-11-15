/* ---------- спецификация и раскрой ---------- */
function parseStocks(s){const a=String(s).split(/[^\d]+/).map(Number).filter(v=>v>=1000&&v<=12000);return a.length?[...new Set(a)].sort((x,y)=>y-x):[6000]}
function splitPiece(m,maxS){
  const L=r10(m.L); if(L<=maxS) return [L];
  const cut=(m.splitAt||[]).slice().sort((a,c)=>a-c); const segs=[]; let start=0;
  while(L-start>maxS){let c=cut.filter(v=>v>start+300&&v-start<=maxS).pop();if(c==null)c=start+(L-start)/Math.ceil((L-start)/maxS);segs.push(r10(c-start));start=c}
  segs.push(r10(L-start)); return segs;
}
function cutSection(pieces,stocks,kerf){
  const maxS=stocks[0]; let best=null;
  for(const st of [null,...stocks]){
    const mx=st||maxS; if(pieces.some(p=>p.L>mx)) continue;
    const bins=[]; const sorted=[...pieces].sort((a,c)=>c.L-a.L);
    for(const p of sorted){let bi=-1,br=Infinity;for(let i=0;i<bins.length;i++){const r=bins[i].stock-bins[i].used-p.L;if(r>=0&&r<br){br=r;bi=i}}
      if(bi<0){bins.push({stock:mx,used:0,items:[]});bi=bins.length-1} const bn=bins[bi];bn.items.push(p);bn.used+=p.L+kerf}
    if(!st) bins.forEach(bn=>{const need=bn.used-kerf;bn.stock=[...stocks].sort((a,c)=>a-c).find(s=>s>=need)||maxS});
    const total=bins.reduce((s,b)=>s+b.stock,0);
    if(!best||total<best.total) best={bins,total};
  }
  return best;
}
function pileMats(M,pr){
  const t=M.pileT,n=M.piles.length,L=M.pileLen/1000,g='Сваи';
  if(t.kind==='screw'||t.kind==='manual') return [{grp:g,name:`${t.name}, L=${M.pileLen} мм, с оголовком 250×250`,unit:'шт',qty:n,price:pr.pile},{grp:g,name:'Монтаж: завинчивание, обрезка, бетонирование ствола',unit:'шт',qty:n,price:pr.pileWork}];
  if(t.kind==='driven') return [{grp:g,name:`${t.name}, L=${M.pileLen} мм`,unit:'м',qty:n*L,price:pr[t.pm],d:1},{grp:g,name:'Забивка сваи, срубка оголовка',unit:'шт',qty:n,price:pr.rcDrive},{grp:g,name:'Закладная пластина 300×300×8 с анкерами',unit:'шт',qty:n,price:pr.plate}];
  const d=t.d/1000,vs=Math.PI*d*d/4*L,vb=t.base?Math.PI*(t.base/1000)**3/6:0,conc=n*(vs+vb)*1.05;
  const rebar=n*(4*(L+.3)*.888+Math.ceil(L/.3)*Math.PI*(d-.08)*.222);
  return [{grp:g,name:`Бетон В20 F150 для свай ${t.short} (+5 %)`,unit:'м³',qty:conc,price:pr.concrete,d:2},
    {grp:g,name:'Арматура А500С Ø12 (4 стержня) + хомуты А240 Ø6 шаг 300',unit:'кг',qty:Math.ceil(rebar),price:pr.rebar},
    {grp:g,name:`Опалубка-гильза (рубероид / труба) на ${fmt((M.H0+ +M.P.freeze)/1000,1)} м`,unit:'м',qty:n*(M.H0+ +M.P.freeze)/1000,price:pr.sleeve,d:1},
    {grp:g,name:`Бурение скважин${t.base?' с уширением':''}, армирование, бетонирование`,unit:'шт',qty:n,price:pr.boredWork},
    {grp:g,name:'Закладная пластина 250×250×6 с анкерами',unit:'шт',qty:n,price:pr.plate}];
}
function spec(M,C){
  const P=M.P, items=M.mem.filter(m=>m.role);
  const key=m=>m.grp+'|'+m.role+'|'+m.sec.join('×')+'|'+r10(m.L);
  const gm=new Map();
  items.forEach(m=>{const k=key(m);if(!gm.has(k))gm.set(k,{grp:m.grp,role:m.role,sec:m.sec,L:r10(m.L),qty:0,members:[]});const g=gm.get(k);g.qty+=m.n;g.members.push(m)});
  const marks=[...gm.values()].sort((a,c)=>GRP_ORDER.indexOf(a.grp)-GRP_ORDER.indexOf(c.grp)||ROLE_ORDER.indexOf(a.role)-ROLE_ORDER.indexOf(c.role)||c.L-a.L);
  const cnt={}; marks.forEach(g=>{cnt[g.role]=(cnt[g.role]||0)+1;g.mark=g.role+cnt[g.role];g.members.forEach(m=>m.mark=g.mark);g.vol=g.qty*g.L*g.sec[0]*g.sec[1]/1e9});
  // раскрой
  const stocks=parseStocks(P.stocks), kerf=Math.max(0,+P.kerf||0);
  const bySec=new Map();
  items.forEach(m=>{const k=m.sec.join('×');if(!bySec.has(k)){const row=findRow(m.sec[0],m.sec[1]),st=row?parseStocks(row.lens):stocks;bySec.set(k,{sec:m.sec,pieces:[],joints:0,row,stocks:st})}const S=bySec.get(k);const segs=splitPiece(m,S.stocks[0]);
    for(let i=0;i<m.n;i++){segs.forEach(L=>S.pieces.push({L,mark:m.mark}));if(segs.length>1)S.joints++}});
  const cuts=[...bySec.values()].sort((a,c)=>a.sec[0]*a.sec[1]-c.sec[0]*c.sec[1]||a.sec[0]-c.sec[0]).map(S=>{
    const res=cutSection(S.pieces,S.stocks,kerf), used=S.pieces.reduce((s,p)=>s+p.L,0);
    const buy={}; res.bins.forEach(b=>buy[b.stock]=(buy[b.stock]||0)+1);
    const pats=new Map(); res.bins.forEach(b=>{const its=[...b.items].sort((x,y)=>y.L-x.L);const k=b.stock+':'+its.map(i=>i.mark+'/'+i.L).join(',');if(!pats.has(k))pats.set(k,{stock:b.stock,items:its,count:0,rest:b.stock-its.reduce((s,i)=>s+i.L,0)-kerf*(its.length-1)});pats.get(k).count++});
    const vol=res.total*S.sec[0]*S.sec[1]/1e9,price=S.row?+S.row.price:+P.prices.wood;
    return {...S,key:S.sec.join('×'),kind:S.row?LUMBER_T[S.row.t]:'нет в базе — цена по умолчанию',price,cost:vol*price,bins:res.bins,total:res.total,used,waste:(res.total-used)/res.total,buy,pats:[...pats.values()].sort((a,c)=>c.count-a.count||c.stock-a.stock),vol};
  });
  const woodVol=cuts.reduce((s,c)=>s+c.vol,0), netVol=marks.reduce((s,m)=>s+m.vol,0);
  // прочие материалы
  const {A,B,H,d}=M, pr=P.prices;
  const extOps=M.ops.filter(o=>o.ok&&M.walls.find(w=>w.id===o.wall)?.ext);
  const opsA=extOps.reduce((s,o)=>s+o.w*o.h,0)/1e6;
  const gabA=M.gable?(B*B/2*M.tn)/1e6:(B*B*M.tn)/1e6+A*M.Hr/1e6;
  const wallG=(M.extPerim||2*(A+B))*H/1e6, wallNet=wallG-opsA;
  const parts=M.walls.filter(w=>!w.ext), partA=parts.reduce((s,w)=>s+w.L*H,0)/1e6-M.ops.filter(o=>o.ok&&!M.walls.find(w=>w.id===o.wall)?.ext).reduce((s,o)=>s+o.w*o.h,0)/1e6;
  const wingA=(M.wings||[]).reduce((t,k)=>t+k.area,0),floorA=A*B/1e6+wingA, roofA=M.roofArea;
  const insW=wallNet*d/1000*(1-M.b/(+P.studS)), insF=floorA*M.hj/1000*(1-M.bj/M.sj), insA=floorA*M.ha/1000*(1-M.ba/M.sr), insP=Math.max(0,partA)*(+P.partH)/1000*(1-M.b/(+P.partS));
  const sheet=3.125;
  const SM=SHEATH[P.sheathMat]||SHEATH.osb9;
  const shWallA=M.rackWalls.filter(w=>w.mode==='sheath').reduce((s,w)=>s+(w.L+(w.ux?0:2*M.d))*H/1e6-w.ops.filter(o=>o.ok).reduce((a,o)=>a+o.w*o.h,0)/1e6,0);
  const shA=Math.max(0,shWallA)+(P.windBoard?0:gabA), nAnch=C?C.H.walls.reduce((s,x)=>s+2*x.anch,0):0, nUp=C?Math.max(2,Math.ceil(Math.max(0,+(C.checks.find(c=>c.id==='rafter_up')?.rows[0][1]||'0').replace(',','.'))/T_RAFTER_FIX)):2;
  const osbW=Math.ceil(shA*1.08/sheet), osbF=Math.ceil(floorA*1.06/sheet), osbR=M.mat.osb?Math.ceil(roofA*1.08/sheet):0;
  const mA=M.mans&&M.mansOk?{sl:2*(M.yc/M.cs)*A/1e6,ce:Math.max(0,B-2*M.yc)*A/1e6}:{sl:0,ce:0};
  const windA=((P.windBoard?0:wallNet+gabA)+floorA+(M.mans?mA.sl+mA.ce:floorA)+(M.mat.counter?roofA:0))*1.15, vapA=(wallNet+floorA+(M.mans?mA.sl+mA.ce+gabA:floorA))*1.15;
  const nRaf=M.mem.filter(m=>m.role==='СН').length, nJ=M.mem.filter(m=>m.role==='Л').length, nAtt=M.mem.filter(m=>m.role==='БП').length;
  const osbKey=v=>v<=9?'osb9':v<=12?'osb12':'osb22';
  const mats=[
    ...pileMats(M,pr),
    {grp:'Листовые',name:`${SM.n}, обшивка ${P.bracing==='braces'?'стен без места для укосин':'стен'}${P.windBoard?'':' и фронтонов'} (2500×1250, ${fmt(shA,1)} м²)`,unit:'лист',qty:osbW,price:pr[SM.price]},
    {grp:'Листовые',name:`OSB-3 ${P.floorOsb} мм, черновой пол (2500×1250)`,unit:'лист',qty:osbF,price:pr[osbKey(+P.floorOsb)]},
    ...(osbR?[{grp:'Листовые',name:'OSB-3 12 мм, сплошное основание кровли',unit:'лист',qty:osbR,price:pr.osb12}]:[]),
    {grp:'Утеплитель',name:`Минвата плитная, стены ${d} мм`,unit:'м³',qty:insW,price:pr.insul,d:2},
    {grp:'Утеплитель',name:`Минвата плитная, пол ${M.hj} мм`,unit:'м³',qty:insF,price:pr.insul,d:2},
    ...(M.mans&&M.mansOk?[
      {grp:'Утеплитель',name:`Минвата, скаты мансарды ${M.hr} мм (${fmt(mA.sl,1)} м²)`,unit:'м³',qty:mA.sl*M.hr/1000*(1-M.br/M.sr),price:pr.insul,d:2},
      {grp:'Утеплитель',name:`Минвата, потолок мансарды 200 мм (${fmt(mA.ce,1)} м²)`,unit:'м³',qty:mA.ce*.2,price:pr.insul,d:2},
      {grp:'Утеплитель',name:`Минвата, фронтоны мансарды ${d} мм (${fmt(gabA,1)} м²)`,unit:'м³',qty:gabA*d/1000*(1-M.b/(+P.studS)),price:pr.insul,d:2},
      {grp:'Утеплитель',name:'Минвата, звукоизоляция перекрытия 100 мм',unit:'м³',qty:floorA*.1*(1-M.ba/M.sr),price:pr.insul,d:2},
      {grp:'Листовые',name:`OSB-3 ${P.floorOsb} мм, пол мансарды (2500×1250)`,unit:'лист',qty:Math.ceil(floorA*1.06/sheet),price:pr[osbKey(+P.floorOsb)]}]
    :[{grp:'Утеплитель',name:`Минвата плитная, перекрытие чердака ${M.ha} мм`,unit:'м³',qty:insA,price:pr.insul,d:2}]),
    ...(insP>0?[{grp:'Утеплитель',name:`Минвата, звукоизоляция перегородок ${P.partH} мм`,unit:'м³',qty:insP,price:pr.insul,d:2}]:[]),
    ...(P.windBoard?[{grp:'Листовые',name:`Ветрозащитная плита, мягкая ДВП 25 мм (2700×1200), стены и фронтоны ${fmt(wallNet+gabA,1)} м²`,unit:'лист',qty:Math.ceil((wallNet+gabA)*1.06/3.24),price:pr.windBoard}]:[]),
    ...(P.instLayer?[{grp:'Утеплитель',name:'Минвата 50 мм, инсталляционный слой стен',unit:'м³',qty:wallNet*.05*(1-45/600),price:pr.insul,d:2}]:[]),
    {grp:'Плёнки',name:`Ветро-влагозащитная мембрана (${fmt(windA,0)} м² с нахлёстом), рулон 70 м²`,unit:'рулон',qty:Math.ceil(windA/70),price:pr.wind},
    {grp:'Плёнки',name:`Пароизоляция (${fmt(vapA,0)} м² с нахлёстом), рулон 70 м²`,unit:'рулон',qty:Math.ceil(vapA/70),price:pr.vapor},
    {grp:'Кровля',name:`${M.mat.name} (площадь скатов ${fmt(roofA,1)} м² + 12 % на подрезку)`,unit:'м²',qty:roofA*1.12,price:pr[M.mat.price],d:1},
    {grp:'Крепёж',name:'Гвозди каркасные 4×100 / 3,1×90 (≈8 кг на 1 м³)',unit:'кг',qty:Math.ceil(woodVol*8),price:pr.nails},
    {grp:'Крепёж',name:`Гвозди / саморезы для обшивки (шаг ${P.nailStep} по краю)`,unit:'тыс. шт',qty:Math.ceil((osbW*(+P.nailStep===100?42:30)+(osbF+osbR)*30)/100)/10,price:pr.screws,d:1},
    {grp:'Крепёж',name:`Анкерные уголки 105×105 — крепление стен к перекрытию от сдвига и отрыва (${T_ANCHOR} кН)`,unit:'шт',qty:nAnch,price:pr.anchor},
    {grp:'Крепёж',name:`Уголки и опоры: лаги и балки по 2, стропила по ${nUp} на узел`,unit:'шт',qty:(nJ+nAtt)*2+nRaf*nUp,price:pr.bracket},
    {grp:'Защита',name:'Антисептик, 2 слоя (≈25 л на 1 м³)',unit:'л',qty:Math.ceil(woodVol*25),price:pr.antiseptic}
  ];
  mats.forEach(m=>m.sum=m.qty*m.price);
  const woodSum=cuts.reduce((s,c)=>s+c.cost,0), total=woodSum+mats.reduce((s,m)=>s+m.sum,0);
  return {marks,cuts,stocks,kerf,woodVol,netVol,woodSum,mats,total,areas:{wallNet,gabA,floorA,roofA,opsA,partA},osb:{osbW,osbF,osbR}};
}

