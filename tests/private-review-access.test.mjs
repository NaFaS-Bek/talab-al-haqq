import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import fs from "node:fs";
import worker from "../worker-review.mjs";
if(!globalThis.crypto) globalThis.crypto=webcrypto;
const password="test-only-fake-password";
let calls=0;
const env={REVIEW_PASSWORD:password,ASSETS:{fetch:async req=>{
  calls++; assert.equal(req.headers.get("Authorization"),null);
  return new Response("protected fixture",{headers:{"Cache-Control":"public, max-age=3600","ETag":"test"}});
}}};
const request=(path,auth,method="GET")=>new Request("https://example.test"+path,{method,headers:auth?{Authorization:auth}:{}});
const valid="Basic "+btoa("review:"+password);
test("all assets reject anonymous and incorrect credentials",async()=>{
 for(const path of ["/","/index.html","/stories.html","/stories-tg","/data/content.json","/app.js","/audio/stories/yusuf.mp3","/fonts/font.ttf","/missing","/stories.html?cache=1","/sw.js/"]){
   for(const auth of [undefined,"Basic !!!","Basic "+btoa("review:wrong")]){
     const response=await worker.fetch(request(path,auth),env);
     assert.equal(response.status,401,path);
     assert.match(response.headers.get("Cache-Control"),/no-store/);
   }
 }
 assert.equal(calls,0);
});
test("missing or weak secret fails closed",async()=>{
 for(const secret of [undefined,"","short"]){
   assert.equal((await worker.fetch(request("/",valid),{...env,REVIEW_PASSWORD:secret})).status,503);
 }
});
test("authorized assets are not cacheable; credentials not forwarded",async()=>{
 const response=await worker.fetch(request("/stories.html",valid),env);
 assert.equal(response.status,200); assert.equal(await response.text(),"protected fixture");
 assert.match(response.headers.get("Cache-Control"),/no-store/);
 assert.equal(response.headers.get("ETag"),null);
});
test("public service worker contains only cache cleanup",async()=>{
 const response=await worker.fetch(request("/sw.js"),env);
 assert.equal(response.status,200); const body=await response.text();
 assert.match(body,/registration.unregister/); assert.match(body,/caches.delete/);
 assert.doesNotMatch(body,/protected fixture|REVIEW_PASSWORD/);
});
test("HEAD guarded, unsupported methods rejected, config routes every asset through Worker",async()=>{
 assert.equal((await worker.fetch(request("/",undefined,"HEAD"),env)).status,401);
 assert.equal((await worker.fetch(request("/",valid,"POST"),env)).status,405);
 const c=JSON.parse(fs.readFileSync(new URL("../wrangler.review.jsonc",import.meta.url),"utf8"));
 assert.equal(c.assets.run_worker_first,true);assert.equal(c.preview_urls,false);
});
