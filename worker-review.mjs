// Temporary reviewer-only Worker. No credential is stored in source.
const CLEANUP = `self.addEventListener("install",e=>e.waitUntil(self.skipWaiting()));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  for(const key of await caches.keys()) {
    if(key==="nfs-dua-preview-v1" || key.startsWith("nfs-dua-preview-v1:")) await caches.delete(key);
  }
  await self.clients.claim();
  await self.registration.unregister();
})()));`;
const encoder = new TextEncoder();
async function equal(a,b) {
  const [x,y]=await Promise.all([a,b].map(s=>crypto.subtle.digest("SHA-256",encoder.encode(s))));
  const u=new Uint8Array(x),v=new Uint8Array(y);
  let diff=0;
  for(let i=0;i<u.length;i++) diff|=u[i]^v[i];
  return diff===0;
}
function protectedHeaders(input) {
  const h=new Headers(input);
  h.set("Cache-Control","private, no-store, max-age=0");
  h.set("X-Robots-Tag","noindex, nofollow, noarchive");
  h.set("X-Content-Type-Options","nosniff");
  h.set("Referrer-Policy","no-referrer");
  h.delete("ETag"); h.delete("Last-Modified");
  return h;
}
function reply(request,body,status,extra={}) {
  return new Response(request.method==="HEAD"?null:body,{status,headers:protectedHeaders({"Content-Type":"text/plain; charset=utf-8",...extra})});
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(request.method!=="GET"&&request.method!=="HEAD") return reply(request,"Method not allowed",405,{"Allow":"GET, HEAD"});
    // Only a content-free migration script is public, to help retire old PWA caches.
    if(url.pathname==="/sw.js") return reply(request,CLEANUP,200,{"Content-Type":"application/javascript; charset=utf-8"});
    if(typeof env.REVIEW_PASSWORD!=="string"||env.REVIEW_PASSWORD.length<12) return reply(request,"Private review access is not configured.",503);
    let credentials="";
    const match=/^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(request.headers.get("Authorization")||"");
    if(match&&match[1].length<=4096) {
      try { credentials=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(atob(match[1]),c=>c.charCodeAt(0))); } catch {}
    }
    if(!await equal(credentials,"review:"+env.REVIEW_PASSWORD)) return reply(request,"Закрытая проверка материалов / Private review",401,{"WWW-Authenticate":'Basic realm="Talab al-Haqq review", charset="UTF-8"'});
    const headers=new Headers(request.headers);
    headers.delete("Authorization"); headers.delete("Cookie");
    headers.delete("If-None-Match"); headers.delete("If-Modified-Since");
    const response=await env.ASSETS.fetch(new Request(request,{headers}));
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers:protectedHeaders(response.headers)});
  }
};
