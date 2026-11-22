'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let r=await page.goto('http://127.0.0.1:8765/stories.html',{waitUntil:'networkidle'});
   assert.equal(r.status(),200,'Stories page unavailable');
   assert.equal(await page.locator('article[data-story]').count(),3);
   await page.locator('#story-search').fill('Юсуф');
   assert.equal(await page.locator('article[data-story]:visible').count(),1,'Search filter failed');
   assert.equal(await page.locator('article[data-story]:visible').first().getAttribute('id'),'story-yusuf');
   await page.locator('#story-category').selectOption('trust');
   assert.equal(await page.locator('article[data-story]:visible').count(),0,'Combined filters failed');
   assert(await page.locator('#story-empty').isVisible(),'Empty-search announcement missing');
   await page.locator('#story-reset').click();
   assert.equal(await page.locator('article[data-story]:visible').count(),3,'Reset filter failed');
   assert(!(await page.locator('#story-empty').isVisible()));
   await page.locator('#story-yusuf details summary').first().click();
   assert(await page.locator('#story-yusuf details').first().evaluate(e=>e.open),'Discussion question did not expand');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   assert.equal(overflow,false,'Horizontal overflow at '+viewport.width);
   assert.deepEqual(errors,[],'Script exceptions on stories page');
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   await page.locator('#screen .hero h1').waitFor({state:'visible'});
   assert(await page.locator('#screen a[href="stories.html"]').count()>0,'Missing homepage story link');
   await page.locator('.bottom [data-tab="library"]').click();
   await page.locator('[data-knowledge-group="prophet"]').click();
   assert.equal(await page.locator('#screen a[href="stories.html"]').count(),1,'No prophet-category link');
   await page.close();
  }
  console.log('PASS Quran stories: mobile/desktop search, filters, quiz, no layout overflow, home and knowledge navigation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
