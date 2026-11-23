'use strict';
// Browser regression for story filtering and route access, not theological review.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto('http://127.0.0.1:8765/stories.html',{waitUntil:'networkidle'});
   assert.equal(response?.status(),200,'Stories page unavailable');
   const visible=page.locator('article[data-story]:visible');
   assert.equal(await page.locator('article[data-story]').count(),15);
   assert.equal(await visible.count(),15,'All fifteen articles must be visible initially');
   await page.locator('#story-search').fill('Юсуф');
   assert.equal(await visible.count(),1,'Search must find Yusuf');
   assert.equal(await visible.first().getAttribute('id'),'story-yusuf');
   await page.locator('#story-category').selectOption('trust');
   assert.equal(await visible.count(),0,'Combined mismatching filters should show zero');
   assert(await page.locator('#story-empty').isVisible(),'Missing empty result');
   await page.locator('#story-reset').click();
   assert.equal(await visible.count(),15,'Reset must show all fifteen stories');
   for(const [category,expectedIds] of [
    ['family',['story-ibrahim','story-maryam','story-nuh','story-zakariya','story-ibrahim-father','story-musa-harun']],
    ['wisdom',['story-luqman','story-sulayman-ant','story-saba-queen']],
    ['companions',['story-abubakr']],
    ['kindness',['story-musa-well']]
   ]){
    await page.locator('#story-category').selectOption(category);
    const ids=await visible.evaluateAll(els=>els.map(el=>el.id));
    assert.deepEqual(ids,expectedIds,'Category filter '+category);
   }
   await page.locator('#story-reset').click();
   await page.locator('#story-abubakr details summary').first().click();
   assert(await page.locator('#story-abubakr details').first().evaluate(e=>e.open),'Question accordion broken');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
   assert.equal(overflow,false,'Horizontal overflow at '+viewport.width);
   assert.deepEqual(errors,[],'JS error on fifteen-story page');
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   await page.locator('#screen .hero h1').waitFor({state:'visible'});
   assert(await page.locator('#screen a[href="stories.html"]').count()>0,'Homepage stories link');
   await page.locator('.bottom [data-tab="library"]').click();
   await page.locator('[data-knowledge-group="prophet"]').click();
   assert.equal(await page.locator('#screen a[href="stories.html"]').count(),1,'Prophet knowledge link');
   await page.close();
  }
  console.log('PASS: fifteen story texts, filters, details, search, navigation and mobile/desktop widths');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
