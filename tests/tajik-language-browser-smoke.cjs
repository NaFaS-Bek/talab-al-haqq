'use strict';
// RU/TG toggle smoke. UI translations are NOT theological or translation certification.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async () => {
  const browser=await chromium.launch({headless:true});
  try {
    for (const width of [390, 1280]) {
      const page=await browser.newPage({viewport:{width,height:840},serviceWorkers:'block'});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
      await page.locator('#screen .hero h1').waitFor({state:'visible'});
      assert.equal(await page.locator('html').getAttribute('lang'),'ru');
      assert.equal(await page.locator('#talab-lang-switch button').count(),2);
      await page.locator('#talab-lang-switch [data-language="tg"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'),'tg');
      assert.equal(await page.locator('#screen h1').innerText(),'Бигзор ҳар рӯз бо некӣ оғоз шавад');
      assert.equal(await page.locator('#nav [data-tab="home"] span').innerText(),'Асосӣ');
      assert(await page.locator('#talab-translation-notice').isVisible());
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nfs_lang'))),'tg');
      await page.locator('#nav [data-tab="dua"]').click();
      assert.equal(await page.locator('#screen h2').first().innerText(),'Дуоҳо ва зикрҳо');
      await page.locator('[data-dua-group="morning"]').click();
      await page.locator('[data-open^="dua:"]').first().click();
      const recordKey=await page.locator('#detail [data-fav]').first().getAttribute('data-fav');
      const before=await page.locator('#detail .arabic').first().innerText();
      assert(before.length>5,'Arabic record not visible');
      await page.keyboard.press('Escape');
      await page.locator('#talab-lang-switch [data-language="ru"]').click();
      await page.locator('[data-open="'+recordKey+'"]').click();
      const after=await page.locator('#detail .arabic').first().innerText();
      assert.equal(after,before,'Never alter Quran/hadith Arabic on locale changes');
      assert.equal(await page.locator('#nav [data-tab="home"] span').innerText(),'Главная');
      assert.equal(await page.locator('#talab-translation-notice').count(),0);
      await page.keyboard.press('Escape');
      await page.locator('#nav [data-tab="home"]').click();
      await page.locator('#talab-lang-switch [data-language="tg"]').click();
      const aboutLink=page.locator('#screen a[href$="about-tg.html"]');
      assert.equal(await aboutLink.count(),1);
      await aboutLink.click();
      assert(page.url().endsWith('/about-tg.html'),'Tajik locale must link to Tajik About page');
      assert.equal(await page.locator('html').getAttribute('lang'),'tg');
      assert(await page.locator('#limits').innerText().then(s=>s.includes('Ҳанӯз тамоми муҳтавои сомона')));
      await page.locator('#talab-lang-switch [data-language="ru"]').click();
      await page.waitForURL('**/about.html');
      assert.equal(await page.locator('html').getAttribute('lang'),'ru');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nfs_lang'))),'ru');
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
      await page.locator('#screen .hero h1').waitFor({state:'visible'});
      assert.equal(await page.locator('html').getAttribute('lang'),'ru');
      assert.equal(await page.locator('#screen h1').innerText(),'Пусть каждый день начинается с доброго');
      await page.locator('#talab-lang-switch [data-language="tg"]').click();
      await page.locator('#screen a[href="stories-tg.html"]').click();
      await page.waitForURL('**/stories-tg.html');
      assert.equal(await page.locator('article.story').count(),3);
      assert.equal(await page.locator('html').getAttribute('lang'),'tg');
      await page.locator('#talab-lang-switch [data-language="ru"]').click();
      await page.waitForURL('**/stories.html');
      assert.equal(await page.locator('article.story').count(),15);
      assert.equal(await page.locator('html').getAttribute('lang'),'ru');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'No horizontal overflow');
      assert.deepEqual(errors,[],'Browser errors during locale switch');
      await page.close();
    }
    console.log('PASS Russian/Tajik UI, About page, persistent language, source immutability and responsive widths');
    console.log('NOT CERTIFIED: entire catalog translated or independently reviewed Tajik terminology');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
