/* FOG CASHIER Ver.50 schedule entry + client registration + cast ordering */
(()=>{
  if(window.__fogScheduleV50Loaded)return;
  window.__fogScheduleV50Loaded=true;

  const style=document.createElement('style');
  style.textContent=`
    .schedule-title.fog-schedule-title{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .fog-schedule-add{border:1px solid #111;background:#111;color:#fff;border-radius:7px;padding:5px 9px;font-size:11px;font-weight:900;white-space:nowrap}
    .fog-master-actions{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .fog-cast-sort-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #ecece8}
    .fog-cast-sort-row:last-child{border-bottom:0}
    .fog-cast-sort-name{font-weight:900;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .fog-cast-sort-actions{display:flex;gap:6px}
    .fog-cast-sort-btn{width:38px;height:34px;border:1px solid #c8c8c2;background:#fff;border-radius:8px;font-weight:950}
    .fog-cast-sort-btn:disabled{opacity:.28}
  `;
  document.head.appendChild(style);

  const normName=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();

  if(typeof reservationTimeOptions==='function'&&!window.__fogV50TimeOptionsWrapped){
    const originalReservationTimeOptions=reservationTimeOptions;
    reservationTimeOptions=function(selected='20:00'){
      let html=originalReservationTimeOptions(selected);
      html=html.replace('>未定（旧設定）<','>未定<');
      if(!html.includes('value="未定"')){
        html=`<option value="未定" ${selected==='未定'?'selected':''}>未定</option>`+html;
      }
      return html;
    };
    window.__fogV50TimeOptionsWrapped=true;
  }

  function sameNameClient(castId,name,excludeId=''){
    const key=normName(name);
    if(!castId||!key)return null;
    return (db?.clients||[]).find(c=>c&&c.castId===castId&&c.id!==excludeId&&normName(c.name)===key)||null;
  }

  function ensureUndecidedTimeOption(){
    const select=document.getElementById('rTime');
    if(!select)return;
    if(![...select.options].some(o=>o.value==='未定')){
      const option=document.createElement('option');
      option.value='未定';
      option.textContent='未定';
      select.insertBefore(option,select.firstChild);
    }
  }

  const originalOpenReservation=typeof openReservation==='function'?openReservation:null;
  window.fogOpenReservationKind=function(kind){
    if(!originalOpenReservation)return;
    if(!Array.isArray(db?.casts)||db.casts.length===0){
      if(typeof openCastAdd==='function')openCastAdd();
      return;
    }
    originalOpenReservation();
    const kindEl=document.getElementById('rKind');
    if(!kindEl)return;
    kindEl.value=kind;
    if(typeof reservationKindChanged==='function')reservationKindChanged();
    const kindField=kindEl.closest('.field');
    if(kindField)kindField.style.display='none';
    const h3=document.querySelector('#modalCard h3');
    if(h3)h3.textContent=kind==='companion'?'同伴追加':kind==='industry'?'同業追加':'予定追加';
    if(kind==='plan')ensureUndecidedTimeOption();
  };

  function decorateScheduleEntryPoints(){
    const head=document.querySelector('.schedule-head');
    if(head){
      [...head.querySelectorAll('button')].forEach(btn=>{
        if((btn.textContent||'').includes('予定登録'))btn.remove();
      });
    }

    const configs=[
      ['planList','plan','＋予定追加'],
      ['companionList','companion','＋同伴追加'],
      ['industryList','industry','＋同業追加']
    ];
    configs.forEach(([listId,kind,label])=>{
      const list=document.getElementById(listId);
      const col=list?.closest('.schedule-col');
      const title=col?.querySelector('.schedule-title');
      if(!title)return;
      title.classList.add('fog-schedule-title');
      if(title.querySelector(`[data-fog-kind="${kind}"]`))return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='fog-schedule-add';
      btn.dataset.fogKind=kind;
      btn.textContent=label;
      btn.onclick=()=>window.fogOpenReservationKind(kind);
      title.appendChild(btn);
    });
  }

  if(typeof renderSchedule==='function'&&!window.__fogV50RenderScheduleWrapped){
    const previousRenderSchedule=renderSchedule;
    renderSchedule=function(){
      const result=previousRenderSchedule.apply(this,arguments);
      decorateScheduleEntryPoints();
      return result;
    };
    window.__fogV50RenderScheduleWrapped=true;
  }

  if(typeof saveReservation==='function'&&!window.__fogV50SaveReservationWrapped){
    const originalSaveReservation=saveReservation;
    saveReservation=function(id){
      const kind=document.getElementById('rKind')?.value||'plan';
      const castId=document.getElementById('rCast')?.value||'';
      const clientId=document.getElementById('rClient')?.value||'';
      const typed=document.getElementById('rName')?.value.trim()||'';

      if(kind!=='industry'&&castId&&!clientId&&typed){
        const duplicate=sameNameClient(castId,typed);
        if(duplicate){
          const same=window.confirm(`「${typed}」はこのキャストのクライアント一覧に登録済みです。\n同一人物ですか？`);
          if(!same){
            if(typeof toast==='function')toast('別人の場合は、違う名前に変更して登録してください');
            return;
          }
          const select=document.getElementById('rClient');
          if(select){
            if(![...select.options].some(o=>o.value===duplicate.id)){
              const option=document.createElement('option');
              option.value=duplicate.id;
              option.textContent=duplicate.name;
              select.appendChild(option);
            }
            select.value=duplicate.id;
            if(typeof applySavedClientCategory==='function')applySavedClientCategory(select);
          }
          return originalSaveReservation.apply(this,arguments);
        }

        const beforeIds=new Set((db.reservations||[]).map(r=>r?.id).filter(Boolean));
        const result=originalSaveReservation.apply(this,arguments);
        let saved=null;
        if(id){
          saved=(db.reservations||[]).find(r=>r&&r.id===id)||null;
        }else{
          saved=[...(db.reservations||[])].reverse().find(r=>r&&r.id&&!beforeIds.has(r.id))||null;
        }
        if(saved&&saved.castId===castId&&normName(saved.clientName)===normName(typed)&&!saved.clientId){
          const category=saved.category||'none';
          const newClient={
            id:typeof uid==='function'?uid('client'):`client_${Date.now()}`,
            castId,
            name:typed,
            category,
            glow:category==='yellow',
            gold:category==='red',
            black:category==='gray'
          };
          if(!Array.isArray(db.clients))db.clients=[];
          db.clients.push(newClient);
          saved.clientId=newClient.id;
          saved.clientName=newClient.name;
          if(typeof saveDB==='function')saveDB();
          else if(typeof persistLocal==='function')persistLocal();
          if(typeof toast==='function')toast('予定登録＋クライアント一覧へ追加しました');
        }
        return result;
      }

      return originalSaveReservation.apply(this,arguments);
    };
    window.__fogV50SaveReservationWrapped=true;
  }

  if(typeof saveClient==='function'&&!window.__fogV50SaveClientWrapped){
    const originalSaveClient=saveClient;
    saveClient=function(castId){
      const name=document.getElementById('clientName')?.value.trim()||'';
      if(name){
        const duplicate=sameNameClient(castId,name);
        if(duplicate){
          const same=window.confirm(`「${name}」はこのキャストのクライアント一覧に登録済みです。\n同一人物ですか？`);
          if(same){
            if(typeof openCastClients==='function')openCastClients(castId);
            if(typeof toast==='function')toast('同一人物はすでに登録されています');
          }else if(typeof toast==='function'){
            toast('別人の場合は、違う名前に変更して登録してください');
          }
          return;
        }
      }
      return originalSaveClient.apply(this,arguments);
    };
    window.__fogV50SaveClientWrapped=true;
  }

  function decorateMasterSortButton(){
    const card=document.getElementById('modalCard');
    if(!card)return;
    const title=card.querySelector('h3');
    if(!title||!(title.textContent||'').includes('キャスト / クライアント'))return;
    const actions=card.querySelector('.actions');
    if(!actions)return;
    actions.classList.add('fog-master-actions');
    if(actions.querySelector('#fogCastSortOpen'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='fogCastSortOpen';
    btn.className='action';
    btn.textContent='キャスト並び替え';
    btn.onclick=()=>window.fogOpenCastSort();
    actions.appendChild(btn);
  }

  if(typeof openMaster==='function'&&!window.__fogV50OpenMasterWrapped){
    const originalOpenMaster=openMaster;
    openMaster=function(){
      const result=originalOpenMaster.apply(this,arguments);
      decorateMasterSortButton();
      setTimeout(decorateMasterSortButton,0);
      return result;
    };
    window.__fogV50OpenMasterWrapped=true;
  }

  const modalCard=document.getElementById('modalCard');
  if(modalCard&&typeof MutationObserver!=='undefined'){
    const observer=new MutationObserver(()=>decorateMasterSortButton());
    observer.observe(modalCard,{childList:true,subtree:true});
  }

  window.fogMoveCast=function(index,delta){
    if(!Array.isArray(db?.casts))return;
    const next=index+delta;
    if(index<0||index>=db.casts.length||next<0||next>=db.casts.length)return;
    if(typeof snapshot==='function')snapshot('キャスト並び替え');
    const [item]=db.casts.splice(index,1);
    db.casts.splice(next,0,item);
    if(typeof saveDB==='function')saveDB();
    else if(typeof persistLocal==='function')persistLocal();
    window.fogOpenCastSort();
  };

  window.fogOpenCastSort=function(){
    if(typeof modal!=='function')return;
    const casts=Array.isArray(db?.casts)?db.casts:[];
    const rows=casts.length?casts.map((c,i)=>`
      <div class="fog-cast-sort-row">
        <div class="fog-cast-sort-name">${typeof esc==='function'?esc(c.name||''):String(c.name||'')}</div>
        <div class="fog-cast-sort-actions">
          <button class="fog-cast-sort-btn" type="button" onclick="fogMoveCast(${i},-1)" ${i===0?'disabled':''}>↑</button>
          <button class="fog-cast-sort-btn" type="button" onclick="fogMoveCast(${i},1)" ${i===casts.length-1?'disabled':''}>↓</button>
        </div>
      </div>`).join(''):'<div class="empty">キャストが登録されていません</div>';
    modal(`<h3>キャスト並び替え</h3>
      <div style="font-size:11px;color:#666;margin:-4px 0 10px">↑ ↓ で表示順を変更できます</div>
      <div>${rows}</div>
      <div class="card-actions"><button class="btn primary" type="button" onclick="openMaster()">完了</button></div>`);
  };

  decorateScheduleEntryPoints();
  decorateMasterSortButton();
})();
