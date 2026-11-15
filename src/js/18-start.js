/* ---------- старт ---------- */
renderSide(); renderTabs(); rebuild();
$('#undo').onclick=()=>undoRedo(-1);$('#redo').onclick=()=>undoRedo(1);updUndo();
window.addEventListener('beforeprint',()=>{if(!$('#print-area').innerHTML&&IS_LOCAL&&M){}});
