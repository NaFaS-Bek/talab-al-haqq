'use strict';
// Deep pass 10 tests defend source-context attribution. Not a theological or legal certification.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const pages={
 nikah:fs.readFileSync('family-nikah.html','utf8'),
 rights:fs.readFileSync('family-rights.html','utf8'),
 children:fs.readFileSync('family-children.html','utf8'),
 custody:fs.readFileSync('family-custody.html','utf8'),
 filial:fs.readFileSync('family-filial-duties.html','utf8'),
};
function section(html,id){
 const start=html.indexOf('<section class="card" id="'+id+'">');
 assert(start>=0,'Missing source section '+id);
 const end=html.indexOf('</section>',start);
 assert(end>start,'Section boundary missing '+id);
 return html.slice(start,end);
}
const checks=[
 {html:pages.nikah,section:'',source:'https://sunnah.com/bukhari:5136',must:[
 'В аль-Бухари 5136 отдельно говорится о совете с ранее состоявшей в браке женщиной',
 'молчание как выражение разрешения',
 'молчание согласием в ситуации страха, давления или угроз'
 ]},
 {html:pages.rights,section:'wife',source:'https://sunnah.com/muslim:1218a',must:[
 'В полной версии Муслим 1218a также говорится о взаимных супружеских правах',
 'сложный дисциплинарный фрагмент',
 'не превращает его в инструкцию или оправдание насилия'
 ]},
 {html:pages.rights,section:'wife',source:'https://sunnah.com/bukhari:5199',must:[
 'о правах тела, глаз и жены',
 'конкретное наставление о балансе поклонения и обязанностей'
 ]},
 {html:pages.custody,section:'custody-3',source:'https://sunnah.com/abudawud:2277',must:[
 'сначала прозвучало предложение решить спор жребием',
 'ребёнок выбрал мать',
 'Обе детали присутствуют в исходном сообщении'
 ]},
 {html:pages.custody,section:'custody-3',source:'https://sunnah.com/abudawud:2276',must:[
 'пока она не вступит в новый брак',
 '«хасан» аль-Альбани'
 ]},
 {html:pages.children,section:'section-5',source:'https://sunnah.com/abudawud:495',must:[
 'В нём присутствует упоминание телесного наказания',
 '«хасан сахих» аль-Альбани',
 'этот урок не рекомендует телесные наказания'.replace('этот','Этот')
 ]},
 {html:pages.filial,section:'filial-4',source:'https://sunnah.com/bukhari:7257',must:[
 'приказ военного командира своим людям войти в разожжённый им огонь',
 'не частный спор родителей со взрослым ребёнком'
 ]}
];
for(const c of checks){
 const s=c.section?section(c.html,c.section):c.html;
 assert(s.includes('href="'+c.source+'" target="_blank" rel="noopener noreferrer"'),
  c.source+' must be linked in relevant source context');
 for(const phrase of c.must)assert(s.includes(phrase),'Missing exact-source caveat: '+phrase);
}
const overview=pages.rights;
for(const source of ['https://sunnah.com/bukhari:5364','https://sunnah.com/bukhari:5200','https://quran.com/4/34'])
 assert(overview.includes('href="'+source+'"'),'Overview needs '+source);
const doc=fs.readFileSync('docs/family-primary-source-review-pass10-2026-11-22.md','utf8');
for(const source of ['https://sunnah.com/bukhari:5136','https://sunnah.com/bukhari:5150',
 'https://sunnah.com/bukhari:5364','https://sunnah.com/muslim:1218a',
 'https://sunnah.com/abudawud:495','https://sunnah.com/abudawud:2276',
 'https://sunnah.com/abudawud:2277','https://sunnah.com/bukhari:7257',
 'https://www.sistani.org/english/book/48/2372/'])
 assert(doc.includes(source),'Documented source missing: '+source);
assert(doc.includes('не построчно заверенный русский перевод'.replace('не','не'))||
 doc.includes('не построчно заверенный русский перевод'),'Review limitation missing');
assert(doc.includes('не рецензировали'),'Independent expert review status must remain explicit');
console.log('PASS: hadith context and 19-source comparative review matrix');
console.log('NOT CERTIFIED: structural/test assertions do not independently attest Arabic or fiqh accuracy');
