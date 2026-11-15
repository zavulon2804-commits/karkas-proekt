'use strict';
/* =========================================================================
   Каркас-Проект — проектирование каркасного дома на сваях (винтовых и железобетонных).
   Единицы: геометрия — мм, нагрузки — кПа (кН/м²), погонные — кН/м (= Н/мм).
   ========================================================================= */
const $=s=>document.querySelector(s);
const R=Math.round, rad=a=>a*Math.PI/180;
const r10=x=>Math.ceil(x/10-1e-9)*10;
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(n,d=0)=>Number.isFinite(+n)?(+n).toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const rub=n=>fmt(R(n))+' ₽';
let IS_LOCAL=false; try{IS_LOCAL=window.top===window.self}catch(e){IS_LOCAL=false}

