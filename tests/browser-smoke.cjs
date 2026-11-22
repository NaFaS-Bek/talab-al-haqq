'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.footer [data-tab="review"]').count(),0,'Duplicate review button must not appear at the bottom');
  await page.locator('#reviewBtn').click();
  assert.match(await page.locator('#screen .sectionhead h2').first().textContent(),/Источники и проверка/,'Header should open review information');
  assert.equal(await page.locator('#reviewBtn').getAttribute('aria-pressed'),'true','Header button must announce review open state');
  await page.locator('#reviewBtn').click();
  assert.equal(await page.locator('#screen .hero h1').count(),1,'Second header click should close review and restore home');
  assert.equal(await page.locator('#reviewBtn').getAttribute('aria-pressed'),'false','Header button must announce review closed state');
  await page.locator('.tile[data-tab="library"]').click();
  await page.locator('[data-knowledge-group="prophet"]').click();
  assert(await page.locator('[data-open="lib:prophet_adam"]').count()===1,'Adam should appear in prophets');
  await page.locator('#reviewBtn').click();
  await page.locator('#reviewBtn').click();
  assert.equal(await page.locator('[data-open="lib:prophet_adam"]').count(),1,'Closing review should preserve the prior category');
  assert.equal(await page.locator('.footer [data-tab="review"]').count(),0,'Duplicate review button must stay removed on category pages');
  await page.locator('[data-back="library"]').click();
  await page.locator('[data-knowledge-group="education"]').click();
  assert(await page.locator('[data-education-topic="prayer"]').count()===1,'Prayer must be in Education');
  assert(await page.locator('[data-education-topic="alphabet"]').count()===1,'Alphabet must be in Education');
  assert(await page.locator('[data-education-topic="pillars"]').count()===1,'Five pillars must be the first Education topic');
  assert.equal(await page.locator('[data-education-topic]').first().getAttribute('data-education-topic'),'pillars');
  await page.locator('[data-education-topic="pillars"]').click();
  assert.equal(await page.locator('a[href="five-pillars.html"]').count(),1,'Pillars lesson must be under Education');
  await page.locator('a[href="five-pillars.html"]').click();
  await page.waitForURL('**/five-pillars.html');
  assert.equal(await page.locator('.pillars > article.card').count(),5,'Five pillars lesson must contain all five entries');
  assert.equal(await page.locator('.quiz .question').count(),5,'Beginner quiz must have five questions');
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.locator('.tile[data-tab="library"]').click();
  await page.locator('[data-knowledge-group="education"]').click();
  await page.locator('[data-education-topic="prayer"]').click();
  assert(await page.locator('[data-open^="lib:"]').count()>0,'Prayer category should contain materials');
  await page.locator('[data-education-back="1"]').click();
  await page.locator('[data-education-topic="alphabet"]').click();
  assert.equal(await page.locator('a[href="arabic-reading-signs.html"]').count(),1,'Alphabet lesson link must be under Education');
  await page.locator('a[href="arabic-reading-signs.html"]').click();
  await page.waitForURL('**/arabic-reading-signs.html');
  assert.equal(await page.locator('#alphabetGrid .letter-card').count(),28,'Arabic lesson must show all 28 letters');
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.locator('.tile[data-tab="library"]').click();
  await page.locator('#search').fill('Адам');
  assert(await page.locator('[data-open="lib:prophet_adam"]').count()===1,'Library search should find Adam');
  await page.locator('.bottom [data-tab="dua"]').click();
  await page.locator('[data-dua-group="morning"]').click();
  assert(await page.locator('[data-open^="dua:"]').count()>0,'Morning adhkar should not be empty');
  await page.locator('[data-back="dua"]').click();
  await page.locator('[data-dua-group="health"]').click();
  assert(await page.locator('[data-open^="dua:"]').count()>0,'Health dua should not be empty');
  await page.locator('.bottom [data-tab="home"]').click();
  await page.locator('[data-home-knowledge="events"]').click();
  assert(await page.locator('[data-open^="history:"]').count()>0,'History shortcut should work');
  await page.locator('[data-open^="history:"]').first().click();
  const reader = page.locator('#detail');
  assert(await reader.isVisible(),'Reader should open');
  const mobileMetrics = await page.evaluate(() => {
    const detail = document.querySelector('#detail').getBoundingClientRect();
    const sheet = document.querySelector('.sheet').getBoundingClientRect();
    const body = document.querySelector('#detail .bodycopy');
    return {detailWidth:detail.width,sheetWidth:sheet.width,viewport:innerWidth,bodyLineHeight:body?parseFloat(getComputedStyle(body).lineHeight):null};
  });
  assert(mobileMetrics.sheetWidth <= mobileMetrics.viewport + 1,'Reader must fit mobile viewport');
  assert(mobileMetrics.detailWidth <= mobileMetrics.sheetWidth,'Reading content must fit sheet');
  if(mobileMetrics.bodyLineHeight) assert(mobileMetrics.bodyLineHeight >= 28,'Long-form text needs readable line height');
  await page.locator('#modal .close[data-close="1"]').click();
  // Verse layout must use exactly the catalog's Arabic segments; no inferred cuts.
  await page.locator('.bottom [data-tab="dua"]').click();
  await page.locator('[data-dua-group="surahs"]').click();
  assert.match(await page.locator('#screen .sectionhead h2').first().textContent(),/Суры для чтения/);
  await page.locator('[data-open="dua:q_surah_112"]').click();
  assert.match(await page.locator('#detail .material-type').textContent(),/Сура для чтения/);
  assert.match(await page.locator('#detail [data-reading-timing]').textContent(),/утром и вечером.*3 раза/,'Three last surahs: cited 5082 reading schedule must be visible');
  const fourVerses=await page.locator('#detail .verse-card').count();
  assert.equal(fourVerses,4,'Al-Ikhlas must have four separately labelled verses');
  const source=require('node:fs');
  const catalog=JSON.parse(source.readFileSync('data/content.json','utf8'));
  const surah=[...catalog.catalog.entries,...catalog.catalog_additions.entries].find(x=>x.id==='q_surah_112');
  assert.deepEqual(await page.locator('#detail .verse-arabic').allTextContents(),surah.segments.map(s=>s.arabicText),'Arabic verse texts must be unchanged');
  await page.locator('#modal .close').click();
  await page.locator('[data-back="dua"]').click();
  // Fallback schedules are displayed only for the two hadith cards with linked evidence.
  await page.locator('#search').fill('Субханаллахи');
  await page.locator('[data-open="dua:h_muslim_2692"]').click();
  assert.match(await page.locator('#detail [data-reading-timing]').textContent(),/утром и вечером.*100 раз/,'Muslim 2692 time and recitation count must be visible');
  assert.match(await page.locator('#detail .source-inline').textContent(),/Субханаллахи ва би-хамдихи\./,'Muslim 2692 base transliteration must retain the final -hi');
  const pronunciation = page.locator('#detail [data-pronunciation-note]');
  assert.equal(await pronunciation.count(),1,'Muslim 2692 must show its existing pronunciation explanation to readers');
  assert.match(await pronunciation.textContent(),/без остановки:.*би-хамдихи.*при остановке.*би-хамдих/i,'Explain continuous and pausal readings in the displayed note');
  await page.locator('#modal .close').click();
  await page.locator('#search').fill('5088');
  // Use the direct record search only if the search index contains the hadith number.
  if (await page.locator('[data-open="dua:h_abudawud_5088"]').count() === 0) await page.locator('#search').fill('С именем Аллаха');
  await page.locator('[data-open="dua:h_abudawud_5088"]').click();
  assert.match(await page.locator('#detail [data-reading-timing]').textContent(),/утром и вечером.*3 раза/,'Abu Dawud 5088 time and recitation count must be visible');
  const abudawudNote = page.locator('#detail [data-pronunciation-note]');
  assert.equal(await abudawudNote.count(),1,'Abu Dawud 5088 must show one reading explanation');
  assert.match(await abudawudNote.textContent(),/с остановкой.*ль-‘алиму/s,'Explain Abu Dawud 5088 final short u versus pause');
  await page.locator('#modal .close').click();

  await page.locator('#search').fill('Когда наступило утро');
  await page.locator('[data-open="dua:h_tirmidhi_3391_morning"]').click();
  const morningNote = page.locator('#detail [data-pronunciation-note]');
  assert.equal(await morningNote.count(),1,'Tirmidhi 3391 morning needs its own note');
  assert.match(await morningNote.textContent(),/ль-масыр.*при остановке.*ль-масыру/is,'Morning ending and pause must be explained');
  assert.match(await page.locator('#detail .arabic').first().textContent(),/الْمَصِيرُ$/,'Morning Arabic ending remains untouched');
  await page.locator('#modal .close').click();

  await page.locator('#search').fill('Когда наступил вечер');
  await page.locator('[data-open="dua:h_tirmidhi_3391_evening"]').click();
  const eveningNote = page.locator('#detail [data-pronunciation-note]');
  assert.equal(await eveningNote.count(),1,'Tirmidhi 3391 evening needs its own note');
  assert.match(await eveningNote.textContent(),/н-нушур.*при остановке.*н-нушуру/is,'Evening ending and pause must be explained');
  assert.match(await page.locator('#detail .arabic').first().textContent(),/النُّشُورُ$/,'Evening Arabic ending remains untouched');
  await page.locator('#modal .close').click();

  await page.locator('#search').fill('');
  await page.locator('[data-dua-group="daily"]').click();
  await page.locator('[data-open="dua:h_muslim_2018a"]').click();
  assert.match(await page.locator('#detail .material-type').textContent(),/Наставление/);
  assert.equal(await page.locator('#detail .counter').count(),0,'Narrative instruction should not show a repetition counter');
  assert.equal(await page.locator('#detail [data-reading-timing]').count(),0,'Narrative instruction must not be mistaken for timed recitation');
  assert.equal(await page.locator('#detail [data-pronunciation-note]').count(),0,'Unrelated narration must not inherit a pronunciation note');
  await page.locator('#modal .close').click();
  await page.locator('[data-back="dua"]').click();
  await page.locator('[data-dua-group="prophets"]').click();
  await page.locator('[data-open="dua:q_21_87"]').click();
  assert(await page.locator('#detail .reading-note').isVisible(),'Narrative context must be marked');
  await page.locator('#modal .close').click();
  // Three Quranic verb forms are morphologically distinct, despite similar
  // approximate Cyrillic renderings. Source-guarded notes must be visible.
  await page.locator('[data-back="dua"]').click();
  for (const scenario of [
    {search:'Признание ошибки', id:'q_7_23', form:'qālā', number:'двойственное число', location:'7%3A23%3A1'},
    {search:'Терпение и стойкость', id:'q_2_250', form:'qālū', number:'множественное число', location:'2%3A250%3A5'},
    {search:'Мольба Мусы', id:'q_20_25_28', form:'qāla', number:'единственное число', location:'20%3A25%3A1'},
  ]) {
    await page.locator('#search').fill(scenario.search);
    await page.locator('[data-open="dua:' + scenario.id + '"]').click();
    const note = page.locator('#detail [data-pronunciation-note]');
    assert.equal(await note.count(),1,scenario.id + ': source-linked reading note must appear');
    const noteText = await note.textContent();
    assert(noteText.includes(scenario.form) && noteText.includes(scenario.number),
      scenario.id + ': correct vocalization and grammatical number must be visible');
    const link = page.locator('#detail [data-pronunciation-source] a');
    assert.equal(await link.count(),1,scenario.id + ': grammar citation must be linked');
    assert((await link.getAttribute('href')).includes(scenario.location),
      scenario.id + ': Quranic Arabic Corpus morphology link must target exact word');
    assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
    await page.locator('#modal .close').click();
  }
  // Arabic consonants ض ظ ع غ ح ق have distinct standard phonetic symbols
  // that ordinary Cyrillic approximations do not fully preserve.
  for (const scenario of [
    {search:'Айюб: обращение в страдании', id:'q_21_83', symbol:'ض (ḍād)'},
    {search:'Мольба Юнуса во мраке', id:'q_21_87', symbol:'ظ (ẓā)'},
    {search:'Благодарность за дарованное благо', id:'q_27_19', symbol:'ع (ʿayn)'},
    {search:'Нух: мольба о прощении', id:'q_71_28', symbol:'غ (ghayn)'},
    {search:'Юсуф: о благом завершении', id:'q_12_101', symbol:'ح (ḥā)'},
    {search:'Мольба Исы о даровании пропитания', id:'q_5_114', symbol:'ق (qāf)'},
  ]) {
    await page.locator('#search').fill(scenario.search);
    await page.locator('[data-open="dua:' + scenario.id + '"]').click();
    const explanation = page.locator('#detail [data-pronunciation-note]');
    assert.equal(await explanation.count(),1,
      scenario.id + ': exact source-linked phonetic note missing');
    assert((await explanation.textContent()).includes(scenario.symbol),
      scenario.id + ': note does not describe the intended Arabic consonant');
    const link = page.locator('#detail [data-pronunciation-source] a');
    assert.equal(await link.count(),1,
      scenario.id + ': source link missing');
    assert.equal(await link.getAttribute('href'),
      'https://corpus.quran.com/documentation/phonetic.jsp',
      scenario.id + ': wrong phonetic scheme source');
    assert.match(await link.textContent(),/Обозначения звуков: Quranic Arabic Corpus/);
    await page.locator('#modal .close').click();
  }
  // Arabic shadda, long vowels and verse-end pauses: four new protected notes.
  for (const scenario of [
    {search:'Лут: о спасении семьи', id:'q_26_169', fragment:'جّ удвоена шаддой', pause:true},
    {search:'Мольба Закарии о потомстве', id:'q_21_89', fragment:'краткое конечное «а»', pause:true},
    {search:'Ибрахим: молитва и прощение', id:'q_14_40_41', fragment:'رّ и يّ', pause:false},
    {search:'Ибрахим и Исмаил: о принятии дела', id:'q_2_127_128', fragment:'над نّ стоит шадда', pause:false},
  ]) {
    await page.locator('#search').fill(scenario.search);
    const card = page.locator('[data-open="dua:' + scenario.id + '"]');
    assert.equal(await card.count(),1,scenario.id + ': search should locate exactly one reviewed entry');
    await card.click();
    const note = page.locator('#detail [data-pronunciation-note]');
    assert.equal(await note.count(),1,scenario.id + ': reading note missing');
    assert((await note.textContent()).includes(scenario.fragment),
      scenario.id + ': documented Arabic reading point missing');
    const source = page.locator('#detail [data-pronunciation-source] a');
    assert.equal(await source.count(),1,scenario.id + ': corpus source link missing');
    assert.equal(await source.getAttribute('href'),
      'https://corpus.quran.com/documentation/phonetic.jsp',
      scenario.id + ': wrong long-vowel/shadda source');
    const pause = page.locator('#detail [data-pause-source] a');
    assert.equal(await pause.count(),scenario.pause ? 1 : 0,
      scenario.id + ': unexpected pause-rule link');
    if (scenario.pause) {
      assert.equal(await pause.getAttribute('href'),
        'https://abouttajweed.com/tajweed-basics/common-tajweed-errors');
      assert.equal(await pause.getAttribute('rel'),'noopener noreferrer');
    }
    await page.locator('#modal .close').click();
  }
  await page.locator('#search').fill('Шуайб: о справедливом решении');
  await page.locator('[data-open="dua:q_7_89"]').click();
  assert.equal(await page.locator('#detail [data-pronunciation-source]').count(),0,
    'Unrelated Quranic dua must not inherit a phonetic note');
  assert.equal(await page.locator('#detail [data-pause-source]').count(),0,
    'Unrelated Quranic dua must not inherit a pause-rule note');
  await page.locator('#modal .close').click();

  // Compare five specific Quranic dua displays against the pinned Tanzil
  // *mirror* pause marks. Symbols must stay outside the Quranic Arabic text.
  for (const spec of [
    {id:'q_14_40_41',search:'Ибрахим: молитва и прощение',jeem:1,silaa:0},
    {id:'q_2_127_128',search:'Ибрахим и Исмаил: о принятии дела',jeem:0,silaa:2},
    {id:'q_12_101',search:'Юсуф: о благом завершении',jeem:1,silaa:1},
    {id:'q_7_89',search:'Шуайб: о справедливом решении',jeem:4,silaa:0},
    {id:'q_5_114',search:'Мольба Исы о даровании пропитания',jeem:0,silaa:1},
  ]) {
    await page.locator('#search').fill(spec.search);
    const card=page.locator('[data-open="dua:'+spec.id+'"]');
    assert.equal(await card.count(),1,spec.id+': missing reviewed record');
    await card.click();
    const guide=page.locator('#detail [data-quran-pause-guide]');
    assert.equal(await guide.count(),1,spec.id+': pause-comparison panel missing');
    assert.equal(await guide.getAttribute('open'),null,'Pause comparison should be collapsed by default');
    await guide.locator('summary').click();
    assert.equal(await guide.locator('[data-pause-mark="6DA"]').count(),spec.jeem,
      spec.id+': incorrect source jeem count');
    assert.equal(await guide.locator('[data-pause-mark="6D6"]').count(),spec.silaa,
      spec.id+': incorrect source silaa count');
    assert.match(await guide.textContent(),/закреплённом стороннем снимке Tanzil Uthmani 1\.1/,
      'Mirror provenance and limits must be visible');
    assert.match(await guide.textContent(),/Вакф — остановка, васл — продолжение чтения/,
      'Reading vocabulary must be explained');
    const reference=guide.locator('a[href="https://tanzil.net/docs/pause_marks"]');
    assert.equal(await reference.count(),1,spec.id+': official explanation URL missing');
    assert.equal(await reference.getAttribute('rel'),'noopener noreferrer');
    const arabic=await page.locator('#detail .arabic').allTextContents();
    assert(arabic.length>0,spec.id+': original Quranic text missing');
    assert(arabic.every(t=>!/[ۚۖ]/u.test(t)),
      spec.id+': explanatory signs must NOT be spliced into Quranic scripture');
    await page.locator('#modal .close').click();
  }
  await page.locator('#search').fill('Лут: о спасении семьи');
  await page.locator('[data-open="dua:q_26_169"]').click();
  assert.equal(await page.locator('#detail [data-quran-pause-guide]').count(),0,
    'Unrelated Quranic dua must not inherit a source pause-mark discrepancy');
  await page.locator('#modal .close').click();

  assert.deepEqual(errors,[],'Unexpected browser errors');
  await page.screenshot({path:'navigation-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  await page.screenshot({path:'navigation-desktop.png',fullPage:true});
  await browser.close();
  console.log('PASS browser navigation, search, mobile and desktop screenshots');
})().catch(e=>{console.error(e);process.exit(1)});
