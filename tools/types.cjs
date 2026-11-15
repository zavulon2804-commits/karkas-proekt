// Проверка типов TypeScript (по JS-модулям src/js). Сообщает только НОВЫЕ ошибки относительно tests/tsc-baseline.txt.
//   node tools/types.cjs            — проверка
//   node tools/types.cjs --update   — принять текущий список как эталон
const cp=require('child_process'),fs=require('fs'),path=require('path');const ROOT=path.resolve(__dirname,'..');
let out='';try{out=cp.execSync('npx tsc -p .',{cwd:ROOT,encoding:'utf8'})}catch(e){out=e.stdout||''}
// ключ ошибки: файл + код + текст строки кода (без номеров строк — они сдвигаются при правках)
const keys=out.split('\n').filter(l=>/error TS/.test(l)).map(l=>{const m=l.match(/^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/);if(!m)return l;
  const src=fs.readFileSync(path.join(ROOT,m[1]),'utf8').split('\n')[+m[2]-1].trim().slice(0,120);return `${m[1]} ${m[3]} ${m[4].slice(0,80)} | ${src}`});
const bf=path.join(ROOT,'tests/tsc-baseline.txt');
if(process.argv.includes('--update')){fs.writeFileSync(bf,[...new Set(keys)].sort().join('\n')+'\n');console.log('Эталон типов обновлён:',keys.length);process.exit(0)}
const base=new Set(fs.existsSync(bf)?fs.readFileSync(bf,'utf8').split('\n'):[]);
const fresh=out.split('\n').filter(l=>/error TS/.test(l)).filter((l,i)=>!base.has(keys[i]));
if(fresh.length){console.log('Новые ошибки типов:\n'+fresh.join('\n'));process.exit(1)}console.log(`Типы: новых ошибок нет (известных ${keys.length})`);
