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
     const page=await browser.newPage({viewport});
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
   // Source repository worker is intentionally unprepared: do not install a broken SW.
   const page=await browser.newPage({viewport:{width:390,height:844}});
   const r=await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.equal(r?.status(),200);
   await page.locator('#screen .hero h1').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelector('#offlineStatus')?.textContent.includes('Онлайн-версия'));
   assert.match(await page.locator('#offlineStatus').textContent(),/офлайн-режим доступен только в подготовленной PWA-сборке/);
   assert.equal(await page.evaluate(()=>!!navigator.serviceWorker?.controller),false,
     'Unpackaged source must not activate unprepared service worker');
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
   console.log('PASS site-wide browser smoke:',results.length,'page/viewport combinations across',pages.length,'HTML pages, offline preview disclosure, theme and favorite persistence');
   console.log('NOT CERTIFIED: production hosting, real devices, offline-ready release, accessibility conformance or security penetration test');
 }finally{
   await browser.close();
 }
})().catch(err=>{console.error(err);process.exit(1)});
