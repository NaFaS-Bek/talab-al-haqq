'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const lessons=[
  {file:'family-nikah.html',title:/Никах/,required:['https://quran.com/24/32','https://sunnah.com/bukhari:5136']},
  {file:'family-mahr.html',title:/Махр/,required:['https://quran.com/4/4','https://sunnah.com/bukhari:5150']},
  {file:'family-children.html',title:/Воспитание детей/,required:['https://quran.com/31/13','https://sunnah.com/bukhari:5997']},
  {file:'family-child-rights.html',title:/Права ребёнка в исламе/,required:['https://quran.com/2/233','https://sunnah.com/bukhari:5467','https://sunnah.com/bukhari:2587']},
  {file:'family-prophetic-example.html',title:/Семейная жизнь/,required:['https://quran.com/30/21','https://sunnah.com/bukhari:6039']}
];
(async()=>{
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]){
    const page=await browser.newPage({viewport});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    await page.locator('.bottom [data-tab="library"]').click();
    await page.locator('[data-knowledge-group="family"]').click();
    for(const lesson of lessons){
      assert.equal(await page.locator('a[href="'+lesson.file+'"]').count(),1,'Category link '+lesson.file);
    }
    await page.locator('a[href="family-rights.html"]').click();
    await page.waitForURL('**/family-rights.html');
    for(const lesson of lessons){
      assert.equal(await page.locator('#family-curriculum a[href="'+lesson.file+'"]').count(),1,'Overview link '+lesson.file);
      await page.locator('#family-curriculum a[href="'+lesson.file+'"]').click();
      await page.waitForURL('**/'+lesson.file);
      assert.match(await page.locator('h1').textContent(),lesson.title,'Lesson title '+lesson.file);
      assert(await page.locator('section.card').count()>=4,'Must have explanation and practical sections');
      if (lesson.file === 'family-child-rights.html') {
        assert.equal(await page.locator('section.card').count(),8,
          'Child rights must contain eight focused sections');
        assert.equal(await page.locator('.quick-nav a[href^="#right-"]').count(),8,
          'Each child right section needs quick navigation');
        assert.equal(await page.locator('#right-8 details').count(),5,
          'Child rights should include five source-aware checks');
        for (const href of [
          'https://quran.com/17/31',
          'https://quran.com/2/233',
          'https://quran.com/20/132',
          'https://quran.com/49/11',
          'https://quran.com/4/2',
          'https://quran.com/4/9',
          'https://sunnah.com/bukhari:5364',
          'https://sunnah.com/bukhari:5467',
          'https://sunnah.com/bukhari:2587',
        ]) {
          assert.equal(await page.locator('a[href="'+href+'"]').count()>0,true,
            'Child-rights source is absent '+href);
        }
        const pageText=await page.locator('main').innerText();
        for (const phrase of [
          'конкретный запрет на убийство',
          'Описание тахника не является медицинской рекомендацией',
          'Контекст аята связан с кормлением',
          'Аят 49:11 обращён к верующим в целом',
          'Это рассказ о дарении одному из детей',
          'Эти аяты имеют конкретные имущественные и опекунские контексты',
        ]) {
          assert(pageText.includes(phrase),'Missing child-rights source-boundary explanation '+phrase);
        }
      }
      if (lesson.file === 'family-children.html') {
        assert.equal(await page.locator('section.card').count(),8,
          'Child upbringing needs 8 deliberate learning sections');
        assert.equal(await page.locator('.quick-nav a[href^="#section-"]').count(),8,
          'All child upbringing sections must be accessible from navigation');
        assert.equal(await page.locator('#section-8 details').count(),6,
          'Child upbringing must have six source-aware self checks');
        assert.equal(await page.locator('[data-age-stage]').count(),3,
          'Child upbringing should offer three age-sensitive examples');
        for (const id of ['early','school','teen']) {
          assert.equal(await page.locator('#age-'+id+'[data-age-stage="'+id+'"]').count(),1,
            'Age guide missing: '+id);
          assert.equal(await page.locator('.subnav a[href="#age-'+id+'"]').count(),1,
            'Age sub-navigation missing: '+id);
        }
        for (const link of [
          'https://sunnah.com/abudawud:495',
          'https://quran.com/16/125',
          'https://www.unicef.org/parenting/mental-health/build-foundation-0-5-years',
          'https://www.unicef.org/parenting/child-care/11-tips-communicating-your-teen',
          'https://www.unicef.org/parenting/child-care/how-discipline-your-child-smart-and-healthy-way',
        ]) {
          assert(await page.locator('a[href="'+link+'"]').count()>0,
            'Age guidance must cite and distinguish source: '+link);
        }
        for (const href of [
          'https://sunnah.com/bukhari:2587',
          'https://quran.com/20/132',
          'https://quran.com/31/14-15',
          'https://quran.com/31/16-19',
        ]) {
          assert(await page.locator('a[href="'+href+'"]').count()>=1,
            'Child lesson missing newly verified primary source '+href);
        }
        const contents=await page.locator('main').innerText();
        for(const phrase of [
          '31:14–15 — кораническое наставление о родителях',
          'Это хадис именно о несправедливом выделении',
          'современные педагогические рекомендации',
          'не устанавливает конкретный возраст ребёнка',
          'Страх, угрозы, насилие и публичное унижение',
          'В нём присутствует упоминание телесного наказания',
          'современные педагогические рекомендации',
          'не дословные наставления Пророка',
          'не рекомендует телесные наказания',
        ]) {
          assert(contents.includes(phrase),'Child upbringing evidence boundary missing: '+phrase);
        }
      }
      assert.equal(await page.locator('#source-policy').count(),0,'Editorial status must be centralized, not underneath a lesson');
      assert(await page.locator('details summary').count()>=2,'Must have self checks');
      for(const href of lesson.required){
        assert(await page.locator('a[href="'+href+'"]').count()>0,'Missing primary source '+href);
      }
      const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert(dims.scroll<=dims.width+1,'Horizontal overflow '+lesson.file+' at '+viewport.width);
      await page.screenshot({path:'family-'+lesson.file.replace('.html','')+'-'+viewport.width+'.png',fullPage:true});
      await page.goBack({waitUntil:'networkidle'});
      assert.match(await page.locator('h1').textContent(),/Муж и жена/,'Back returns to overview');
    }
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    await page.locator('#reviewBtn').click();
    assert.equal(await page.locator('#family-review-status').count(),1,'Family status must be visible in Sources and Review');
    const reviewText=await page.locator('#family-review-status').innerText();
    assert.match(reviewText,/Независимая содержательная проверка.+не проводилась/,'Review state must be honest');
    assert.deepEqual(errors,[],'No browser JS errors');
    await page.close();
  }
} finally {await browser.close()}
console.log('PASS: four family lessons, primary sources, mobile and desktop navigation');
})().catch(err=>{console.error(err);process.exit(1)});
