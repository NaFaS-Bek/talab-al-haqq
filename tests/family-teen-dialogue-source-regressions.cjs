'use strict';
// Structural and attribution checks, NOT theological, clinical or child-safety certification.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-teen-dialogue.html','utf8');
const ids=[...html.matchAll(/<section class="card" id="(teen-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(ids,Array.from({length:9},(_,i)=>'teen-'+(i+1)),'9 ordered teen lessons required');
for(const id of ids)assert(html.includes('href="#'+id+'"'),'No navigation anchor '+id);
assert.equal((html.match(/<details>/g)||[]).length,5,'Five self-checks required');
const links=[
'https://quran.com/31/13-19','https://quran.com/31/14-15',
'https://quran.com/49/12','https://quran.com/49/11',
'https://quran.com/16/125','https://quran.com/20/132',
'https://sunnah.com/bukhari:5376','https://sunnah.com/bukhari:6125',
'https://www.unicef.org/parenting/child-care/11-tips-communicating-your-teen',
'https://www.unicef.org/parenting/mental-health/teens-risky-behaviours',
'https://www.unicef.org/parenting/child-care/how-discipline-your-child-smart-and-healthy-way',
'https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health',
'https://www.unicef.org/parenting/mental-health/when-help-your-teen-find-mental-health-support'
];
for(const url of links)assert(html.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'),'Missing/unsafe source '+url);
for(const phrase of [
'31:14–15 — отдельное кораническое наставление о родителях',
'Хадис говорит именно о трапезе с ребёнком',
'современные педагогические рекомендации, не дословные хадисы',
'Он обращён к верующим в целом и не устанавливает готовое правило о проверке телефона подростка',
'не следует объявлять специальной инструкцией исключительно для родителей',
'он не устанавливает конкретный возраст ребёнка и не описывает метод принуждения',
'урок не отменяет и не переписывает содержание Абу Дауд 495',
'не религиозные первоисточники',
'Ни один отдельный признак не равен диагнозу',
'При непосредственной опасности для жизни или угрозе самоповреждения',
'не требовать опасного прямого примирения',
])assert(html.includes(phrase),'Missing contextual/safety note '+phrase);
for(const path of ['app.js','family-rights.html','family-children.html','family-child-safety.html','family-child-rights.html','family-parent-duties.html']){
 assert(fs.readFileSync(path,'utf8').includes('href="family-teen-dialogue.html"'),
   'New teen lesson unreachable from '+path);
}
assert(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),'Expert status must be centralized');
console.log('PASS: teen dialogue 9 sections, 5 self-checks, primary/modern sources and navigation');
console.log('NOT CERTIFIED: independent theological, clinical and legal reviews not performed');
