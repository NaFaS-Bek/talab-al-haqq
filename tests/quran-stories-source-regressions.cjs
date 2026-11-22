'use strict';
// Structural provenance checks only: tests cannot independently certify tafsir or history.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('stories.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const expectStories=[
 {id:'story-yusuf',refs:['12/89','12/90','12/91','12/92'],topic:'forgiveness'},
 {id:'story-musa',refs:['28/7','28/8','28/9','28/10','28/11','28/12','28/13'],topic:'trust'},
 {id:'story-ibrahim',refs:['2/125','2/127','2/128','2/129'],topic:'family'}
];
const blocks=[...page.matchAll(/<article\s+class="story"\s+id="([^"]+)"\s+data-story="([^"]+)"[\s\S]*?<\/article>/g)];
assert.equal(blocks.length,3,'Pilot must include three independently sourced stories');
assert.equal((page.match(/<h1\b/g)||[]).length,1,'Exactly one page title');
assert.match(page,/<html lang="ru">/);
assert.match(page,/<main\b/);
assert.match(page,/редакционные выводы/i);
assert.match(page,/не дословный перевод аятов и не хадис/);
assert.match(page,/независимая богословская рецензия пока не проведена/);
assert.doesNotMatch(page,/expert_checked|экспертно подтвержден[а-я]*/i);
assert(page.includes('id="story-search"')&&page.includes('id="story-category"')&&page.includes('id="story-reset"'));
assert(page.includes('role="status" aria-live="polite"'),'Accessible count must be present');
assert(page.includes('function filterStories()'),'Search controls must be wired');
for(let i=0;i<expectStories.length;i++){
 const entry=expectStories[i],m=blocks[i];
 assert.equal(m[1],entry.id,'Wrong article identity');
 assert.equal(m[2],entry.topic,'Wrong story topic');
 const body=m[0];
 assert(body.includes('Чему учит история — редакционные выводы'),entry.id+': lessons not labelled editorial');
 assert(body.includes('Подумай и обсуди'),entry.id+': discussion absent');
 assert(body.includes('Источники: только Коран.'),entry.id+': source class must be explicit');
 assert(body.includes('независимая экспертная рецензия не проводилась'),entry.id+': no false expert approval');
 const actual=[...new Set([...body.matchAll(/href="https:\/\/quran\.com\/(\d+\/\d+)"/g)].map(m=>m[1]))].sort();
 assert.deepEqual(actual,entry.refs.slice().sort(),entry.id+': Quran verse references drifted');
 assert(!/href="https:\/\/(?!quran\.com\/)/.test(body),entry.id+': non-Quran sources need their own editorial class');
}
assert(app.includes('href="stories.html"'),'Homepage/knowledge navigation must link the pilot');
assert.equal((app.match(/href="stories\.html"/g)||[]).length,2,'Expected homepage and prophet knowledge links');
assert(index.includes('<a href="stories.html">'),'No-JS fallback must link the page');
const releaseMatch=sw.match(/^const RELEASE = (\{[^\r\n]+\});/m);
assert(releaseMatch,'No prepared PWA release in sw.js');
const release=JSON.parse(releaseMatch[1]);
assert.equal(Object.keys(release.resources).length,37,'New stories page must be in full verified release');
for(const asset of ['stories.html','app.js','index.html']){
 assert(/^[a-f0-9]{64}$/.test(release.resources[asset]||''),'Missing SHA256 for '+asset);
}
console.log('PASS 3 Quran-only stories, exact verse URLs, source/editorial boundaries, search and navigation; 37-asset PWA manifest');
console.log('NOT CERTIFIED: independent religious scholarship, interpretation or language review');
