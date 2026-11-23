'use strict';
// Browser regression for story filtering and route access, not theological review.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
   const page=await browser.newPage({viewport,serviceWorkers:'block'});
   await page.addInitScript(()=>{
     window.__spokenChunks=[];
     const fake={
       speaking:false,paused:false,
       getVoices(){return [{name:'Тестовый русский',lang:'ru-RU',voiceURI:'test-ru',default:true,localService:true}]},
       addEventListener(){},
       speak(utterance){
         this.speaking=true;
         window.__currentSpeech=utterance;
         window.__spokenChunks.push({text:utterance.text,lang:utterance.lang,rate:utterance.rate});
       },
       cancel(){this.speaking=false;this.paused=false},
       pause(){this.paused=true},
       resume(){this.paused=false}
     };
     Object.defineProperty(window,'speechSynthesis',{configurable:true,value:fake});
     Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{
       constructor(text){this.text=text}
     }});
   });
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

   // Voice API is mocked: tests UI orchestration, not the quality of a real voice.
   assert.equal(await page.locator('.story-listen').count(),15);
   await page.locator('#story-yusuf .story-listen').click();
   assert(await page.locator('#audio-player').isVisible(),'Audio player opens from story button');
   let spoken=await page.evaluate(()=>window.__spokenChunks);
   assert(spoken[0].text.includes('Юсуф'),'Read selected story title first');
   assert.equal(spoken[0].lang,'ru-RU');
   assert(await page.locator('#story-yusuf .audio-active').count()>0,'Read-aloud highlights its fragment');
   await page.evaluate(()=>window.__currentSpeech.onend());
   spoken=await page.evaluate(()=>window.__spokenChunks);
   assert(spoken.length>=2,'Next fragment is queued');
   assert(!spoken.some(x=>x.text.includes('Источник:')),'No source metadata in audio');
   await page.locator('#audio-pause').click();
   assert.equal(await page.locator('#audio-pause').innerText(),'▶ Продолжить');
   assert(await page.evaluate(()=>window.speechSynthesis.paused),'Pause sent to speech engine');
   await page.locator('#audio-pause').click();
   assert(!await page.evaluate(()=>window.speechSynthesis.paused),'Resume sent to speech engine');
   await page.locator('#audio-stop').click();
   assert(await page.locator('#audio-player').isHidden(),'Stop closes player');
   assert.equal(await page.locator('.audio-active').count(),0,'Stop clears highlights');
   await page.locator('#story-category').selectOption('kindness');
   await page.locator('#audio-play-visible').click();
   spoken=await page.evaluate(()=>window.__spokenChunks);
   assert(spoken[spoken.length-1].text.includes('Муса у водопоя'),'Read all respects visible story filter');
   await page.locator('#audio-stop').click();
   await page.locator('#story-reset').click();

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
  console.log('PASS: fifteen story texts, read-aloud UI, filters, details, search, navigation and mobile/desktop widths');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
