/* FOG CASHIER Ver.46 operational enhancements */
(()=>{
  const style=document.createElement('style');
  style.textContent=`
    /* Ver.46: 卓表は上寄せのまま維持 */
    .board-wrap{align-items:flex-start!important}

    /* 卓番号と同じ上段に固定する運用マーク */
    .fog-ops-marks{position:absolute;right:2px;top:1px;z-index:12;display:flex;gap:2px;align-items:center;pointer-events:none}
    .fog-ops-mark{min-width:14px;height:14px;padding:0 2px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:clamp(7px,.68vw,9.5px);line-height:1;font-weight:950;color:#111;background:#fff;border:1px solid #111;box-shadow:0 1px 1px rgba(0,0,0,.08)}
    .fog-ops-mark.up{background:#fff3b0}.fog-ops-mark.down{background:#d9efff}.fog-ops-mark.nohelp{background:#ffd7d7;color:#9c1111;border-color:#9c1111}

    /* Ver.46: 初回プランはクライアント行へ統合。時間の行を絶対に潰さない */
    .client-list-line.fog-new-line{gap:2px;align-items:center;overflow:visible}
    .client-list-line.fog-new-line .client-chip{max-width:calc(100% - 27px)}
    .fog-plan-inline{flex:0 0 auto;min-width:18px;height:16px;padding:0 4px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;background:#111;color:#fff;border:1px solid #111;font-size:clamp(7px,.68vw,9.5px);line-height:1;font-weight:950;white-space:nowrap;pointer-events:none}
    .table-meta{z-index:7}
    .ov-time{overflow:visible;text-overflow:clip;white-space:nowrap;padding-right:0}

    /* 複数クライアントは縦2段。通常卓の時間領域は変更しない */
    .overlay.fog-multi-client .names-block{height:66%}
    .overlay.fog-multi-client .client-list-line{top:33%;flex-direction:column;align-items:flex-start;gap:1px;white-space:normal;overflow:visible}
    .overlay.fog-multi-client .client-chip{max-width:100%;padding:1px 4px;font-size:clamp(6.5px,.72vw,10px);line-height:1}

    .fog-mark-panel{margin-top:10px;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fafaf8}
    .fog-mark-panel-title{font-size:11px;font-weight:900;color:#666;margin-bottom:7px}.fog-mark-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    .fog-mark-btn{border:1px solid #c9c9c3;background:#fff;border-radius:8px;padding:9px 5px;font-size:12px;font-weight:900}.fog-mark-btn.active{background:#111;color:#fff;border-color:#111}
  `;
  document.head.appendChild(style);

  function tableSessionType(s){
    try{return typeof sessionType==='function'?sessionType(s):(s?.baseType||s?.type||'')}
    catch(_){return s?.baseType||s?.type||''}
  }

  function refitClientChip(el,reserved=0){
    if(!el)return;
    el.style.fontSize='';
    const line=el.closest('.client-list-line');
    const limit=Math.max(18,(line?.clientWidth||el.clientWidth)-reserved);
    let px=parseFloat(getComputedStyle(el).fontSize)||10;
    let guard=0;
    while(el.scrollWidth>limit&&px>6&&guard<20){
      px-=0.5;
      el.style.fontSize=px+'px';
      guard++;
    }
  }

  function decorateCashierTables(){
    if(typeof db==='undefined')return;
    document.querySelectorAll('.hotspot').forEach(h=>{
      const table=h.dataset.table;
      const s=db.tables?.[table];
      const ov=document.getElementById('ov-'+table);

      h.querySelector('.fog-ops-marks')?.remove();
      if(ov){
        ov.querySelector('.fog-new-plan')?.remove();
        ov.querySelector('.fog-plan-inline')?.remove();
        ov.querySelector('.client-list-line')?.classList.remove('fog-new-line');
        ov.classList.remove('fog-multi-client');
      }
      if(!ov||!s||s.state==='cleaning')return;

      const marks=[];
      if(s.opsUp)marks.push('<span class="fog-ops-mark up" title="上げ">↑</span>');
      if(s.opsDown)marks.push('<span class="fog-ops-mark down" title="下げ">↓</span>');
      if(s.opsNoHelp)marks.push('<span class="fog-ops-mark nohelp" title="ヘルプなし">H×</span>');
      if(marks.length){
        const wrap=document.createElement('div');
        wrap.className='fog-ops-marks';
        wrap.innerHTML=marks.join('');
        h.appendChild(wrap);
      }

      const line=ov.querySelector('.client-list-line');
      const chips=[...ov.querySelectorAll('.client-chip')];
      const isNew=tableSessionType(s)==='new'&&!!s.newPlan;

      if(chips.length>1&&!isNew)ov.classList.add('fog-multi-client');

      if(isNew&&line){
        line.classList.add('fog-new-line');
        const plan=document.createElement('span');
        plan.className='fog-plan-inline';
        plan.textContent=String(s.newPlan);
        plan.title=String(s.newPlan)+'プラン';
        line.appendChild(plan);
        chips.forEach(chip=>refitClientChip(chip,28));
      }else{
        chips.forEach(chip=>refitClientChip(chip,0));
      }
    });
  }

  if(typeof renderTables==='function'&&!window.__fogV46TablesWrapped){
    const originalRenderTables=renderTables;
    renderTables=function(){const result=originalRenderTables.apply(this,arguments);decorateCashierTables();return result};
    window.__fogV46TablesWrapped=true;
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

  if(typeof openTable==='function'&&!window.__fogV46OpenTableWrapped){
    const originalOpenTable=openTable;
    openTable=function(table){const result=originalOpenTable.apply(this,arguments);try{decorateTableModal(table)}catch(e){console.warn('mark modal',e)}return result};
    window.__fogV46OpenTableWrapped=true;
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

  /* 予定表で未登録の名前・区分を卓表へそのまま保持 */
  if(typeof assignReservation==='function'&&!window.__fogV46AssignWrapped){
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
    window.__fogV46AssignWrapped=true;
  }

  decorateCashierTables();
})();
