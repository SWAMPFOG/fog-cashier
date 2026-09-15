/* FOG CASHIER Ver.47 unified table display */
(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .board-wrap{align-items:flex-start!important}

    /* 卓カードの情報階層を固定：卓番/マーク → キャスト → 顧客/初回情報 → 時間 */
    .hotspot::before{font-size:clamp(8px,.82vw,11px)!important;font-weight:900!important}
    .overlay{overflow:visible!important}
    .names-block{left:3px!important;right:3px!important;top:0!important;height:68%!important;overflow:visible!important}
    .cast-line{top:0!important;text-align:center!important;font-size:clamp(8.5px,1.05vw,12px)!important;font-weight:850!important;line-height:1.05!important;text-overflow:clip!important}
    .client-list-line{left:0!important;right:0!important;top:47%!important;display:flex!important;justify-content:center!important;align-items:center!important;gap:3px!important;overflow:visible!important;white-space:nowrap!important}
    .client-chip{font-size:clamp(7.5px,.92vw,10.5px)!important;font-weight:800!important;line-height:1!important;padding:2px 5px!important;text-overflow:clip!important;overflow:hidden!important}
    .table-meta{left:3px!important;right:3px!important;bottom:0!important;height:25%!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;overflow:visible!important;z-index:8!important}
    .ov-time{flex:0 0 auto!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;font-size:clamp(7.5px,.9vw,10px)!important;font-weight:750!important;line-height:1!important;padding:0 0 1px!important}
    .crown{position:absolute;right:0;bottom:0}

    /* 上げ/下げ/ヘルプなしは卓番号と同じ最上段 */
    .fog-ops-marks{position:absolute;right:2px;top:2px;z-index:15;display:flex;gap:2px;align-items:center;pointer-events:none}
    .fog-ops-mark{min-width:15px;height:15px;padding:0 3px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:clamp(7px,.72vw,10px);line-height:1;font-weight:950;color:#111;background:#fff;border:1px solid #111}
    .fog-ops-mark.up{background:#fff3b0}.fog-ops-mark.down{background:#d9efff}.fog-ops-mark.nohelp{background:#ffd7d7;color:#9c1111;border-color:#9c1111}

    /* 初回は1行に圧縮。省略記号を出さず、スクショで即読める表記に統一 */
    .overlay.fog-new-session .client-list-line{top:45%!important;gap:3px!important}
    .fog-new-guest{display:inline-flex;align-items:center;justify-content:center;background:#ffb37e;color:#111;border-radius:999px;padding:2px 5px;font-size:clamp(7.5px,.92vw,10.5px);font-weight:900;line-height:1;white-space:nowrap}
    .fog-new-plan{display:inline-flex;align-items:center;justify-content:center;min-width:19px;background:#111;color:#fff;border-radius:4px;padding:2px 5px;font-size:clamp(7.5px,.92vw,10.5px);font-weight:950;line-height:1;white-space:nowrap}

    /* 複数顧客は縦2段でフルネーム優先 */
    .overlay.fog-multi-client .names-block{height:70%!important}
    .overlay.fog-multi-client .client-list-line{top:35%!important;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important;gap:2px!important;white-space:normal!important}
    .overlay.fog-multi-client .client-chip{max-width:96%!important;padding:1px 4px!important;font-size:clamp(6.8px,.82vw,9.5px)!important}

    .fog-mark-panel{margin-top:10px;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fafaf8}
    .fog-mark-panel-title{font-size:11px;font-weight:900;color:#666;margin-bottom:7px}
    .fog-mark-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
    .fog-mark-btn{border:1px solid #c9c9c3;background:#fff;border-radius:8px;padding:9px 5px;font-size:12px;font-weight:900}
    .fog-mark-btn.active{background:#111;color:#fff;border-color:#111}
  `;
  document.head.appendChild(style);

  const sessionKind=s=>{
    try{return typeof sessionType==='function'?sessionType(s):(s?.baseType||s?.type||'')}
    catch(_){return s?.baseType||s?.type||''}
  };

  function fitOneLine(el,minPx=6.5){
    if(!el)return;
    el.style.fontSize='';
    let px=parseFloat(getComputedStyle(el).fontSize)||10;
    let guard=0;
    while(el.scrollWidth>el.clientWidth+1&&px>minPx&&guard<20){
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
        ov.classList.remove('fog-new-session','fog-multi-client');
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
      const kind=sessionKind(s);
      if(kind==='new'&&line){
        ov.classList.add('fog-new-session');
        const count=Math.max(1,Number(s.newGuestCount||1));
        const plan=String(s.newPlan||'A').toUpperCase();
        line.innerHTML=`<span class="fog-new-guest">新規${count>1?'×'+count:''}</span><span class="fog-new-plan">${plan}</span>`;
      }else{
        const chips=[...ov.querySelectorAll('.client-chip')];
        if(chips.length>1)ov.classList.add('fog-multi-client');
        chips.forEach(chip=>fitOneLine(chip));
      }

      fitOneLine(ov.querySelector('.cast-line'),7);
    });
  }

  if(typeof renderTables==='function'&&!window.__fogV47TablesWrapped){
    const originalRenderTables=renderTables;
    renderTables=function(){
      const result=originalRenderTables.apply(this,arguments);
      decorateCashierTables();
      return result;
    };
    window.__fogV47TablesWrapped=true;
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
      btn.type='button';
      btn.className='fog-mark-btn'+(info.active?' active':'');
      btn.textContent=info.text;
      btn.onclick=()=>toggleFogOpsMark(table,key);
      actions.appendChild(btn);
    });
    if(firstActions)firstActions.parentNode.insertBefore(panel,firstActions);
    else card.insertBefore(panel,cardActions);
  }

  if(typeof openTable==='function'&&!window.__fogV47OpenTableWrapped){
    const originalOpenTable=openTable;
    openTable=function(table){
      const result=originalOpenTable.apply(this,arguments);
      try{decorateTableModal(table)}catch(e){console.warn('mark modal',e)}
      return result;
    };
    window.__fogV47OpenTableWrapped=true;
  }

  window.toggleFogOpsMark=function(table,key){
    const s=db?.tables?.[table];
    if(!s)return;
    if(typeof snapshot==='function')snapshot('卓表マーク');
    if(key==='up'){
      s.opsUp=!s.opsUp;
      if(s.opsUp)s.opsDown=false;
    }else if(key==='down'){
      s.opsDown=!s.opsDown;
      if(s.opsDown)s.opsUp=false;
    }else if(key==='nohelp'){
      s.opsNoHelp=!s.opsNoHelp;
    }
    if(typeof saveDB==='function')saveDB();
    if(typeof openTable==='function')openTable(table);
  };

  /* 予定表の未登録名・区分は卓表へそのまま保持 */
  if(typeof assignReservation==='function'&&!window.__fogV47AssignWrapped){
    const originalAssignReservation=assignReservation;
    assignReservation=function(id){
      const r=(db.reservations||[]).find(x=>x&&x.id===id);
      const table=document.getElementById('arriveTable')?.value||'';
      const fallback=r?{clientName:r.clientName||'',category:r.category||'none',isIndustry:r.kind==='industry'}:null;
      const result=originalAssignReservation.apply(this,arguments);
      const s=table&&db.tables?.[table];
      if(fallback&&s&&!fallback.isIndustry){
        const hasValidRegisteredClient=Array.isArray(s.clientIds)&&s.clientIds.some(cid=>{
          try{return typeof clientById==='function'&&!!clientById(cid)}catch(_){return false}
        });
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
    window.__fogV47AssignWrapped=true;
  }

  decorateCashierTables();
})();
