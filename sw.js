const CACHE_NAME="fog-cashier-v46-core-1";
const SOURCE_URL="https://raw.githubusercontent.com/SWAMPFOG/fog-cashier/2e75a08f27775fa5d3c5e1b2b574928509dc09dc/index.html";
const PART_URLS=[1,2,3,4,5,6,7].map(n=>`https://raw.githubusercontent.com/SWAMPFOG/fog-cashier/main/v40/floor${n}.txt`);
const SUPABASE_JS="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const CORE=["./","./index.html","./client-color.js","./cashier-enhancements.js",SOURCE_URL,...PART_URLS,SUPABASE_JS];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(CORE.map(async url=>{
      const res=await fetch(url,{cache:"reload"});
      if(!(res.ok||res.type==="opaque"))throw new Error(`cache failed: ${url}`);
      await cache.put(url,res.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith("fog-cashier-")&&k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function staticKey(url){
  const u=new URL(url);
  u.search="";
  return u.href;
}

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;

  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(CACHE_NAME);
        cache.put("./index.html",fresh.clone()).catch(()=>{});
        return fresh;
      }catch(_){
        return (await caches.match("./index.html"))||(await caches.match("./"));
      }
    })());
    return;
  }

  const key=staticKey(req.url);
  const isCore=CORE.some(url=>staticKey(new URL(url,self.location.href).href)===key);
  if(!isCore)return;

  event.respondWith((async()=>{
    const cached=await caches.match(key);
    if(cached)return cached;
    const fresh=await fetch(req);
    if(fresh.ok||fresh.type==="opaque"){
      const cache=await caches.open(CACHE_NAME);
      cache.put(key,fresh.clone()).catch(()=>{});
    }
    return fresh;
  })());
});
