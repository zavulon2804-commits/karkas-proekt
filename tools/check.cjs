// Проверка Каркас-Проекта одной командой.
//   node tools/check.cjs                 — все шаблоны: смета, сваи, помещения, ошибки, листы; сравнение с tests/baseline.json
//   node tools/check.cjs --update        — принять текущие результаты как эталон
//   node tools/check.cjs --shots=tt:АР-1,АР-3 --out=папка   — снимки листов шаблона (без списка — все листы)
//   node tools/check.cjs --dxf           — дополнительно собрать DXF всех листов
// Выход с кодом 1, если есть ошибки JS или отличия от эталона.
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..'),arg=k=>{const a=process.argv.find(x=>x===k||x.startsWith(k+'='));return a?(a.split('=')[1]??true):null};
function three(){const c=[path.join(ROOT,'node_modules/three/build/three.module.min.js'),path.join(ROOT,'tools/.cache/three-0.170.module.min.js')].find(fs.existsSync);if(c)return c;
  const d=path.join(ROOT,'tools/.cache');fs.mkdirSync(d,{recursive:true});cp.execSync('npm pack three@0.170.0 --silent && tar -xzf three-0.170.0.tgz package/build/three.module.min.js && mv package/build/three.module.min.js three-0.170.module.min.js && rm -rf package three-0.170.0.tgz',{cwd:d,stdio:'ignore'});return path.join(d,'three-0.170.module.min.js')}
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']}),p=await b.newPage({viewport:{width:1500,height:950}});
  const T=fs.readFileSync(three());await p.route('**/three.module.min.js',r=>r.fulfill({body:T,contentType:'application/javascript'}));
  const errs=[];p.on('pageerror',e=>errs.push('JS: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load|net::/.test(m.text()))errs.push('console: '+m.text())});
  await p.goto('file://'+path.join(ROOT,'index.html'));await p.waitForTimeout(1200);
  const keys=await p.evaluate(()=>Object.keys(TEMPLATES)),dxf=!!arg('--dxf'),res={};
  for(const k of keys){await p.evaluate(k=>{$('#tplSel').value=k;$('#tplGo').click()},k);await p.waitForTimeout(400);
    res[k]=await p.evaluate(dx=>{SHEETS=makeSheets();const o={cost:Math.round(S.total),piles:M.piles.length,rooms:(M.rooms||[]).map(r=>+r.area.toFixed(1)).join(' '),roof:+(M.roofArea||0).toFixed(1),
      fail:C.checks.filter(c=>!c.ok).map(c=>c.id).join(' '),errs:M.errs.length+M.ops.filter(o=>!o.ok).length,sheets:SHEETS.map(s=>s.code).join(' '),svg:SHEETS.reduce((a,s)=>a+s.svg.length,0)};
      if(dx)SHEETS.forEach(s=>{try{sheetDxf(s)}catch(e){o.dxfErr=(o.dxfErr||'')+s.code+': '+e.message+'; '}});return o},dxf)}
  const sh=arg('--shots');if(sh){const [k,codes]=String(sh).split(':'),out=path.resolve(arg('--out')||path.join(ROOT,'dist/shots'));fs.mkdirSync(out,{recursive:true});
    await p.evaluate(k=>{$('#tplSel').value=k;$('#tplGo').click()},k);await p.waitForTimeout(400);const pg=await b.newPage({viewport:{width:1680,height:1188}});
    const list=await p.evaluate(c=>{SHEETS=makeSheets();return SHEETS.filter(s=>!c||c.split(',').includes(s.code)).map(s=>({code:s.code,svg:s.svg}))},codes||'');
    for(const s of list){await pg.setContent(`<body style="margin:0">${s.svg.replace('width="420mm" height="297mm"','width="1680" height="1188"')}</body>`);const f=path.join(out,`${k}_${s.code}.png`);await pg.screenshot({path:f});console.log('снимок',f)}}
  const bf=path.join(ROOT,'tests/baseline.json');let diff=0;
  if(arg('--update')){fs.writeFileSync(bf,JSON.stringify(res,null,1));console.log('Эталон обновлён:',keys.length,'шаблонов')}
  else{const base=fs.existsSync(bf)?JSON.parse(fs.readFileSync(bf)):{};
    for(const k of keys){const a=res[k],e=base[k];if(!e){console.log(`${k}: нет в эталоне`,JSON.stringify(a));continue}
      const d=Object.keys({...a,...e}).filter(f=>f!=='svg'&&String(a[f])!==String(e[f]));if(a.svg!==e.svg)d.push('svg');
      console.log(`${d.length?'≠':'='} ${k}: ${a.cost} ₽, свай ${a.piles}, листов ${a.sheets.split(' ').length}, не прошло: ${a.fail||'—'}`);
      d.forEach(f=>{diff++;console.log(`    ${f}: было ${f==='svg'?e.svg+' симв.':e[f]} → стало ${f==='svg'?a.svg+' симв.':a[f]}`)})}}
  if(errs.length)console.log('ОШИБКИ:\n'+errs.join('\n'));else console.log('Ошибок JS нет');
  await b.close();process.exit(errs.length||diff?1:0)})();
