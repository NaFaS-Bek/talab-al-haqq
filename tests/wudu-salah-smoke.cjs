'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const viewport of [{width:390,height:844},{width:1280,height:900}]) {
      const page=await browser.newPage({viewport});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
      await page.locator('.bottom [data-tab="library"]').click();
      await page.locator('[data-knowledge-group="education"]').click();
      await page.locator('[data-education-topic="prayer"]').click();
      assert.equal(await page.locator('a[href="wudu-steps.html"]').count(),1,'Wudu linked from Education prayer topic');
      assert.equal(await page.locator('a[href="salah-steps.html"]').count(),1,'Salah linked from Education prayer topic');
      await page.locator('a[href="wudu-steps.html"]').click();
      await page.waitForURL('**/wudu-steps.html');
      assert.match(await page.locator('h1').textContent(),/Омовение/);
      assert.equal(await page.locator('#sunni [data-steps="sunni"] .step').count(),6,'Sunni ablution example has six steps');
      assert.equal(await page.locator('#jafari [data-steps="jafari"] .step').count(),5,'Jafari ablution example has five steps');
      assert.match(await page.locator('#sunni').innerText(),/Вымойте стопы/);
      assert.match(await page.locator('#jafari').innerText(),/Протрите верхнюю поверхность стоп/);
      assert(await page.locator('#basis a[href="https://quran.com/5:6"]').count()===1);
      assert(await page.locator('#sunni a[href="https://sunnah.com/bukhari:164"]').count()===1);
      assert(await page.locator('#jafari a[href*="sistani.org"]').count()===1);
      const feetFAQ=page.locator('#faq details').first();
      await feetFAQ.locator('summary').click();
      assert(await feetFAQ.evaluate(x=>x.open),'Wudu difference FAQ must open');
      await page.screenshot({path:'wudu-guide-'+viewport.width+'.png',fullPage:true});
      await page.locator('a[href="salah-steps.html"]').first().click();
      await page.waitForURL('**/salah-steps.html');
      assert.match(await page.locator('h1').textContent(),/Намаз по шагам/);
      assert.equal(await page.locator('#first-rakah .steps .step').count(),6,'First rakah must have six learning steps');
      assert.equal(await page.locator('#second-rakah .steps .step').count(),5,'Second rakah and completion must have five steps');
      assert.equal(await page.locator('#differences details').count(),3,'Salah differences must be described');
      assert(await page.locator('#sources a[href^="https://"]').count()>=5);
      await page.locator('#differences summary').first().click();
      assert(await page.locator('#differences details').first().evaluate(x=>x.open),'Salah differences must expand');
      await page.screenshot({path:'salah-guide-'+viewport.width+'.png',fullPage:true});
      const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert(dims.scroll<=dims.width+1,'Horizontal overflow on salah '+viewport.width);
      await page.goto('http://127.0.0.1:8765/wudu-steps.html');
      const wd=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert(wd.scroll<=wd.width+1,'Horizontal overflow on wudu '+viewport.width);
      assert.deepEqual(errors,[],'Browser JavaScript errors');
      await page.close();
    }
  } finally {await browser.close();}
  console.log('PASS wudu and salah guides: navigation, source separation, ordered steps, responsive views');
})().catch(error=>{console.error(error);process.exit(1)});
