/* FOG CASHIER operational cleanup controls */
(()=>{
  if(window.__fogOpsV48Loaded)return;
  window.__fogOpsV48Loaded=true;

  const style=document.createElement('style');
  style.textContent=`
    .fog-reset-btn{border-color:#d4a8a8!important;color:#a01818!important;background:#fff8f8!important}
    .fog-reset-btn:active{background:#ffeaea!important}
  `;
  document.head.appendChild(style);

  function hasTableData(){
    return !!(db&&db.tables&&Object.keys(db.tables).some(key=>db.tables[key]));
  }

  function resetTables(){
    if(typeof db==='undefined')return;
    if(!hasTableData()){
      if(typeof toast==='function')toast('卓表はすでに空です');
      return;
    }
    if(!window.confirm('卓表をすべてリセットしますか？\n※「戻す」で1回前の状態に復元できます'))return;
    if(typeof snapshot==='function')snapshot('卓表リセット');
    db.tables={};
    if(typeof closeModal==='function')closeModal();
    if(typeof saveDB==='function')saveDB();
    else if(typeof renderAll==='function')renderAll();
    if(typeof toast==='function')toast('卓表をリセットしました');
  }

  function resetReservations(){
    if(typeof db==='undefined')return;
    if(!Array.isArray(db.reservations)||db.reservations.length===0){
      if(typeof toast==='function')toast('予定表はすでに空です');
      return;
    }
    if(!window.confirm('予定表をすべてリセットしますか？\n※「戻す」で1回前の状態に復元できます'))return;
    if(typeof snapshot==='function')snapshot('予定表リセット');
    db.reservations=[];
    if(typeof closeModal==='function')closeModal();
    if(typeof saveDB==='function')saveDB();
    else if(typeof renderAll==='function')renderAll();
    if(typeof switchScreen==='function')switchScreen('schedule');
    if(typeof toast==='function')toast('予定表をリセットしました');
  }

  window.fogResetTables=resetTables;
  window.fogResetReservations=resetReservations;

  function currentScreenName(){
    const schedule=document.getElementById('scheduleScreen');
    return schedule?.classList.contains('active')?'schedule':'board';
  }

  function updateResetButton(){
    const btn=document.getElementById('fogResetCurrent');
    if(!btn)return;
    const schedule=currentScreenName()==='schedule';
    btn.textContent=schedule?'予定表リセット':'卓表リセット';
    btn.setAttribute('aria-label',btn.textContent);
  }

  function installResetButton(){
    if(document.getElementById('fogResetCurrent')){
      updateResetButton();
      return;
    }
    const footer=document.querySelector('footer.bottom');
    if(!footer)return;
    const spacer=footer.querySelector('.spacer');
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='fogResetCurrent';
    btn.className='btn fog-reset-btn';
    btn.onclick=()=>{
      if(currentScreenName()==='schedule')resetReservations();
      else resetTables();
    };
    if(spacer)footer.insertBefore(btn,spacer);
    else footer.appendChild(btn);
    updateResetButton();
  }

  if(typeof switchScreen==='function'&&!window.__fogOpsSwitchWrapped){
    const originalSwitchScreen=switchScreen;
    switchScreen=function(name){
      const result=originalSwitchScreen.apply(this,arguments);
      updateResetButton();
      return result;
    };
    window.__fogOpsSwitchWrapped=true;
  }

  /* 予定客を卓へ案内できたら、予定表から自動的に消す */
  if(typeof assignReservation==='function'&&!window.__fogOpsAssignAutoRemoveWrapped){
    const originalAssignReservation=assignReservation;
    assignReservation=function(id){
      const existed=Array.isArray(db?.reservations)&&db.reservations.some(r=>r&&r.id===id);
      const result=originalAssignReservation.apply(this,arguments);
      if(existed&&Array.isArray(db?.reservations)){
        const stillExists=db.reservations.some(r=>r&&r.id===id);
        if(stillExists){
          db.reservations=db.reservations.filter(r=>r&&r.id!==id);
          if(typeof saveDB==='function')saveDB();
          else if(typeof renderAll==='function')renderAll();
        }
      }
      return result;
    };
    window.__fogOpsAssignAutoRemoveWrapped=true;
  }

  installResetButton();
})();
