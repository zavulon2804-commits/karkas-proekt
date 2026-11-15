/* ---------- старт ---------- */
renderSteps(); renderSide(); renderTabs(); rebuild();
$('#helpBtn').onclick=()=>{curTab='kb';renderTabs();renderActive()};
$('#undo').onclick=()=>undoRedo(-1);$('#redo').onclick=()=>undoRedo(1);updUndo();
window.addEventListener('beforeprint',()=>{if(!$('#print-area').innerHTML&&IS_LOCAL&&M){}});
