/* FOG CASHIER Ver.44 operational enhancements */
(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .fog-ops-marks{position:absolute;right:2px;top:1px;z-index:12;display:flex;gap:2px;align-items:center;pointer-events:none}
    .fog-ops-mark{min-width:16px;height:16px;padding:0 3px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:clamp(8px,.78vw,11px);line-height:1;font-weight:950;color:#111;background:#fff;border:1px solid #111;box-shadow:0 1px 1px rgba(0,0,0,.08)}
    .fog-ops-mark.up{background:#fff3b0}.fog-ops-mark.down{background:#d9efff}.fog-ops-mark.nohelp{background:#ffd7d7;color:#9c1111;border-color:#9c1111}
    .fog-new-plan{flex:0 0 auto;border:1px solid #111;border-radius:5px;padding:1px 4px;background:#111;color:#fff;font-size:clamp(7px,.72vw,10px);line-height:1.05;font-weight:950;white-space:nowrap;letter-spacing:-.02em}
    .fog-mark-panel{margin-top:10px;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fafaf8}
    .fog-mark-panel-title{font-size:11px;font-weight:900;color:#666;margin-bottom:7px}.fog-mark-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    .fog-mark-btn{border:1px solid #c9c9c3;background:#fff;border-radius:8px;padding:9px 5px;font-size:12px;font-weight:900}.fog-mark-btn.active{background:#111;color:#fff;border-color:#111}
  `;
  document.head.appendChild(style);

  function tableSessionType(s){
    try{return typeof sessionType==='function'?sessionType(s):(s?.baseType||s?.type||'')}
    catch(_){return s?.baseType||s?.type||''}
  }

  function decorateCashierTables(){
    if(typeof db==='undefined')return;
    document.querySelectorAll('.hotspot').forEach(h=>{
      const table=h.dataset.table;
      const s=db.tables?.[table];
      const ov=document.getElementById('ov-'+table);
      if(!ov||!s||s.state==='cleaning')return;
      ov.querySelector('.fog-ops-marks')?.remove();
      ov.querySelector('.fog-new-plan')?.remove();

      const marks=[];
      if(s.opsUp)marks.push('<span class="fog-ops-mark up" title="上げ">↑</span>');
      if(s.opsDown)marks.push('<span class="fog-ops-mark down" title="下げ">↓</span>');
      if(s.opsNoHelp)marks.push('<span class="fog-ops-mark nohelp" title="ヘルプなし">H×</span>');
      if(marks.length){
        const wrap=document.createElement('div');
        wrap.className='fog-ops-marks';
        wrap.innerHTML=marks.join('');
        ov.appendChild(wrap);
      }

      if(tableSessionType(s)==='new'&&s.newPlan){
        const meta=ov.querySelector('.table-meta');
        if(meta){
          const plan=document.createElement('div');
          plan.className='fog-new-plan';
          plan.textContent=(s.newPlan==='VIP'?'VIP':String(s.newPlan))+'プラン';
          const crown=meta.querySelector('.crown');
          if(crown)meta.insertBefore(plan,crown);else meta.appendChild(plan);
        }
      }
    });
  }

  if(typeof renderTables==='function'&&!window.__fogV44TablesWrapped){
    const originalRenderTables=renderTables;
    renderTables=function(){const result=originalRenderTables.apply(this,arguments);decorateCashierTables();return result};
    window.__fogV44TablesWrapped=true;
  }

  function markLabel(s,key){
    if(key==='up')return {text:'↑ 上げ',active:!!s.opsUp};
    if(key==='down')return {text:'↓ 下げ',active:!!s.opsDown};
    return {text:'H× ヘルプなし',active:!!s.opsNoHelp};
  }

  function decorateTableModal(table){
    const s=db?.tables?.[table];
    const card=document.getElementById('modalCard');
    if(!s||!card||s.state==='cleaning'||card.querySelector('.fog-mark-panel'))return;
    const firstActions=card.querySelector('.actions');
    const cardActions=card.querySelector('.card-actions');
    if(!firstActions&&!cardActions)return;
    const panel=document.createElement('div');
    panel.className='fog-mark-panel';
    panel.innerHTML='<div class="fog-mark-panel-title">卓表マーク</div><div class="fog-mark-actions"></div>';
    const actions=panel.querySelector('.fog-mark-actions');
    ['up','down','nohelp'].forEach(key=>{
      const info=markLabel(s,key);
      const btn=document.createElement('button');
      btn.type='button';btn.className='fog-mark-btn'+(info.active?' active':'');btn.textContent=info.text;
      btn.onclick=()=>toggleFogOpsMark(table,key);actions.appendChild(btn);
    });
    if(firstActions)firstActions.parentNode.insertBefore(panel,firstActions);else card.insertBefore(panel,cardActions);
  }

  if(typeof openTable==='function'&&!window.__fogV44OpenTableWrapped){
    const originalOpenTable=openTable;
    openTable=function(table){const result=originalOpenTable.apply(this,arguments);try{decorateTableModal(table)}catch(e){console.warn('mark modal',e)}return result};
    window.__fogV44OpenTableWrapped=true;
  }

  window.toggleFogOpsMark=function(table,key){
    const s=db?.tables?.[table];if(!s)return;
    if(typeof snapshot==='function')snapshot('卓表マーク');
    if(key==='up'){s.opsUp=!s.opsUp;if(s.opsUp)s.opsDown=false}
    else if(key==='down'){s.opsDown=!s.opsDown;if(s.opsDown)s.opsUp=false}
    else if(key==='nohelp'){s.opsNoHelp=!s.opsNoHelp}
    if(typeof saveDB==='function')saveDB();
    if(typeof openTable==='function')openTable(table);
  };

  if(typeof assignReservation==='function'&&!window.__fogV44AssignWrapped){
    const originalAssignReservation=assignReservation;
    assignReservation=function(id){
      const r=(db.reservations||[]).find(x=>x&&x.id===id);
      const table=document.getElementById('arriveTable')?.value||'';
      const fallback=r?{clientName:r.clientName||'',category:r.category||'none',isIndustry:r.kind==='industry'}:null;
      const result=originalAssignReservation.apply(this,arguments);
      const s=table&&db.tables?.[table];
      if(fallback&&s&&!fallback.isIndustry){
        const hasValidRegisteredClient=Array.isArray(s.clientIds)&&s.clientIds.some(cid=>{try{return typeof clientById==='function'&&!!clientById(cid)}catch(_){return false}});
        if(!hasValidRegisteredClient){
          s.clientName=fallback.clientName;
          s.clientName2='';
          s.category=fallback.category;
          if(typeof persistLocal==='function')persistLocal();
          if(typeof renderAll==='function')renderAll();
        }
      }
      return result;
    };
    window.__fogV44AssignWrapped=true;
  }

  decorateCashierTables();
})();
