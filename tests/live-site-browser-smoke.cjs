'use strict';
// Checks the actual, public Workers deployment. Reproducible only for this
// runner/network, NOT field Core Web Vitals or expert theological certification.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const base=new URL(process.env.TALAB_SITE_URL||'https://talab-al-haqq.rnafasbek.workers.dev/');
assert.equal(base.protocol,'https:','Live browser test requires HTTPS');
const pages=fs.readdirSync('.').filter(x=>x.endsWith('.html')).sort();
assert(pages.length>=22,'Static curriculum inventory unexpectedly reduced');
const report={url:base.href,checkedAtUtc:new Date().toISOString(),method:'Remote Chromium on GitHub-hosted runner',pages:pages.length,results:[],interactions:[],warnings:[],issues:[]};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage();
   const jsErrors=[];
   page.on('pageerror',e=>jsErrors.push(e.message));
   await page.addInitScript(()=>{
    window.__talabLcp=null;
    try{new PerformanceObserver(list=>{
     for(const e of list.getEntries())window.__talabLcp=Math.round(e.startTime);
    }).observe({type:'largest-contentful-paint',buffered:true})}catch{}
   });
   for(const filename of pages){
    jsErrors.length=0;
    const started=performance.now();
    try{
     const response=await page.goto(new URL(filename,base).href,{waitUntil:'networkidle',timeout:45000});
     assert.equal(response?.status(),200,filename+' HTTP status');
     if(filename==='index.html')await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
     const metrics=await page.evaluate(()=>{
      const nav=performance.getEntriesByType('navigation')[0];
      const source=document.documentElement;
      return {
       title:document.title,headingCount:document.querySelectorAll('h1').length,
       horizontalOverflowPx:Math.max(0,source.scrollWidth-window.innerWidth),
       ttfbMs:Math.round(nav?.responseStart||0),
       dclMs:Math.round(nav?.domContentLoadedEventEnd||0),
       lcpObservedMs:window.__talabLcp
      };
     });
     assert(metrics.title.includes('Талаб аль-Хакк'),filename+': page title missing');
     assert.equal(metrics.headingCount,1,filename+': page heading not ready');
     assert(metrics.horizontalOverflowPx<=2,filename+': horizontal overflow');
     assert.deepEqual(jsErrors,[],filename+': runtime script errors');
     report.results.push({page:filename,viewportWidth:viewport.width,
       timeToNetworkIdleMs:Math.round(performance.now()-started),
       ttfbMs:metrics.ttfbMs,dclMs:metrics.dclMs,lcpObservedMs:metrics.lcpObservedMs});
    }catch(e){
     report.issues.push({page:filename,viewportWidth:viewport.width,error:String(e)});
    }
   }
   await page.goto(base.href,{waitUntil:'networkidle',timeout:45000});
   await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
   try{
    await page.locator('.bottom [data-tab="library"]').click();
    await page.locator('#search').fill('Адам');
    assert.equal(await page.locator('[data-open="lib:prophet_adam"]').count(),1,
      'Live library search should locate Adam');
    report.interactions.push({viewportWidth:viewport.width,feature:'library search',ok:true});
    await page.locator('[data-open="lib:prophet_adam"]').click();
    assert(await page.locator('#modal').isVisible(),'Source detail reader must open');
    await page.keyboard.press('Escape');
    assert(await page.locator('#modal').evaluate(x=>x.classList.contains('hidden')),
      'Escape must close reader');
    report.interactions.push({viewportWidth:viewport.width,feature:'reader open/close',ok:true});
    await page.locator('#themeBtn').click();
    assert(await page.locator('body').evaluate(x=>x.classList.contains('light')),
      'Theme toggle should set light theme in fresh context');
    report.interactions.push({viewportWidth:viewport.width,feature:'theme switching',ok:true});
    await page.locator('#reviewBtn').click();
    assert(await page.locator('#family-review-status').count()===1,
      'Source review status should be available');
    report.interactions.push({viewportWidth:viewport.width,feature:'review transparency',ok:true});
   }catch(e){report.issues.push({page:'interactive home',viewportWidth:viewport.width,error:String(e)})}
   await page.screenshot({path:'live-home-'+viewport.width+'.png',fullPage:true}).catch(()=>{});
   await context.close();
  }
 }finally{await browser.close()}
 fs.writeFileSync('live-browser-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checkedAtUtc:report.checkedAtUtc,url:report.url,
  pageChecks:report.results.length,interactions:report.interactions,
  firstPages:report.results.filter(x=>x.page==='index.html'),issues:report.issues},null,2));
 if(report.issues.length){console.error('FAIL: live browser audit found problems');process.exitCode=1}
 else console.log('PASS: published site browser navigation and rendering in two Chromium viewport sizes');
 console.log('NOT CERTIFIED: real-user Web Vitals, Safari, Firefox, offline readiness, or external sources');
})().catch(e=>{console.error(e);process.exitCode=1});
