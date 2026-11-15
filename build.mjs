// Сборка: склеивает src/ в один index.html (GitHub Pages) и копию для claude.ai (без обёртки документа).
// Запуск: node build.mjs
import {readFileSync as r, writeFileSync as w, readdirSync, mkdirSync} from 'node:fs';
const js = readdirSync('src/js').filter(f => f.endsWith('.js')).sort().map(f => r('src/js/' + f, 'utf8')).join('');
const html = r('src/head.html','utf8') + '<style>\n' + r('src/style.css','utf8') + '</style>\n' + r('src/body.html','utf8') + '<script>\n' + js + '</script>\n' + r('src/tail.html','utf8');
w('index.html', html);
mkdirSync('dist', {recursive: true});
const lines = html.split('\n'); // артефакт: без первой строки (<!doctype…<body>) и без последней (</body></html>)
w('dist/artifact.html', lines.slice(1, -1).join('\n') + '\n');
console.log('index.html', html.length, 'символов; dist/artifact.html готов');
