function clientRegisteredCategory(client){
  if(!client)return "none";
  if(client.category&&typeof CATEGORY_DEFS!=="undefined"&&CATEGORY_DEFS[client.category])return client.category;
  if(client.black)return "gray";
  if(client.gold)return "red";
  if(client.glow)return "yellow";
  return "none";
}

function applySavedClientCategory(selectEl){
  if(!selectEl||!selectEl.value)return;
  const client=clientById(selectEl.value);
  const category=clientRegisteredCategory(client);
  if(category==="none")return;

  let targetId="gCategory";
  if(selectEl.classList.contains("editClientDyn"))targetId="editCategory";
  if(selectEl.id==="rClient")targetId="rCategory";

  const target=document.getElementById(targetId);
  if(target)target.value=category;
}

function reservationDisplayCategory(r){
  if(!r)return "none";
  const client=r.clientId?clientById(r.clientId):null;
  const saved=clientRegisteredCategory(client);
  if(saved!=="none")return saved;
  if(r.category&&typeof CATEGORY_DEFS!=="undefined"&&CATEGORY_DEFS[r.category])return r.category;
  return "none";
}

function findReservationForScheduleCard(card,usedIds){
  const main=card.querySelector(".reserve-main");
  if(!main)return null;
  const mainText=main.textContent.trim();
  const timeText=card.querySelector(".reserve-top span")?.textContent.trim()||"";

  const candidates=(db.reservations||[]).filter(r=>{
    if(!r)return false;
    const expected=((r.castName||"")+" / "+(r.clientName||"")).trim();
    if(expected!==mainText)return false;
    const expectedTime=r.kind==="companion"?"同伴":String(r.time||"");
    return !timeText||expectedTime===timeText;
  });

  return candidates.find(r=>!usedIds.has(r.id))||candidates[0]||null;
}

function decorateScheduleClientColors(){
  if(typeof db==="undefined"||typeof CATEGORY_DEFS==="undefined")return;
  const usedIds=new Set();

  document.querySelectorAll(".schedule-screen .reserve").forEach(card=>{
    const main=card.querySelector(".reserve-main");
    if(!main)return;

    const r=findReservationForScheduleCard(card,usedIds);
    if(!r)return;
    if(r.id)usedIds.add(r.id);

    const category=reservationDisplayCategory(r);
    const def=CATEGORY_DEFS[category]||CATEGORY_DEFS.none;

    main.textContent="";
    const castSpan=document.createElement("span");
    castSpan.textContent=r.castName||"";
    main.appendChild(castSpan);
    main.appendChild(document.createTextNode(" / "));

    const clientSpan=document.createElement("span");
    clientSpan.textContent=r.clientName||"";
    clientSpan.className="client-chip"+(def.cls?" "+def.cls:"");
    clientSpan.style.fontWeight="900";
    main.appendChild(clientSpan);
  });
}

document.addEventListener("change",event=>{
  const el=event.target;
  if(!el||!el.matches)return;
  if(el.matches(".gClientDyn,.editClientDyn,#rClient")){
    applySavedClientCategory(el);
  }
});

if(typeof renderSchedule==="function"&&!window.__fogScheduleColorWrapped){
  const originalRenderSchedule=renderSchedule;
  renderSchedule=function(){
    const result=originalRenderSchedule.apply(this,arguments);
    decorateScheduleClientColors();
    return result;
  };
  window.__fogScheduleColorWrapped=true;
}

decorateScheduleClientColors();

if(!window.__fogV47EnhancementLoader){
  const enhancementScript=document.createElement("script");
  enhancementScript.src="./cashier-enhancements-v47.js";
  enhancementScript.defer=false;
  document.body.appendChild(enhancementScript);
  window.__fogV47EnhancementLoader=true;
}

const fogVersionBadge=document.querySelector(".app-ver");
if(fogVersionBadge)fogVersionBadge.textContent="Ver.47";
document.title="SWAMP FOG CASHIER v47 OFFLINE";
