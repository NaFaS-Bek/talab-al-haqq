'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless: true});
  try {
    for (const viewport of [{width: 390, height: 844}, {width: 1280, height: 900}]) {
      const page = await browser.newPage({viewport});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:8765/arabic-reading-signs.html', {waitUntil:'load'});
      assert.equal(await page.locator('#alphabetGrid .letter-card').count(), 28, '28 letters required');
      assert.equal(await page.locator('.vowel-info').count(), 3, 'All vowel explanations belong in the same learning panel');
      assert.equal(await page.locator('.learning-panel #alphabetGrid').count(), 1);
      assert.equal(await page.locator('.learning-panel #vowelControls').count(), 1);
      assert.equal(await page.locator('.learning-panel #alphabetAnswers').count(), 1);
      assert.equal(await page.locator('#alphabetGrid .letter-card').nth(1).locator('.letter').textContent(), 'بَ');
      await page.locator('[data-vowel="i"]').click();
      assert.equal(await page.locator('#alphabetGrid .letter-card').nth(1).locator('.letter').textContent(), 'بِ');
      assert.equal(await page.locator('[data-vowel="i"]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-vowel="u"]').click();
      assert.equal(await page.locator('#alphabetGrid .letter-card').nth(1).locator('.letter').textContent(), 'بُ');
      await page.locator('#alphabetAnswers button').nth(1).click();
      assert.match(await page.locator('#alphabetFeedback').textContent(), /Верно/);
      await page.locator('#nextAlphabetQuestion').click();
      assert.equal(await page.locator('#alphabetAnswers button:not([disabled])').count(), 3);
      const dims = await page.evaluate(() => ({root:document.documentElement.scrollWidth,screen:window.innerWidth}));
      assert(dims.root <= dims.screen + 1, 'Horizontal overflow at '+viewport.width+'px: '+JSON.stringify(dims));
      assert.deepEqual(errors,[], 'Browser JS errors');
      await page.screenshot({path:'arabic-lesson-'+viewport.width+'.png',fullPage:true});
      await page.close();
    }
  } finally { await browser.close(); }
  console.log('PASS Arabic lesson 28-letter grid, vowel selector, quiz, mobile/desktop layout');
})().catch(error=>{console.error(error);process.exit(1)});
