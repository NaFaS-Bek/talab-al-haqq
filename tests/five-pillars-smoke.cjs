'use strict';
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    const pillars = [
      ['shahada', 'Шахада'],
      ['salah', 'Намаз'],
      ['zakat', 'Закят'],
      ['sawm', 'Пост'],
      ['hajj', 'Хадж']
    ];
    const correct = [0,1,2,0,1];
    for (const viewport of [{width:390,height:844},{width:1280,height:900}]) {
      const page=await browser.newPage({viewport});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:8765/five-pillars.html',{waitUntil:'load'});
      assert.equal(await page.locator('.pillars > article.card').count(),5);
      assert.equal(await page.locator('.question').count(),5);
      for (const [id,label] of pillars) {
        const card = page.locator('#'+id);
        assert.equal(await card.count(),1,'Missing pillar '+id);
        assert.match(await card.locator('h2').textContent(),new RegExp(label));
        assert.equal(await card.locator('details').count(),1,'No optional explanation for '+id);
        await card.locator('summary').click();
        assert(await card.locator('details').evaluate(el=>el.open),'Explanation should open for '+id);
        assert(await card.locator('a[href^="https://"]').count()>0,'Missing source for '+id);
      }
      assert(await page.locator('a[href="https://sunnah.com/bukhari/2/1"]').count()>0,'Hadith reference needed');
      assert(await page.locator('a[href="https://sunnah.com/muslim:16"]').count()>0,'Muslim reference needed');
      const first = page.locator('.question').nth(0);
      await first.locator('button[data-answer="2"]').click();
      assert.match(await first.locator('.feedback').textContent(),/Пока нет/);
      for(let i=0;i<correct.length;i++) {
        await page.locator('.question').nth(i).locator('button[data-answer="'+correct[i]+'"]').click();
        assert.match(await page.locator('.question').nth(i).locator('.feedback').textContent(),/Верно/);
      }
      assert.match(await page.locator('#quizProgress').textContent(),/Отвечено: 5 из 5 · Верных ответов: 5 из 5/);
      await page.locator('#resetQuiz').click();
      assert.equal(await page.locator('#quizProgress').textContent(),'Отвечено: 0 из 5');
      assert.equal(await page.locator('button[aria-pressed="true"]').count(),0,'Reset should clear selection');
      assert.deepEqual(errors,[],'Browser JS errors');
      const dims=await page.evaluate(()=>({root:document.documentElement.scrollWidth,screen:innerWidth}));
      assert(dims.root<=dims.screen+1,'Horizontal overflow at '+viewport.width+'px '+JSON.stringify(dims));
      await page.screenshot({path:'five-pillars-'+viewport.width+'.png',fullPage:true});
      await page.close();
    }
  } finally {await browser.close();}
  console.log('PASS five pillars: source links, five cards, quiz answers/reset, responsive layout');
})().catch(error=>{console.error(error);process.exit(1)});
