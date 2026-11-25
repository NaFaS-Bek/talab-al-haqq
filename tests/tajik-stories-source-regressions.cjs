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
assert.deepEqual(Object.keys(nameMeanings),catalog.names.names.slice(0,99).map(n=>n.id));
for(const [id,t] of Object.entries(nameMeanings)){
 const n=catalog.names.names.find(x=>x.id===id);
 assert.equal(t.arabic,n.arabic);assert.equal(t.sourceUrl,n.nameSource.url);assert.equal(t.sourceBasis,n.nameSource.basisNote);assert.equal(t.duaArabic,n.supplication.arabic);assert.equal(n.supplication.kind,'personal');assert(t.meaning&&t.explanation&&t.dua&&t.basis);
}
assert.match(nameMeanings.name_018.basis,/шубҳа/);
console.log('PASS: all 99 names, personal supplications, exact source guards and disputed-name caveat');

assert.match(nameMeanings.name_083.basis,/заиф/);
assert.match(nameMeanings.name_096.basis,/шубҳа/);
assert.match(nameMeanings.name_099.basis,/шумораи такрор/);

 // Family overview: compare references, anchors and explicit boundaries.
 {
 const r=fs.readFileSync('family-rights.html','utf8'),g=fs.readFileSync('family-rights-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));
 assert.equal(urls(g).length,17);
 assert.deepEqual(ids(g),ids(r));
 assert.match(g,/<html lang="tg">/);
 assert(g.includes('Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст'));
 assert(g.includes('Ин дарс фатво нест'));
 assert(g.includes('Ҳангоми таҳдид ё зӯроварӣ амният'));
 assert(g.includes('data-tg-family-complete')); assert(!g.includes('data-tg-family-pending'));
 assert.equal((g.match(/href="family-[^"]+\.html" hreflang="ru"><strong>/g)||[]).length,0);
 assert(r.includes('href="family-rights-tg.html"'));
 assert(g.includes('href="family-rights.html"'));
 const m=JSON.parse(fs.readFileSync('sw.js','utf8').match(/^const RELEASE = (\{[^\r\n]+\});/m)[1]);
 assert(m.resources['family-rights-tg.html']);
 console.log('PASS: family overview source and anchor parity, safety and translation disclosures');
 }

{
 const r=fs.readFileSync('family-nikah.html','utf8'),g=fs.readFileSync('family-nikah-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));
 assert.equal(urls(g).length,5);
 assert.deepEqual(ids(g),ids(r));
 assert.equal((g.match(/<details>/g)||[]).length,2);
 assert.equal((g.match(/<li>/g)||[]).length,4);
 assert.match(g,/<html lang="tg">/);
 assert(g.includes('Розигии ихтиёрии ҳар ду тараф'));
 assert(g.includes('тарс, фишор ё таҳдид'));
 assert(g.includes('мазҳаби фиқҳӣ ва қонуни маҳаллӣ'));
 assert(g.includes('Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст'));
 assert(g.includes('href="family-rights-tg.html"'));
 assert(r.includes('href="family-nikah-tg.html"'));
 assert(fs.readFileSync('family-rights-tg.html','utf8').includes('href="family-nikah-tg.html" hreflang="tg"'));
 const m=JSON.parse(fs.readFileSync('sw.js','utf8').match(/^const RELEASE = (\{[^\r\n]+\});/m)[1]);
 assert(m.resources['family-nikah-tg.html']);
 console.log('PASS: Tajik nikah lesson, exact source and anchor parity, consent and legal caveats');
}

{
 const r=fs.readFileSync('family-mahr.html','utf8'),g=fs.readFileSync('family-mahr-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));
 assert.equal(urls(g).length,8);
 assert.deepEqual(ids(g),ids(r));
 assert.equal((g.match(/<details>/g)||[]).length,3);
 assert.equal((g.match(/<li>/g)||[]).length,4);
 assert.match(g,/<html lang="tg">/);
 assert(g.includes('бо хоҳиши худ гузашт кунад, на зери фишор'));
 assert(g.includes('Қоидаи нисфи маҳри муқарраршударо ба ҳар гуна талоқ пеш аз наздикӣ татбиқ кардан мумкин нест'));
 assert(g.includes('андозаи маҳр ҳанӯз муайян нашуда буд'));
 assert(g.includes('Ин меъёри ягона барои ҳама нест'));
 assert(g.includes('Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст'));
 assert(r.includes('href="family-mahr-tg.html"'));
 for(const p of ['family-rights-tg.html','family-nikah-tg.html']) assert(fs.readFileSync(p,'utf8').includes('href="family-mahr-tg.html" hreflang="tg"'));
 const m=JSON.parse(fs.readFileSync('sw.js','utf8').match(/^const RELEASE = (\{[^\r\n]+\});/m)[1]);
 assert(m.resources['family-mahr-tg.html']);
 console.log('PASS: Tajik mahr, source and anchor parity, voluntary waiver and distinct divorce cases');
}

{
 const r=fs.readFileSync('family-children.html','utf8'),g=fs.readFileSync('family-children-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));
 assert.equal(urls(g).length,21);
 assert.deepEqual(ids(g),ids(r));
 assert.equal((g.match(/<details>/g)||[]).length,6);
 assert.equal((g.match(/data-age-stage=/g)||[]).length,3);
 assert.equal((g.match(/class="example"/g)||[]).length,9);
 assert.match(g,/<html lang="tg">/);
 for(const phrase of ['на идомаи сухани мустақими Луқмон','Ин дарс ҷазои ҷисмониро тавсия намедиҳад','на иҷмои собитшуда','Тавсияҳои тиббӣ ва тафсири динӣ-фиқҳии ҳадис ду навъи гуногуни сарчашмаанд','меъёри динӣ нестанд','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст']) assert(g.includes(phrase),phrase);
 assert(g.includes('href="family-child-safety-tg.html#safety-3" hreflang="tg"'));
 assert(g.includes('href="family-difficult-passages.html#difficult-5" hreflang="ru"'));
 assert(r.includes('href="family-children-tg.html"'));
 for(const p of ['family-rights-tg.html','family-nikah-tg.html','family-mahr-tg.html','family-children-tg.html']) if(p!=='family-children-tg.html') assert(fs.readFileSync(p,'utf8').includes('href="family-children-tg.html" hreflang="tg"'));
 const m=JSON.parse(fs.readFileSync('sw.js','utf8').match(/^const RELEASE = (\{[^\r\n]+\});/m)[1]);
 assert(m.resources['family-children-tg.html']);
 console.log('PASS: Tajik child upbringing lesson, sources, age stages, attribution and safeguarding');
}

{
 const r=fs.readFileSync('family-child-rights.html','utf8'),g=fs.readFileSync('family-child-rights-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r)); assert.equal(urls(g).length,12);
 assert.deepEqual(ids(g),ids(r)); assert.equal((g.match(/<details>/g)||[]).length,5);
 assert.equal((g.match(/class="example"/g)||[]).length,4);
 for(const phrase of ['Тасвири таҳник тавсияи тиббӣ','на идомаи сухани мустақими Луқмон','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст','на дастур барои худсарона']) assert(g.includes(phrase),phrase);
 for(const p of ['family-rights-tg.html','family-children-tg.html']) assert(fs.readFileSync(p,'utf8').includes('href="family-child-rights-tg.html" hreflang="tg"'));
 assert(r.includes('href="family-child-rights-tg.html"')); assert(g.includes('href="family-child-rights.html"'));
 console.log('PASS: Tajik child rights, source/anchor parity, medical and legal boundaries');
}

{
 const r=fs.readFileSync('family-parent-duties.html','utf8'),g=fs.readFileSync('family-parent-duties-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r)); assert.equal(urls(g).length,14);
 assert.deepEqual(ids(g),ids(r)); assert.equal((g.match(/<details>/g)||[]).length,5);
 assert.equal((g.match(/class="example"/g)||[]).length,4);assert.equal((g.match(/<li>/g)||[]).length,4);
 for(const phrase of ['на иҷмои тасдиқшудаи ҳамаи ҷамоатҳои шиа ё исмоилӣ','мерос пас аз марг масъалаи дигари ҳуқуқист','Маводи дуюмдараҷаи ҳуқуқӣ, на Қуръон ва на ҳадис','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст']) assert(g.includes(phrase),phrase);
 for(const p of ['family-rights-tg.html','family-children-tg.html','family-child-rights-tg.html']) assert(fs.readFileSync(p,'utf8').includes('href="family-parent-duties-tg.html" hreflang="tg"'));
 assert(r.includes('href="family-parent-duties-tg.html"'));assert(g.includes('href="family-parent-duties.html"'));
 console.log('PASS: Tajik parental duties, source/anchor parity, school-specific attribution and gift/inheritance distinction');
}

{
 const r=fs.readFileSync('family-custody.html','utf8'),g=fs.readFileSync('family-custody-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));assert.equal(urls(g).length,15);
 assert.deepEqual(ids(g),ids(r));assert.equal((g.match(/<details>/g)||[]).length,5);
 assert.equal((g.match(/class="example"/g)||[]).length,4);assert.equal((g.match(/<li>/g)||[]).length,3);
 for(const phrase of ['«ҳасан» аз ҷониби Албонӣ','«саҳеҳ» аз ҷониби Албонӣ','қуръапартоӣ','агар ҷудоӣ ба кӯдак зарар расонад, он ҷоиз нест','мавқеи як фақеҳи мушаххаси ҷаъфарӣ','Робитаи хатарнокро ба хотири шиори умумӣ таҳмил кардан мумкин нест','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст']) assert(g.includes(phrase),phrase);
 for(const p of ['family-rights-tg.html','family-child-rights-tg.html','family-parent-duties-tg.html']) assert(fs.readFileSync(p,'utf8').includes('href="family-custody-tg.html" hreflang="tg"'));
 assert(r.includes('href="family-custody-tg.html"'));assert(g.includes('href="family-custody.html"'));
 console.log('PASS: Tajik custody, exact source/anchor parity, named legal positions and safety boundaries');
}

{
 const r=fs.readFileSync('family-child-safety.html','utf8'),g=fs.readFileSync('family-child-safety-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));assert.equal(urls(g).length,16);
 assert.deepEqual(ids(g),ids(r));assert.equal((g.match(/<details>/g)||[]).length,5);
 assert.equal((g.match(/class="example"/g)||[]).length,2);assert.equal((g.match(/<li>/g)||[]).length,3);
 for(const phrase of ['Махфияти мутлақро ваъда надиҳед','Ҳангоми таҳдиди бевосита ба ҳаёт ва саломатӣ','тасвирҳоро нафиристед, нашр накунед ва паҳн накунед','ҷойгузини ҳифзи касбӣ ё тафтишот нест','Ин сарчашмаи таърихию динӣ аст','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст']) assert(g.includes(phrase),phrase);
 for(const p of ['family-rights-tg.html','family-children-tg.html','family-child-rights-tg.html','family-parent-duties-tg.html','family-custody-tg.html']) assert(fs.readFileSync(p,'utf8').includes('href="family-child-safety-tg.html" hreflang="tg"'));
 assert(g.includes('href="family-children-tg.html#section-5" hreflang="tg"'));
 assert(g.includes('href="family-difficult-passages.html#difficult-5" hreflang="ru"'));
 console.log('PASS: Tajik child safety, source/anchor parity, reporting, confidentiality and evidence boundaries');
}

{
 const r=fs.readFileSync('family-teen-dialogue.html','utf8'),g=fs.readFileSync('family-teen-dialogue-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));assert.equal(urls(g).length,16);
 assert.deepEqual(ids(g),ids(r));assert.equal((g.match(/<details>/g)||[]).length,5);
 assert.equal((g.match(/class="example"/g)||[]).length,3);assert.equal((g.match(/<li>/g)||[]).length,8);
 for(const phrase of ['на идомаи сухани мустақими ӯ','дарс мазмуни ҳадиси Абӯдовуд 495-ро бекор ё аз нав наменависад','Ҳеҷ як нишонаи ҷудогона ба ташхис баробар нест','Ҳангоми хатари бевосита ба ҳаёт ё таҳдиди осеб расондан ба худ','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст']) assert(g.includes(phrase),phrase);
 for(const p of ["family-rights-tg.html","family-children-tg.html","family-child-rights-tg.html","family-parent-duties-tg.html","family-custody-tg.html","family-child-safety-tg.html"]) assert(fs.readFileSync(p,'utf8').includes('href="family-teen-dialogue-tg.html" hreflang="tg"'));
 assert(g.includes('href="family-children-tg.html" hreflang="tg"'));assert(g.includes('href="family-child-safety-tg.html" hreflang="tg"'));
 console.log('PASS: Tajik teen dialogue, source/anchor parity, evidence boundaries and emergency support');
}

{
 const r=fs.readFileSync('family-filial-duties.html','utf8'),g=fs.readFileSync('family-filial-duties-tg.html','utf8');
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(urls(g),urls(r));assert.equal(urls(g).length,15);
 assert.deepEqual(ids(g),ids(r));assert.equal((g.match(/<details>/g)||[]).length,5);
 assert.equal((g.match(/class="example"/g)||[]).length,3);assert.equal((g.match(/<li>/g)||[]).length,4);
 for(const phrase of ['на сухани мустақими Луқмон','на иҷмои тасдиқшудаи ҳамаи мазҳабҳои суннӣ','на қоидаи ягонаи ҳамаи шиён, сунниён ё исмоилиён','талаботи таҳаммул кардани зӯроварӣ ё мондан дар хонаи хатарнок нест','Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст']) assert(g.includes(phrase),phrase);
 for(const p of ["family-rights-tg.html","family-children-tg.html","family-child-rights-tg.html","family-parent-duties-tg.html","family-custody-tg.html","family-child-safety-tg.html","family-teen-dialogue-tg.html"]) assert(fs.readFileSync(p,'utf8').includes('href="family-filial-duties-tg.html" hreflang="tg"'));
 assert(g.includes('href="family-child-safety-tg.html" hreflang="tg"'));
 console.log('PASS: Tajik filial duties, source/anchor parity, attribution and safety boundaries');
}

{
 const stems=["family-rights","family-nikah","family-mahr","family-children","family-child-rights","family-parent-duties","family-custody","family-child-safety","family-teen-dialogue","family-filial-duties","family-prophetic-example"];
 const urls=s=>[...s.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(x=>x[1]);
 const ids=s=>[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const manifest=JSON.parse(fs.readFileSync('sw.js','utf8').match(/^const RELEASE = (\{[^\r\n]+\});/m)[1]);
 for(const stem of stems){
  const r=fs.readFileSync(stem+'.html','utf8'),g=fs.readFileSync(stem+'-tg.html','utf8');
  assert.deepEqual(urls(g),urls(r),stem+' source parity');
  assert.deepEqual(ids(g),ids(r),stem+' anchor parity');
  assert.equal((g.match(/<details>/g)||[]).length,(r.match(/<details>/g)||[]).length,stem+' self-check parity');
  assert(g.includes('Бозбинии мустақили забонӣ ва динӣ ҳанӯз анҷом наёфтааст'),stem);
  assert(g.includes('href="'+stem+'.html"'));assert(r.includes('href="'+stem+'-tg.html"'));
  assert(/^[0-9a-f]{64}$/.test(manifest.resources[stem+'-tg.html']||''),stem);
  assert(!/href="family-[^"]+\.html(?:#[^"]+)?" hreflang="ru"/g.test(g.replace(/<header>[\s\S]*?<\/header>/,'' ).replace(/href="family-difficult-passages\.html(?:#[^"]+)?" hreflang="ru"/g,'')),stem+' translated lesson still linked in Russian');
 }
 const g=fs.readFileSync('family-prophetic-example-tg.html','utf8');
 assert.equal(urls(g).length,6);assert.equal((g.match(/<details>/g)||[]).length,2);
 assert(g.includes('на саҳнаи дақиқи таърихӣ'));
 assert(g.includes('href="family-difficult-passages.html#difficult-4" hreflang="ru"'));
 console.log('PASS: eleven main family pages paired; sources, anchors, questions, navigation and review disclosure retained');
}
