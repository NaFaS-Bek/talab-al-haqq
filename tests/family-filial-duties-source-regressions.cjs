'use strict';
// These are structural/attribution guards, NOT certified fiqh, legal or clinical review.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-filial-duties.html','utf8');
const ids=[...html.matchAll(/<section class="card" id="(filial-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(ids,Array.from({length:9},(_,i)=>'filial-'+(i+1)),'Need nine ordered lesson sections');
for(const id of ids)assert(html.includes('href="#'+id+'"'),'Missing navigation anchor: '+id);
assert.equal((html.match(/<details>/g)||[]).length,5,'Need five questions');
const urls=[
'https://quran.com/17/23','https://quran.com/17/24','https://quran.com/31/14','https://quran.com/31/15',
'https://sunnah.com/bukhari:5971','https://sunnah.com/bukhari:2620','https://sunnah.com/bukhari:7257',
'https://seekersguidance.org/answers/general-counsel/obeying-ones-parents-and-maintaining-ties-of-kinship/',
'https://seekersguidance.org/answers/general-counsel/can-i-pursue-a-career-that-goes-against-my-parents-wishes/',
'https://al-islam.org/contemporary-legal-rulings-shii-law-sayyid-ali-hussaini-sistani/b-muamalat',
'https://www.who.int/news-room/fact-sheets/detail/abuse-of-older-people',
'https://www.who.int/news-room/fact-sheets/detail/violence-against-children'
];
for(const u of urls)assert(html.includes('href="'+u+'" target="_blank" rel="noopener noreferrer"'),'Missing/unsafe evidence '+u);
for(const phrase of [
'31:14–15 — отдельное кораническое обращение, не прямая речь Лукмана',
'не устанавливает универсальную таблицу денежных долей',
'Хадис описывает определённый случай',
'Контекст хадиса — распоряжение военного командира',
'не удостоверенный консенсус всех суннитских школ',
'не единое правило всех шиитов, суннитов или исмаилитов',
'Вторичные правовые источники',
'конкретную сумму обязательного содержания нельзя вывести только из 17:23–24',
'современная система охраны здоровья, не религиозный первоисточник',
'не является требованием терпеть насилие или оставаться в опасном доме',
'не дословные аяты и не готовые юридические инструкции'
])assert(html.includes(phrase),'Missing evidentiary or safety caveat: '+phrase);
for(const p of ['app.js','family-rights.html','family-parent-duties.html','family-teen-dialogue.html','family-child-safety.html','family-children.html'])
 assert(fs.readFileSync(p,'utf8').includes('href="family-filial-duties.html"'),'Missing family link '+p);
assert(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),'No fabricated expert certificate');
console.log('PASS: parent respect 9 sections, 5 self-checks, source limits and family links');
console.log('NOT CERTIFIED: no independent religious, legal or clinical review');
