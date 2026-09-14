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

  const targetId=selectEl.classList.contains("editClientDyn")?"editCategory":"gCategory";
  const target=document.getElementById(targetId);
  if(target)target.value=category;
}

document.addEventListener("change",event=>{
  const el=event.target;
  if(el&&el.matches&&el.matches(".gClientDyn,.editClientDyn")){
    applySavedClientCategory(el);
  }
});
