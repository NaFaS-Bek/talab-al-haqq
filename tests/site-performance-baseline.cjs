'use strict';
// Local reproducible baseline, not a live Cloudflare/RUM or Lighthouse score.
// Run after starting python3 -m http.server 8765 --bind 127.0.0.1
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');

const bytes={
  content:fs.statSync('data/content.json').size,
  caliphs:fs.statSync('data/caliph_history.json').size,
  app:fs.statSync('app.js').size,
  css:fs.statSync('style.css').size,
  mainFont:fs.statSync('fonts/NotoSans-Regular.ttf').size,
  arabicFont:fs.statSync('fonts/Amiri-Regular.ttf').size
};
const bytesKiB=v=>Math.round(v/1024);
const css=fs.readFileSync('style.css','utf8');
assert(/@font-face\{font-family:Noto;[^}]*font-display:swap\}/.test(css),
 'Main font must not block readable fallback text');
assert(/@font-face\{font-family:Amiri;[^}]*font-display:swap\}/.test(css),
 'Arabic font must not block readable fallback text');
assert(bytes.content<4*1024*1024,'Content payload increased past the 4MiB source budget');

(async()=>{
 const browser=await chromium.launch({headless:true});
 const runs=[];
 try{
  for(const vp of [{width:390,height:844},{width:1280,height:900}]){
   const context=await browser.newContext({viewport:vp,serviceWorkers:'block'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>errors.push('Request failed: '+r.url()+' '+r.failure()?.errorText));
   await page.addInitScript(()=>{
    window.__lcpTime=null;
    try{
     new PerformanceObserver(list=>{
      for(const e of list.getEntries())window.__lcpTime=e.startTime;
     }).observe({type:'largest-contentful-paint',buffered:true});
    }catch{}
   });
   const started=performance.now();
   const response=await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   assert.equal(response?.status(),200,'Homepage must return HTTP 200');
   await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
   const headingVisibleMs=Math.round(performance.now()-started);
   const metrics=await page.evaluate(()=>{
    const n=performance.getEntriesByType('navigation')[0];
    const top=performance.getEntriesByType('resource')
     .filter(e=>/\/(data\/content\.json|data\/caliph_history\.json|app\.js|style\.css|fonts\/.*\.ttf)$/.test(new URL(e.name).pathname))
     .map(e=>({
      asset:new URL(e.name).pathname.replace(/^\//,''),
      durationMs:Math.round(e.duration),
      transferBytes:e.transferSize,
      encodedBytes:e.encodedBodySize,
      decodedBytes:e.decodedBodySize
     }));
    return {
     documentTtfbMs:Math.round(n?.responseStart||0),
     domContentLoadedMs:Math.round(n?.domContentLoadedEventEnd||0),
     lcpObservedMs:window.__lcpTime===null?null:Math.round(window.__lcpTime),
     resources:top
    };
   });
   assert.deepEqual(errors,[],'No page errors or failed requests while measuring');
   runs.push({viewportWidth:vp.width,headingVisibleMs,...metrics});
   await context.close();
  }
 }finally{await browser.close()}
 const report={
  scope:'local Python HTTP server in GitHub Actions; no claim about live production',
  sourcePayloadKiB:Object.fromEntries(Object.entries(bytes).map(([k,v])=>[k,bytesKiB(v)])),
  warnings:[
   ...(bytes.content>2*1024*1024?['Main content.json exceeds 2MiB; initial render depends on downloading and parsing it']:[]),
   ...(bytes.mainFont>1024*1024?['Main regular font exceeds 1MiB; font-display swap avoids invisible text but not bandwidth cost']:[])
  ],
  runs
 };
 fs.writeFileSync('performance-local-baseline.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 console.log('PASS local performance measurement; timings are environment-dependent and are not production Core Web Vitals');
})().catch(e=>{console.error(e);process.exit(1)});
