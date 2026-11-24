'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('stories-tg.html','utf8');
const ru=fs.readFileSync('stories.html','utf8');
const blocks=s=>[...s.matchAll(/<article class="story" id="([^"]+)"[\s\S]*?<\/article>/g)];
const original=blocks(ru),translated=blocks(source);
assert.equal(original.length,18);
assert.equal(translated.length,18);
assert.deepEqual(translated.map(x=>x[1]),original.map(x=>x[1]),'All stories must map in original order');
assert.match(source,/<html lang="tg">/);
assert.match(source,/Ҳамаи 18 қисса ба тоҷикӣ дастрасанд/);
assert.match(source,/бозгӯии мустақили маънои оятҳо/);
assert.match(source,/ташхиси мустақили коршиносон анҷом наёфтааст/);
assert(source.includes('href="stories.html"'));
assert(source.includes('hreflang="ru"'));
const refs=(html,pattern)=>[...new Set([...html.matchAll(pattern)].map(x=>x[1]))].sort();
for(const [i,[html,id]] of translated.entries()){
 const base=original[i][0];
 const age=base.match(/Для семейного обсуждения: от (\d+) лет/)[1];
 assert(html.includes('Барои муҳокима дар оила: аз '+age+'-солагӣ'),id+' editorial age recommendation missing');
 assert.equal((html.match(/<details>/g)||[]).length,(base.match(/<details>/g)||[]).length,id+' discussion questions mismatch');
 assert(html.includes('Хулосаҳои таҳрирӣ'),id+' missing editorial lessons');
 assert(html.includes('Мақом: бозгӯӣ дар сатҳи таҳрирӣ'),id+' missing status');
 assert(source.includes('href="#'+id+'"'),id+' missing navigation');
 assert.equal((source.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' duplicate ID');
 assert.deepEqual(refs(html,/href="https:\/\/quran\.com\/(\d+\/\d+)"/g),refs(base,/href="https:\/\/quran\.com\/(\d+\/\d+)"/g),id+' Quran reference mismatch');
 assert.deepEqual(refs(html,/href="https:\/\/sunnah\.com\/([^"]+)"/g),refs(base,/href="https:\/\/sunnah\.com\/([^"]+)"/g),id+' hadith reference mismatch');
 if(id!=='story-abubakr')assert(html.includes('Сарчашмаҳо: танҳо Қуръон.'));
}
const abu=translated.find(x=>x[1]==='story-abubakr')[0];
assert(abu.includes('Дар худи оят номи ҳамсафар зикр нашудааст.'));
assert(abu.includes('арзёбии мустақили иснодро анҷом надодааст'));
assert.deepEqual(refs(abu,/href="https:\/\/sunnah\.com\/([^"]+)"/g),['bukhari:3653']);
assert(translated.find(x=>x[1]==='story-musa-servant')[0].includes('ба одамони одӣ ҳуқуқ намедиҳад'));
console.log('PASS: 18 Tajik stories, matching order, Quran and hadith sources, navigation and editorial disclosures');
console.log('NOT CERTIFIED: independent literary Tajik and theological proofreading');

// Bilingual five-pillar lessons: source links and Arabic text must remain unchanged.
for(const stem of ['five-pillars','pillar-shahada','pillar-salah','pillar-zakat','pillar-sawm','pillar-hajj']){
 const r=fs.readFileSync(stem+'.html','utf8'),g=fs.readFileSync(stem+'-tg.html','utf8');
 const urls=s=>[...new Set([...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]))].sort();
 const arabic=s=>[...s.matchAll(/<[^>]*lang="ar"[^>]*>([\s\S]*?)<\/[^>]+>/g)].map(x=>x[1]);
 assert.match(g,/<html lang="tg">/);
 assert.deepEqual(urls(r),urls(g),stem+' source link mismatch');
 assert.deepEqual(arabic(r),arabic(g),stem+' Arabic changed');
 assert(g.includes('Бозбинии мустақили'));
 assert(g.includes('i18n.js'));
 const m=JSON.parse(fs.readFileSync('sw.js','utf8').match(/^const RELEASE = (\{[^\r\n]+\});/m)[1]);
 assert(m.resources[stem+'-tg.html'],stem+' not in offline manifest');
}
console.log('PASS: five pillars overview and five lessons, Arabic and source parity');

for(const stem of ['wudu-steps','salah-steps','arabic-reading-signs']){
 const r=fs.readFileSync(stem+'.html','utf8'),g=fs.readFileSync(stem+'-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const arabic=s=>[...s.matchAll(/<[^>]*lang="ar"[^>]*>([\s\S]*?)<\/[^>]+>/g)].map(x=>x[1]);
 assert.deepEqual(urls(r),urls(g),stem+' sources changed');
 assert.deepEqual(arabic(r),arabic(g),stem+' Arabic changed');
 assert.equal((r.match(/class="step"/g)||[]).length,(g.match(/class="step"/g)||[]).length,stem+' steps changed');
 assert.equal((r.match(/<details>/g)||[]).length,(g.match(/<details>/g)||[]).length,stem+' FAQs changed');
 assert(g.includes('бозбинии мустақили'));
}

// Editorial meanings are bound to exact source text and source links.
const catalog=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const duaRecords=[...catalog.catalog.entries,...catalog.catalog_additions.entries];
const meanings=JSON.parse(fs.readFileSync('app.js','utf8').match(/const tajikDuaMeanings = Object\.freeze\((\{[\s\S]*?\})\);/)[1]);
const dailyIds=[...new Set(catalog.library.collections.filter(c=>['morning','evening','daily'].includes(c.id)).flatMap(c=>c.entryIds))].sort();
const prophetIds=duaRecords.filter(x=>x.categoryIds.includes('prophets')||['q_7_23','q_27_19'].includes(x.id)).map(x=>x.id);
assert.equal(prophetIds.length,13);
assert.equal(duaRecords.length,43);
assert.deepEqual(Object.keys(meanings).sort(),duaRecords.map(x=>x.id).sort());
for(const [id,m] of Object.entries(meanings)){
 const e=duaRecords.find(x=>x.id===id);
 assert.equal(m.arabicText,e.arabicText);
 assert.deepEqual(m.sourceUrls,e.sourceRefs.map(s=>s.url));
 assert(m.title && m.meaning && m.context);
 if(m.segments){
  assert.deepEqual(Object.keys(m.segments),e.segments.map(s=>s.id));
  for(const s of e.segments) assert.equal(m.segments[s.id].arabicText,s.arabicText);
 }
}
console.log('PASS: all 43 Tajik meanings, exact Arabic and source guards');

assert.equal(dailyIds.length,18);
assert.equal(catalog.library.collections.find(c=>c.id==='daily').entryIds.length,10);
assert.deepEqual(duaRecords.find(e=>e.id==='h_muslim_2727a').repetitionRule.stages.map(s=>s.count),[34,33,33]);

assert.equal(Object.values(meanings).reduce((n,x)=>n+Object.keys(x.segments||{}).length,0),42);
assert.deepEqual(duaRecords.find(e=>e.id==='h_muslim_2202').repetitionRule.stages.map(s=>s.count),[3,7]);

const nameMeanings=JSON.parse(fs.readFileSync('app.js','utf8').match(/const tajikNameMeanings = Object\.freeze\((\{[\s\S]*?\})\);/)[1]);
assert.equal(catalog.names.names.length,99);
assert.deepEqual(Object.keys(nameMeanings),catalog.names.names.slice(0,80).map(n=>n.id));
for(const [id,t] of Object.entries(nameMeanings)){
 const n=catalog.names.names.find(x=>x.id===id);
 assert.equal(t.arabic,n.arabic);assert.equal(t.sourceUrl,n.nameSource.url);assert.equal(t.sourceBasis,n.nameSource.basisNote);assert.equal(t.duaArabic,n.supplication.arabic);assert.equal(n.supplication.kind,'personal');assert(t.meaning&&t.explanation&&t.dua&&t.basis);
}
assert.match(nameMeanings.name_018.basis,/шубҳа/);
console.log('PASS: first 80 names, personal supplications, exact source guards and disputed-name caveat');
