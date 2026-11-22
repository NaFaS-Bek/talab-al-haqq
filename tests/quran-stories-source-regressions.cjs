'use strict';
// Source and attribution regressions; not independent fiqh, tafsir or isnad certification.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('stories.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const expectStories=[
 {id:'story-yusuf',topic:'forgiveness',quran:['12/89','12/90','12/91','12/92'],hadith:[]},
 {id:'story-musa',topic:'trust',quran:['28/7','28/8','28/9','28/10','28/11','28/12','28/13'],hadith:[]},
 {id:'story-ibrahim',topic:'family',quran:['2/125','2/127','2/128','2/129'],hadith:[]},
 {id:'story-maryam',topic:'family',quran:['3/35','3/36','3/37'],hadith:[]},
 {id:'story-luqman',topic:'wisdom',quran:['31/12','31/13','31/14','31/15','31/16','31/17','31/18','31/19'],hadith:[]},
 {id:'story-abubakr',topic:'companions',quran:['9/40'],hadith:['bukhari:3653']},
 {id:'story-abdullah',topic:'companions',quran:[],hadith:['bukhari:6780']}
];
const blocks=[...page.matchAll(/<article\s+class="story"\s+id="([^"]+)"\s+data-story="([^"]+)"[\s\S]*?<\/article>/g)];
assert.equal(blocks.length,7,'Exactly seven source-grounded stories expected');
assert.equal((page.match(/<h1\b/g)||[]).length,1,'Exactly one document h1');
assert.match(page,/<html lang="ru">/);
assert.match(page,/<main\b/);
assert.match(page,/редакционные выводы/i);
assert.match(page,/не дословные переводы и не цитаты священных текстов/);
assert.match(page,/независимая богословская рецензия пока не проведена/);
assert.doesNotMatch(page,/expert_checked|экспертно подтвержден[а-я]*/i);
for(const name of ['story-search','story-category','story-reset','results','story-empty']){
 assert(page.includes('id="'+name+'"'),'Missing UI id '+name);
}
assert(page.includes('role="status" aria-live="polite"'),'Search count needs accessible status');
assert(page.includes('function filterStories()'),'Search controls must have wired logic');
for(const category of ['all','forgiveness','trust','family','wisdom','companions']){
 assert(page.includes('<option value="'+category+'">'),'Missing category option '+category);
}
for(let i=0;i<expectStories.length;i++){
 const spec=expectStories[i],m=blocks[i];
 assert.equal(m[1],spec.id,'Story identity or order changed');
 assert.equal(m[2],spec.topic,'Story category changed: '+spec.id);
 const body=m[0];
 assert(body.includes('Чему учит история — редакционные выводы'),spec.id+': lessons must be editorial');
 assert(body.includes('Подумай и обсуди'),spec.id+': discussion questions missing');
 assert(body.includes('независимая экспертная рецензия не проводилась'),spec.id+': no actual independent reviewer');
 const quran=[...new Set([...body.matchAll(/href="https:\/\/quran\.com\/(\d+\/\d+)"/g)].map(m=>m[1]))].sort();
 assert.deepEqual(quran,spec.quran.slice().sort(),spec.id+': Quran source URLs changed');
 const hadith=[...new Set([...body.matchAll(/href="https:\/\/sunnah\.com\/([^"]+)"/g)].map(m=>m[1]))].sort();
 assert.deepEqual(hadith,spec.hadith.slice().sort(),spec.id+': hadith source URLs changed');
 assert(!/href="https:\/\/(?!quran\.com\/|sunnah\.com\/)/.test(body),spec.id+': new source domain requires review');
 if(spec.hadith.length===0){
  assert(body.includes('Источники: только Коран.'),spec.id+': Quran-only attribution missing');
 }else if(spec.quran.length===0){
  assert(body.includes('Источники: хадис из «Сахих аль-Бухари».'),spec.id+': hadith-only attribution missing');
 }else{
  assert(body.includes('Источники двух разных типов — не смешивать.'),
   spec.id+': separate Quran and hadith attribution missing');
 }
 assert(page.includes('href="#'+spec.id+'"'),spec.id+': page navigation link missing');
}
const luqman=blocks.find(x=>x[1]==='story-luqman')[0];
assert(luqman.includes('31:14–15')&&luqman.includes('не прямая речь Лукмана'),
 'Quran 31:14–15 is Allah addressing people, not direct Luqman dialogue');
assert(!/Пророк Лукман/i.test(luqman),'Do not claim contested prophethood');
const abuBakr=blocks.find(x=>x[1]==='story-abubakr')[0];
assert(abuBakr.includes('В самом аяте спутник не назван по имени'),
 'Quran 9:40 does not name companion; identity from hadith');
assert(abuBakr.includes('за дословную часть коранического аята'),
 'Hadith words may not be attributed directly to Quran 9:40');
const abdullah=blocks.find(x=>x[1]==='story-abdullah')[0];
assert(abdullah.includes('хадис не оправдывает употребление алкоголя')&&abdullah.includes('не позволяет сводить всю личность'),
 'Hadith 6780 must not become an excuse for drinking or a sweeping verdict on the sinner');
assert(!abdullah.includes('Аллах никогда не простит'),'Do not attribute unverifiable final judgment');
assert.equal((app.match(/href="stories\\.html"/g)||[]).length,2,
 'Homepage and prophet knowledge section must both link stories');
assert(index.includes('<a href="stories.html">'),'No-JS fallback link must remain');
const releaseMatch=sw.match(/^const RELEASE = (\{[^\r\n]+\});/m);
assert(releaseMatch,'Offline PWA release must be prepared');
const release=JSON.parse(releaseMatch[1]);
assert.equal(Object.keys(release.resources).length,37,'37 offline assets expected');
for(const p of ['stories.html','app.js','index.html']){
 assert(/^[0-9a-f]{64}$/.test(release.resources[p]||''),'Missing SHA-256 for '+p);
}
console.log('PASS: seven source-grounded stories, Quran/hadith distinction, source URLs, filters, navigation and 37-asset PWA');
console.log('NOT CERTIFIED: independent exegetical, isnad, Arabic, translation or theological review');
