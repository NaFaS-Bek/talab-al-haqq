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
       getVoices(){return [
         {name:'Anna',lang:'ru-RU',voiceURI:'test-female',default:true,localService:true},
         {name:'Pavel',lang:'ru-RU',voiceURI:'test-male',default:false,localService:true}
       ]},
       addEventListener(){},
       speak(utterance){
         this.speaking=true;
         window.__currentSpeech=utterance;
         window.__spokenChunks.push({text:utterance.text,lang:utterance.lang,rate:utterance.rate,pitch:utterance.pitch,voice:utterance.voice?.voiceURI||null});
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
   assert.equal(await page.locator('article[data-story]').count(),18);
   assert.equal(await visible.count(),18,'All eighteen articles must be visible initially');
   await page.locator('#story-search').fill('Юсуф');
   assert.equal(await visible.count(),1,'Search must find Yusuf');
   assert.equal(await visible.first().getAttribute('id'),'story-yusuf');
   await page.locator('#story-category').selectOption('trust');
   assert.equal(await visible.count(),0,'Combined mismatching filters should show zero');
   assert(await page.locator('#story-empty').isVisible(),'Missing empty result');
   await page.locator('#story-reset').click();
   assert.equal(await visible.count(),18,'Reset must show all eighteen stories');
   for(const [category,expectedIds] of [
    ['family',['story-ibrahim','story-maryam','story-nuh','story-zakariya','story-ibrahim-father','story-musa-harun']],
    ['wisdom',['story-luqman','story-sulayman-ant','story-saba-queen','story-musa-servant']],
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

   // Unapproved or absent MP3 must not trigger a request or expose a player.
   assert.equal(await page.locator('#audio-studio-track').count(),1);
   assert(await page.locator('#audio-studio').isHidden());
   assert.equal(await page.locator('#audio-studio-track').getAttribute('src'),null);
   await page.evaluate(()=>{
     const audio=document.getElementById('audio-studio-track');
     Object.defineProperty(audio,'duration',{configurable:true,value:60});
     audio.dispatchEvent(new Event('loadedmetadata'));
   });
   assert(await page.locator('#audio-studio').isHidden(),'Metadata is not editorial approval');

   // Voice API is mocked: tests UI orchestration, not the quality of a real voice.
   assert.equal(await page.locator('.story-listen').count(),18);
   await page.locator('#story-yusuf .story-listen').click();
   assert(await page.locator('#audio-player').isVisible(),'Audio player opens from story button');
   let spoken=await page.evaluate(()=>window.__spokenChunks);
   assert(spoken[0].text.includes('Юсуф'),'Read selected story title first');
   assert.equal(spoken[0].lang,'ru-RU');
   assert.equal(spoken[0].voice,'test-male','Prefer named Russian male voice over female default');
   assert.equal(spoken[0].pitch,0.82,'Low pitch default');
   assert.equal(spoken[0].rate,0.85,'Calm pace default');
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
   await page.locator('#audio-pitch').selectOption('0.72');
   await page.locator('#audio-voice').selectOption('test-female');
   await page.locator('#audio-preview').click();
   spoken=await page.evaluate(()=>window.__spokenChunks);
   assert(spoken[spoken.length-1].text.includes('пример спокойного чтения'),'Preview sample');
   assert.equal(spoken[spoken.length-1].voice,'test-female','Manual voice selection overrides male preference');
   assert.equal(spoken[spoken.length-1].pitch,0.72,'Low pitch preview');
   await page.locator('#audio-voice').selectOption('auto');
   await page.locator('#audio-stop').click();
   assert(await page.locator('#audio-player').isHidden(),'Stop closes player');
   assert.equal(await page.locator('.audio-active').count(),0,'Stop clears highlights');
   await page.locator('#story-yusuf .story-listen').click();
   await page.evaluate(()=>document.getElementById('audio-studio-track').dispatchEvent(new Event('play')));
   assert(await page.locator('#audio-player').isHidden(),'Recorded playback stops browser TTS');
   await page.evaluate(()=>{
     const audio=document.getElementById('audio-studio-track');
     window.__studioPauses=0;
     Object.defineProperty(audio,'paused',{configurable:true,value:false});
     audio.pause=()=>window.__studioPauses++;
   });
   await page.locator('#audio-settings').click();
   await page.locator('#audio-preview').click();
   assert(await page.evaluate(()=>window.__studioPauses)>0,'Preview stops recorded playback');
   await page.locator('#audio-stop').click();
   await page.locator('#story-category').selectOption('kindness');
   await page.locator('#audio-play-visible').click();
   spoken=await page.evaluate(()=>window.__spokenChunks);
   assert(spoken[spoken.length-1].text.includes('Муса у водопоя'),'Read all respects visible story filter');
   await page.locator('#audio-stop').click();
   await page.locator('#story-reset').click();

   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
   assert.equal(overflow,false,'Horizontal overflow at '+viewport.width);
   assert.deepEqual(errors,[],'JS error on eighteen-story page');
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   await page.locator('#screen .hero h1').waitFor({state:'visible'});
   assert(await page.locator('#screen a[href="stories.html"]').count()>0,'Homepage stories link');
   await page.locator('.bottom [data-tab="library"]').click();
   await page.locator('[data-knowledge-group="prophet"]').click();
   assert.equal(await page.locator('#screen a[href="stories.html"]').count(),1,'Prophet knowledge link');
   await page.close();
  }
  console.log('PASS: eighteen story texts, read-aloud UI, filters, details, search, navigation and mobile/desktop widths');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
