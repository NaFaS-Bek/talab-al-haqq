'use strict';
// Chromium smoke covers all checked-in HTML pages; not a substitute for
// real-device/browser matrix, external links, audits of text accuracy or security.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const pages=fs.readdirSync('.').filter(p=>p.endsWith('.html')).sort();
 const browser=await chromium.launch({headless:true});
 const results=[];
 try{
   for(const viewport of [{width:375,height:812},{width:768,height:1024},{width:1280,height:900}]){
     const page=await browser.newPage({viewport,serviceWorkers:'block'});
     let pageErrors=[];
     page.on('pageerror',e=>pageErrors.push(e.message));
     for(const file of pages){
       pageErrors=[];
       const response=await page.goto('http://127.0.0.1:8765/'+file,{waitUntil:'networkidle'});
       assert.equal(response?.status(),200,'Cannot load '+file+' at '+viewport.width);
       if(file==='index.html')await page.locator('#screen .hero h1').waitFor({state:'visible'});
       const info=await page.evaluate(()=>{
         const visible=el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
         const unlabeled=[...document.querySelectorAll('button')].filter(visible)
           .filter(el=>!(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent).trim())
           .map(el=>el.outerHTML.slice(0,150));
         const brokenImages=[...document.images].filter(img=>!img.complete||img.naturalWidth===0)
           .map(img=>img.getAttribute('src'));
         return {
           title:document.title,language:document.documentElement.lang,
           h1:document.querySelectorAll('h1').length,
           scroll:document.documentElement.scrollWidth,
           width:window.innerWidth,
           unlabeled,brokenImages
         };
       });
       assert.equal(info.language,'ru','Missing document lang '+file);
       assert(info.title.length>0,'Missing page title '+file);
       assert.equal(info.h1,1,'Expected one h1 on '+file);
       assert(info.scroll<=info.width+2,'Horizontal overflow in '+file+' at '+viewport.width+': '+info.scroll+' > '+info.width);
       assert.deepEqual(info.unlabeled,[],'Buttons without accessible names on '+file);
       assert.deepEqual(info.brokenImages,[],'Broken images on '+file);
       assert.deepEqual(pageErrors,[],'Uncaught JS errors on '+file+' at '+viewport.width);
       results.push({file,viewport:viewport.width});
     }
     await page.close();
   }
   // This smoke isolates general UI from service worker install/update;
   // the real offline lifecycle is tested by offline-pwa-smoke.cjs.
   const page=await browser.newPage({serviceWorkers:'block',viewport:{width:390,height:844}});
   const r=await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.equal(r?.status(),200);
   await page.locator('#screen .hero h1').waitFor({state:'visible'});
   assert.equal(await page.locator('#offlineStatus').count(),1,'Offline status region must be present');
   // Test core controls without altering any text of Quran or hadith.
   const wasLight=await page.locator('body').evaluate(el=>el.classList.contains('light'));
   await page.locator('#themeBtn').click();
   assert.notEqual(await page.locator('body').evaluate(el=>el.classList.contains('light')),wasLight,
     'Theme toggle should work');
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('light')),!wasLight,
     'Chosen theme should persist in localStorage');
   await page.locator('.bottom [data-tab="dua"]').click();
   await page.locator('[data-dua-group="morning"]').click();
   const first=page.locator('[data-open^="dua:"]').first();
   assert(await first.count()>0,'Morning adhkar list not populated');
   const key=await first.getAttribute('data-open');
   await first.click();
   assert.equal(await page.locator('#modal').getAttribute('aria-modal'),'true');
   await page.locator('#detail [data-fav]').first().click();
   assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('nfs_favs')||'[]'))).includes(key),
     'Favorite must be saved under stable record key');
   await page.keyboard.press('Escape');
   assert(await page.locator('#modal').evaluate(el=>el.classList.contains('hidden')),
     'Escape should close the reader');
   await page.locator('.bottom [data-tab="favorites"]').click();
   assert.equal(await page.locator('[data-open="'+key+'"]').count(),1,
     'Saved favorite should appear in favorites');
   await page.reload({waitUntil:'networkidle'});
   await page.locator('.bottom [data-tab="favorites"]').click();
   assert.equal(await page.locator('[data-open="'+key+'"]').count(),1,
     'Favorite must survive reload');
   await page.close();
   // Corrupted but valid JSON values must not crash localStorage readers.
   const malformed=await browser.newPage({serviceWorkers:'block',viewport:{width:390,height:844}});
   const malformedErrors=[];
   malformed.on('pageerror',e=>malformedErrors.push(e.message));
   await malformed.addInitScript(()=>{
     localStorage.setItem('nfs_favs',JSON.stringify({notAnArray:true}));
     localStorage.setItem('nfs_counts',JSON.stringify(['invalid']));
     localStorage.setItem('nfs_theme',JSON.stringify({notATheme:true}));
     localStorage.setItem('nfs_reading',JSON.stringify('bad'));
   });
   await malformed.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   await malformed.locator('#screen .hero h1').waitFor({state:'visible'});
   await malformed.locator('.bottom [data-tab="favorites"]').click();
   assert.equal(await malformed.locator('[data-open]').count(),0,
     'Malformed favorites should be treated as an empty selection');
   await malformed.locator('.bottom [data-tab="dua"]').click();
   await malformed.locator('[data-dua-group="morning"]').click();
   await malformed.locator('[data-open^="dua:"]').first().click();
   assert(await malformed.locator('#detail [data-fav]').count()>0,
     'Details must remain usable after corrupted saved data');
   assert.deepEqual(malformedErrors,[],'Malformed localStorage caused a JavaScript error');
   await malformed.close();
   const noJsContext=await browser.newContext({javaScriptEnabled:false});
   const noJsPage=await noJsContext.newPage();
   await noJsPage.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   const fallback=noJsPage.locator('noscript');
   assert(await fallback.isVisible(),'No-JavaScript learner fallback must be displayed');
   for(const href of ['five-pillars.html','family-rights.html',
     'arabic-reading-signs.html','wudu-steps.html','salah-steps.html']){
     assert.equal(await fallback.locator('a[href="'+href+'"]').count(),1,
       'No-JavaScript fallback missing '+href);
   }
   await noJsContext.close();
   console.log('PASS site-wide browser smoke:',results.length,'page/viewport combinations across',pages.length,'HTML pages, offline preview disclosure, theme and favorite persistence');
   console.log('NOT CERTIFIED: production hosting, real devices, offline-ready release, accessibility conformance or security penetration test');
 }finally{
   await browser.close();
 }
})().catch(err=>{console.error(err);process.exit(1)});
