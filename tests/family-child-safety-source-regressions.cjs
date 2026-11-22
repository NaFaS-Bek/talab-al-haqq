'use strict';
// Structural/source boundary regression test, not an expert child-safety certification.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('family-child-safety.html','utf8');
const ids=[...html.matchAll(/<section class="card" id="(safety-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(ids,Array.from({length:8},(_,i)=>'safety-'+(i+1)));
for(const id of ids)assert(html.includes('href="#'+id+'"'),'Navigation missing '+id);
assert.equal((html.match(/<details>/g)||[]).length,5);
const links=[
'https://quran.com/16/90','https://quran.com/4/135','https://quran.com/49/11',
'https://sunnah.com/bukhari:5997','https://sunnah.com/bukhari:2444',
'https://www.who.int/news-room/fact-sheets/detail/violence-against-children',
'https://www.who.int/news-room/fact-sheets/detail/child-maltreatment',
'https://www.who.int/news-room/fact-sheets/detail/corporal-punishment-and-health',
'https://www.tusla.ie/children-first/mandated-persons/how-should-i-deal-with-a-disclosure-of-abuse-from-a-child/',
'https://aifs.gov.au/resources/practice-guides/responding-children-and-young-peoples-disclosures-abuse',
'https://www.unicef.org/parenting/child-care/what-to-do-if-your-child-is-experiencing-cyberbullying',
'https://www.unicef.org/parenting/child-care/how-talk-school-about-bullying'
];
for(const url of links)assert(html.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'),'Missing source '+url);
for(const phrase of [
'обращены шире, чем только к теме детей',
'прекращение им притеснения',
'не религиозные первоисточники',
'Аят адресован верующим в целом',
'современные педагогические рекомендации, не дословные хадисы',
'Не обещать абсолютную тайну',
'не Коран и не хадисы',
'При непосредственной угрозе жизни и здоровью',
'не заменяет профессиональную защиту или расследование',
'не пересылать, не публиковать и не распространять изображения',
'не дословные цитаты из Корана, хадисов и не юридические инструкции для всех стран',
])assert(html.includes(phrase),'Missing boundary/safety note: '+phrase);
for(const path of ['app.js','family-rights.html','family-children.html','family-child-rights.html','family-custody.html']){
assert(fs.readFileSync(path,'utf8').includes('href="family-child-safety.html"'),'Missing lesson link in '+path);
}
assert(!/expert_checked|id="source-policy"|проверено экспертом/.test(html),'Expert approval must not be fabricated');
console.log('PASS: child-safety lesson structure, 12 source links, safeguarding boundaries and navigation');
console.log('NOT CERTIFIED: editorial check only');
