'use strict';
// Independent published-site PWA check. Never changes the live deployment.
// Requires a verifiably prepared service worker on the public origin.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=new URL(process.env.TALAB_SITE_URL||'https://talab-al-haqq.rnafasbek.workers.dev/');
assert.equal(base.protocol,'https:');
const pages=fs.readdirSync('.').filter(p=>p.endsWith('.html')).sort();
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:120000});
  await page.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent==='Доступно офлайн',
    null,{timeout:120000});
  const status=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const ch=new MessageChannel();
   const timeout=setTimeout(()=>reject(Error('Offline status timed out')),12000);
   ch.port1.onmessage=e=>{clearTimeout(timeout);ch.port1.close();resolve(e.data)};
   navigator.serviceWorker.controller.postMessage({type:'NFS_PWA_STATUS'},[ch.port2]);
  }));
  assert.equal(status.state,'ready');
  assert(status.total>=30,'A truncated public offline release would miss static pages');
  await page.locator('.bottom [data-tab="library"]').click();
  await page.locator('#search').fill('Адам');
  await page.locator('[data-open="lib:prophet_adam"]').first().click();
  await page.locator('#detail [data-fav]').click();
  await page.keyboard.press('Escape');
  const favorite=await page.evaluate(()=>localStorage.getItem('nfs_favs'));
  assert(favorite.includes('lib:prophet_adam'));

  await context.setOffline(true);
  for(const file of pages){
   const response=await page.goto(new URL(file,base).href,{waitUntil:'domcontentloaded',timeout:18000});
   assert.equal(response?.status(),200,'Unavailable offline curriculum: '+file);
   assert((await page.title()).includes('Талаб аль-Хакк'),'Wrong cached page: '+file);
  }
  await page.goto(base.href,{waitUntil:'domcontentloaded'});
  await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:25000});
  await page.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent==='Доступно офлайн');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nfs_favs')),favorite,
   'Offline reinstall/navigation must preserve user favorites');
  const answer=await page.evaluate(async()=>{
   const resp=await fetch('./data/content.json');
   const data=await resp.json();
   return {status:resp.status,records:data.catalog?.entries?.length||0};
  });
  assert.equal(answer.status,200,'Offline primary catalog must be readable');
  assert(answer.records>0,'Primary catalogue empty');
  assert.deepEqual(errors,[],'Uncaught script errors during offline navigation');
  console.log(JSON.stringify({
   publicUrl:base.href,offlineReady:true,version:status.version,
   cachedResources:status.total,offlineHtmlPages:pages.length,
   offlineCatalogRecords:answer.records,favoritePreserved:true,
   browser:'Chromium',viewport:390
  },null,2));
  console.log('PASS: verified public PWA install and offline reading');
  console.log('NOT CERTIFIED: iOS Safari, all device quotas, external source sites, religious expert review');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
