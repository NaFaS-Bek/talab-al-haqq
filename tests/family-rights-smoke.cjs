'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
      const page=await browser.newPage({viewport});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
      const home=page.locator('a.tile-link[href="family-rights.html"]');
      assert.equal(await home.count(),1,'Homepage must contain family tile');
      await home.click();
      await page.waitForURL('**/family-rights.html');
      assert.match(await page.locator('h1').textContent(),/Муж и жена/);
      for(const id of ['wife','husband','mutual','disagreements']){
        assert.equal(await page.locator('section#'+id).count(),1,'Missing section: '+id);
      }
      assert(await page.locator('a[href^="https://quran.com/"]').count()>=6,'Include primary Quran sources');
      assert(await page.locator('a[href^="https://sunnah.com/"]').count()>=3,'Include primary hadith sources');
      await page.locator('a[href="#husband"]').click();
      assert.equal(await page.locator('section#husband').count(),1,'Husband section reachable');
      const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert(size.scroll<=size.width+1,'Family guide horizontal overflow '+viewport.width);
      await page.screenshot({path:'family-rights-'+viewport.width+'.png',fullPage:true});
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
      await page.locator('.bottom [data-tab="library"]').click();
      await page.locator('[data-knowledge-group="family"]').click();
      assert.equal(await page.locator('a[href="family-rights.html"]').count(),1,'Family knowledge overview link');
      await page.locator('a[href="family-rights.html"]').click();
      await page.waitForURL('**/family-rights.html');
      assert.deepEqual(errors,[],'No browser JavaScript errors');
      await page.close();
    }
  } finally {await browser.close();}
  console.log('PASS family rights: homepage, knowledge category, Quran/hadith source links, responsive layout');
})().catch(e=>{console.error(e);process.exit(1)});
