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

      // Independent reference sequence: validate all 28 glyphs under all three short vowels,
      // not only a handful of example cards.
      const alphabet = ['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي'];
      assert.equal(new Set(alphabet).size, 28, 'Reference alphabet must contain unique letters');
      const assertAllForms = async (vowel) => {
        const sign = {a: 'َ', i: 'ِ', u: 'ُ'}[vowel];
        const expected = alphabet.map((letter, index) =>
          (index === 0 ? (vowel === 'i' ? 'إ' : 'أ') : letter) + sign
        );
        const actual = await page.locator('#alphabetGrid .letter-card .letter').allTextContents();
        assert.deepEqual(actual, expected, 'Incorrect alphabet forms or order for vowel ' + vowel);
        const readings = await page.locator('#alphabetGrid .letter-card .reading').allTextContents();
        assert.equal(readings.length, 28, 'Every letter needs a reading hint for vowel ' + vowel);
        for (let i = 0; i < readings.length; i++) {
          assert(readings[i].trim() && !/undefined|null/.test(readings[i]), 'Missing reading for letter ' + (i + 1));
        }
        assert.equal(await page.locator('#vowelControls button[aria-pressed="true"]').getAttribute('data-vowel'), vowel);
      };
      await assertAllForms('a');
      assert.equal(await page.locator('.vowel-info').count(), 3, 'All vowel explanations belong in the same learning panel');
      assert.equal(await page.locator('.learning-panel #alphabetGrid').count(), 1);
      assert.equal(await page.locator('.learning-panel #vowelControls').count(), 1);
      assert.equal(await page.locator('.learning-panel #alphabetAnswers').count(), 1);
      assert.equal(await page.locator('.learning-panel #pronunciationPairs').count(), 1, 'Difficult sounds must stay in the same lesson');
      const difficultPairs = await page.locator('#pronunciationPairs li').allTextContents();
      assert.equal(difficultPairs.length, 8, 'Eight pronunciation contrasts are required');
      for (const pair of ['ث / س', 'ذ / ز / ظ', 'ح / ه', 'ع / ء', 'ق / ك', 'و / ف', 'غ', 'ص / س']) {
        assert(difficultPairs.some(line => line.includes(pair)), 'Missing pronunciation contrast: ' + pair);
      }
      const waw = page.locator('#alphabetGrid .letter-card').nth(26);
      const ghayn = page.locator('#alphabetGrid .letter-card').nth(18);
      const hamza = page.locator('#alphabetGrid .letter-card').nth(0);
      assert.equal(await waw.locator('.reading').textContent(), 'wa', 'Waw must not be pronounced as Russian v');
      assert.equal(await ghayn.locator('.reading').textContent(), 'ɣа', 'Ghayn must not be plain Russian g');
      assert.equal(await hamza.locator('.reading').textContent(), 'ʔа', 'Initial hamza includes glottal stop');
      const lam = page.locator('#alphabetGrid .letter-card').nth(22);
      assert.equal(await lam.locator('.letter').textContent(), 'لَ');
      assert.equal(await lam.locator('.reading').textContent(), 'ла');
      assert.equal(await page.locator('#alphabetGrid .letter-card').nth(1).locator('.letter').textContent(), 'بَ');
      await page.locator('[data-vowel="i"]').click();
      await assertAllForms('i');
      assert.equal(await page.locator('#alphabetGrid .letter-card').nth(1).locator('.letter').textContent(), 'بِ');
      assert.equal(await page.locator('[data-vowel="i"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await lam.locator('.reading').textContent(), 'ли');
      assert.equal(await waw.locator('.reading').textContent(), 'wi');
      assert.equal(await ghayn.locator('.reading').textContent(), 'ɣи');
      assert.equal(await hamza.locator('.reading').textContent(), 'ʔи');
      await page.locator('[data-vowel="u"]').click();
      await assertAllForms('u');
      assert.equal(await page.locator('#alphabetGrid .letter-card').nth(1).locator('.letter').textContent(), 'بُ');
      assert.equal(await lam.locator('.reading').textContent(), 'лу');
      assert.equal(await waw.locator('.reading').textContent(), 'wu');
      assert.equal(await ghayn.locator('.reading').textContent(), 'ɣу');
      assert.equal(await hamza.locator('.reading').textContent(), 'ʔу');
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
  console.log('PASS Arabic lesson: all 84 letter-vowel forms, 28 hints per vowel, quiz, navigation, mobile/desktop layout');
})().catch(error=>{console.error(error);process.exit(1)});
