'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const lessons=[
  {file:'family-nikah.html',title:/Никах/,required:['https://quran.com/24/32','https://sunnah.com/bukhari:5136']},
  {file:'family-mahr.html',title:/Махр/,required:['https://quran.com/4/4','https://sunnah.com/bukhari:5150']},
  {file:'family-children.html',title:/Воспитание детей/,required:['https://quran.com/31/13','https://sunnah.com/bukhari:5997']},
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
