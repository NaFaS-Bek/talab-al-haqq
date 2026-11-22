'use strict';
/*
 * Real Playwright service-worker tests against a complete locally built PWA.
 * HTTP servers on :8766 (valid) and :8767 (one intentionally tampered file)
 * must already be running. No network service or external religious data needed.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8766/';
const broken='http://127.0.0.1:8767/';
const dir=path.resolve('build/website');
const files=fs.readdirSync(dir).filter(p=>p.endsWith('.html')).sort();
assert(files.length>=22,'Offline package must include every curriculum page');

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex')}
function releaseOf(code){
  const match=code.match(/^const RELEASE = (\{[^\r\n]+\});\r?$/m);
  assert(match,'Generated service worker missing embedded release');
  return JSON.parse(match[1]);
}
function makeUpdate(){
  const swPath=path.join(dir,'sw.js');
  const indexPath=path.join(dir,'index.html');
  const old=fs.readFileSync(swPath,'utf8');
  const release=releaseOf(old);
  const marker='<!-- test-only second offline release; not copied into project sources -->';
  fs.appendFileSync(indexPath,'\n'+marker+'\n');
  release.resources['index.html']=sha256(fs.readFileSync(indexPath));
  // Source manifest paths are sorted; JSON serialization preserves insertion order.
  // Preserve the Python manifest's canonical lexicographic key order.
  release.version=sha256(JSON.stringify(release.resources));
  const next=old.replace(/^const RELEASE = \{[^\r\n]+\};\r?$/m,
    'const RELEASE = '+JSON.stringify(release)+';');
  assert.notEqual(next,old,'SW update should change source');
  fs.writeFileSync(swPath,next);
  return {version:release.version,marker};
}
function stored(page,key){return page.evaluate(k=>localStorage.getItem(k),key)}
async function workerStatus(page){
  return page.evaluate(()=>new Promise((resolve,reject)=>{
    const worker=navigator.serviceWorker.controller;
    if(!worker){reject(Error('Service worker does not control this page'));return}
    const channel=new MessageChannel();
    const abort=setTimeout(()=>reject(Error('Worker status timed out')),12000);
    channel.port1.onmessage=e=>{clearTimeout(abort);channel.port1.close();resolve(e.data)};
    worker.postMessage({type:'NFS_PWA_STATUS'},[channel.port2]);
  }));
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844}});
  const page=await context.newPage();
  const jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:120000});
  await page.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent==='Доступно офлайн',
    null,{timeout:120000});
  const initial=await workerStatus(page);
  assert.equal(initial.state,'ready','All cached assets must be verified before offline ready');
  assert(initial.total>=30,'Incomplete offline resource inventory');
  assert(/^[0-9a-f]{64}$/.test(initial.version),'Missing content version hash');

  // Real UI interactions before disconnecting: theme, favorite, counter, reading.
  await page.locator('.bottom [data-tab="library"]').click();
  await page.locator('#search').fill('Адам');
  await page.locator('[data-open="lib:prophet_adam"]').first().click();
  await page.locator('#detail [data-fav]').click();
  await page.keyboard.press('Escape');
  await page.locator('#themeBtn').click();
  await page.locator('.bottom [data-tab="dua"]').click();
  await page.locator('[data-dua-group="morning"]').click();
  const firstDua=page.locator('[data-open^="dua:"]').first();
  const countKey=await firstDua.getAttribute('data-open');
  await firstDua.click();
  assert(await page.locator('#detail [data-count="plus"]').count()>0,
    'A real dhikr should have a count control');
  await page.locator('#detail [data-count="plus"]').click();
  await page.keyboard.press('Escape');
  const baseline={
    favs:await stored(page,'nfs_favs'),
    counts:await stored(page,'nfs_counts'),
    theme:await stored(page,'nfs_theme'),
    reading:await stored(page,'nfs_reading')
  };
  assert(baseline.favs?.includes('lib:prophet_adam'),'Favorite must be saved');
  assert(baseline.counts?.includes(countKey.split(':')[1]),'Dhikr count must be saved');
  assert(baseline.reading?.includes('last'),'Reading progress must be saved');

  await context.setOffline(true);
  for(const name of files){
    const response=await page.goto(new URL(name,base).href,{waitUntil:'domcontentloaded',timeout:15000});
    assert.equal(response?.status(),200,'Cached offline navigation failed: '+name);
    assert((await page.title()).includes('Талаб аль-Хакк'),'Offline page has wrong title: '+name);
  }
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:18000});
  await page.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent==='Доступно офлайн');
  assert.deepEqual(await workerStatus(page),{state:'ready',version:initial.version,
    activeVersion:initial.activeVersion,total:initial.total},'Offline ready should remain verified');
  for(const [name,key] of Object.entries({
    favs:'nfs_favs',counts:'nfs_counts',theme:'nfs_theme',reading:'nfs_reading'
  }))assert.equal(await stored(page,key),baseline[name],
    'Offline navigation must not erase '+key);
  const offlineJson=await page.evaluate(async()=>{
    const r=await fetch('./data/content.json');
    return {status:r.status,json:await r.json()};
  });
  assert.equal(offlineJson.status,200,'Main catalog must be available offline');
  assert(offlineJson.json.catalog?.entries,'Downloaded Quran/dua catalog is incomplete');

  // Update from release v1 to v2 after reconnecting, without clearing local data.
  const {version:v2,marker}=makeUpdate();
  assert.notEqual(v2,initial.version,'Update needs a new content-addressed version');
  // The page stays open: reconnecting must discover the new release
  // by the 'online' listener installed during its last offline load.
  await context.setOffline(false);
  await page.waitForFunction(()=>Boolean(document.querySelector('#updateBanner')&&!document.querySelector('#updateBanner').hidden),
    null,{timeout:120000});
  // Wait for the controllerchange-triggered reload to settle. Polling the
  // controller before its navigation finishes can briefly see the old client.
  const upgradeNavigation=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('#reloadUpdate').click();
  await upgradeNavigation;
  await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(async expected=>{
    if(!navigator.serviceWorker.controller)return false;
    const response=await new Promise(resolve=>{
      const ch=new MessageChannel();
      ch.port1.onmessage=e=>{ch.port1.close();resolve(e.data)};
      navigator.serviceWorker.controller.postMessage({type:'NFS_PWA_STATUS'},[ch.port2]);
    });
    return response.state==='ready'&&response.activeVersion===expected;
  },v2,{timeout:120000});
  await page.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent==='Доступно офлайн',
    null,{timeout:30000});
  const upgraded=await workerStatus(page);
  assert.equal(upgraded.activeVersion,v2,'New worker must be active after accepting update');
  for(const [name,key] of Object.entries({
    favs:'nfs_favs',counts:'nfs_counts',theme:'nfs_theme',reading:'nfs_reading'
  }))assert.equal(await stored(page,key),baseline[name],
    'Update must preserve existing user data: '+key);
  await context.setOffline(true);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const newHtml=await page.evaluate(async()=>await(await fetch('./index.html')).text());
  assert(newHtml.includes(marker),'Updated offline cache must serve v2 content');
  await page.locator('#screen .hero h1').waitFor({state:'visible',timeout:15000});
  assert.equal((await workerStatus(page)).activeVersion,v2,'Update must still work offline');
  await context.close();

  // Tampered file served against a signed manifest must fail install atomically.
  const corruptContext=await browser.newContext({serviceWorkers:'allow'});
  const corrupt=await corruptContext.newPage();
  await corrupt.goto(broken,{waitUntil:'domcontentloaded'});
  await corrupt.locator('#screen .hero h1').waitFor({state:'visible',timeout:30000});
  await corrupt.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent.includes('Офлайн-загрузка не завершена'),
    null,{timeout:90000});
  assert.equal(await corrupt.evaluate(()=>!!navigator.serviceWorker.controller),false,
    'Corrupted offline release must not claim control');
  const cacheReady=await corrupt.evaluate(async()=>{
    const names=await caches.keys();
    return names.some(n=>n.includes(':content:'));
  });
  assert.equal(cacheReady,false,'Partial/incomplete signed releases must not be retained as ready');
  await corruptContext.close();
  assert.deepEqual(jsErrors,[],'Offline PWA caused JavaScript errors');
  console.log('PASS: initial verified install for '+initial.total+' assets, '+
    files.length+' offline HTML navigations, catalog, favorite/count/theme/reading preservation, '+
    'content-addressed update, and tampered-asset rejection');
  console.log('NOT CERTIFIED: all real iOS Safari devices, arbitrary quota exhaustion, external online links');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
