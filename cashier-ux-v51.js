/* FOG CASHIER Ver.51 fast-operation UX */
(()=>{
  if(window.__fogUxV51Loaded)return;
  window.__fogUxV51Loaded=true;

  const style=document.createElement('style');
  style.textContent=`
    .fog-fast-section{margin-top:12px}
    .fog-fast-label{font-size:11px;font-weight:900;color:#666;margin:0 0 7px}
    .fog-fast-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .fog-fast-grid .action{min-height:52px;padding:12px 8px;font-size:14px;font-weight:950;border-radius:11px}
    .fog-fast-grid .fog-field-action{background:#111;color:#fff;border-color:#111}
    .fog-fast-grid .fog-exit-action{background:#fff3f3;color:#a01818;border-color:#d9aaaa}
    .fog-more-toggle{width:100%;margin-top:10px;border:1px solid #c9c9c3;background:#f8f8f5;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:900;color:#555}
    .fog-more-actions{display:none!important;margin-top:8px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}
    .fog-more-actions.open{display:grid!important}
    .fog-guide-kind{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 14px}
    .fog-guide-kind button{min-height:52px;border:1px solid #c5c5bf;background:#fff;border-radius:11px;font-size:14px;font-weight:950}
    .fog-guide-kind button.active{background:#111;color:#fff;border-color:#111}
    .fog-guide-caption{font-size:11px;color:#666;font-weight:900;margin:0 0 7px}
    @media (max-width:700px){
      .fog-fast-grid .action{min-height:48px;font-size:13px}
      .fog-guide-kind button{min-height:48px;font-size:13px}
    }
  `;
  document.head.appendChild(style);

  function getOnclick(btn){return btn?.getAttribute('onclick')||''}

  function decorateOccupiedTable(table){
    const card=document.getElementById('modalCard');
    const s=window.db?.tables?.[table];
    if(!card||!s||s.state==='cleaning')return;
    if(card.querySelector('.fog-fast-section'))return;

    const actions=[...card.querySelectorAll('.actions')].find(el=>
      [...el.children].some(ch=>ch.tagName==='BUTTON'&&ch.classList.contains('action'))
    );
    if(!actions)return;

    const buttons=[...actions.children].filter(el=>el.tagName==='BUTTON'&&el.classList.contains('action'));
    if(!buttons.length)return;

    const fast=[];
    const other=[];
    buttons.forEach(btn=>{
      const oc=getOnclick(btn);
      if(oc.includes('openFieldConvert(')||oc.includes('toggleCheck(')||oc.includes('askStartTableMove(')||oc.includes('checkout(')) fast.push(btn);
      else other.push(btn);
    });
    if(!fast.length)return;

    const section=document.createElement('div');
    section.className='fog-fast-section';
    const label=document.createElement('div');
    label.className='fog-fast-label';
    label.textContent='すぐ使う';
    const grid=document.createElement('div');
    grid.className='fog-fast-grid';
    section.append(label,grid);

    fast.forEach(btn=>{
      btn.classList.remove('primary');
      const oc=getOnclick(btn);
      if(oc.includes('openFieldConvert('))btn.classList.add('fog-field-action');
      if(oc.includes('checkout('))btn.classList.add('fog-exit-action');
      grid.appendChild(btn);
    });

    actions.parentNode.insertBefore(section,actions);

    if(other.length){
      actions.classList.add('fog-more-actions');
      const toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='fog-more-toggle';
      toggle.textContent='その他の操作 ▾';
      toggle.onclick=()=>{
        const open=actions.classList.toggle('open');
        toggle.textContent=open?'その他の操作 ▴':'その他の操作 ▾';
      };
      actions.parentNode.insertBefore(toggle,actions);
    }else{
      actions.style.display='none';
    }
  }

  function decorateGuide(){
    const card=document.getElementById('modalCard');
    const type=document.getElementById('gType');
    if(!card||!type||card.querySelector('.fog-guide-kind'))return;

    const field=type.closest('.field');
    if(field)field.style.display='none';
    const grid=type.closest('.grid');
    if(!grid)return;

    const caption=document.createElement('div');
    caption.className='fog-guide-caption';
    caption.textContent='案内する種類';

    const chooser=document.createElement('div');
    chooser.className='fog-guide-kind';
    const defs=[['existing','既存'],['new','新規'],['industry','同業']];
    defs.forEach(([value,label])=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.dataset.kind=value;
      btn.textContent=label;
      btn.onclick=()=>{
        type.value=value;
        if(typeof guideTypeChanged==='function')guideTypeChanged();
        [...chooser.children].forEach(b=>b.classList.toggle('active',b.dataset.kind===value));
      };
      chooser.appendChild(btn);
    });

    grid.parentNode.insertBefore(caption,grid);
    grid.parentNode.insertBefore(chooser,grid);
    [...chooser.children].forEach(b=>b.classList.toggle('active',b.dataset.kind===type.value));
  }

  if(typeof openTable==='function'&&!window.__fogUxV51OpenTableWrapped){
    const originalOpenTable=openTable;
    openTable=function(table){
      const result=originalOpenTable.apply(this,arguments);
      decorateOccupiedTable(table);
      return result;
    };
    window.__fogUxV51OpenTableWrapped=true;
  }

  if(typeof openGuide==='function'&&!window.__fogUxV51OpenGuideWrapped){
    const originalOpenGuide=openGuide;
    openGuide=function(){
      const result=originalOpenGuide.apply(this,arguments);
      decorateGuide();
      return result;
    };
    window.__fogUxV51OpenGuideWrapped=true;
  }

  const badge=document.querySelector('.app-ver');
  if(badge)badge.textContent='Ver.51';
  document.title='SWAMP FOG CASHIER v51 OFFLINE';
})();
