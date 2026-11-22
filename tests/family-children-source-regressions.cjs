'use strict';
// The child-upbringing lesson contains verified source anchors AND explicitly
// non-scriptural pedagogical examples. This is NOT a theological certificate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-children.html','utf8');
const sectionIds=[...html.matchAll(/<section class="card" id="(section-\d+)"/g)]
  .map(match=>match[1]);
assert.deepEqual(sectionIds,Array.from({length:8},(_,i)=>'section-'+(i+1)),
  'Each child-upbringing section must be present, ordered and uniquely identified');
for(const id of sectionIds) {
  assert.ok(html.includes('href="#'+id+'"'),'Missing child-lesson table of contents link '+id);
}
const sources=[
  'https://quran.com/31/13',
  'https://quran.com/31/14-15',
  'https://quran.com/31/16-19',
  'https://sunnah.com/bukhari:7138',
  'https://sunnah.com/bukhari:5997',
  'https://sunnah.com/bukhari:2587',
  'https://quran.com/20/132',
  'https://quran.com/31/17',
  'https://quran.com/16/125',
  'https://sunnah.com/abudawud:495',
  'https://www.unicef.org/parenting/mental-health/build-foundation-0-5-years',
  'https://www.unicef.org/parenting/child-care/how-discipline-your-child-smart-and-healthy-way',
  'https://www.unicef.org/parenting/child-care/11-tips-communicating-your-teen',
];
for(const url of sources){
  assert.ok(html.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'),
    'Primary-source link missing or unprotected: '+url);
}
for(const [heading,marker] of [
  ['section-1','31:14–15 — кораническое наставление'],
  ['section-2','а не разрешение перекладывать всю заботу'],
  ['section-3','не содержит готовой программы воспитания'],
  ['section-4','именно о несправедливом выделении'],
  ['section-5','не устанавливает конкретный возраст ребёнка'],
  ['section-6','современные педагогические рекомендации'],
  ['section-7','эти четыре шага не переданы как отдельный хадис'],
]) {
  const start=html.indexOf('<section class="card" id="'+heading+'">');
  const end=html.indexOf('</section>',start);
  assert.ok(start>=0&&end>start,heading+': missing section boundary');
  assert.ok(html.slice(start,end).includes(marker),heading+': missing evidence limit');
}
assert.match(html,/Страх, угрозы, насилие и публичное унижение не следует представлять/,
  'Protect children from falsely attributed or coercive religious prescriptions');
assert.equal((html.match(/<section class="card"/g)||[]).length,8);
assert.equal((html.match(/<details>/g)||[]).length,6,
  'Six short self-check questions should remain readable');
assert.equal((html.match(/<article class="age-stage"/g)||[]).length,3,
  'Expected 3 distinct age-sensitive parenting guides');
for (const [stage, marker] of [
  ['early','Раннее детство — ориентировочно 0–5 лет'],
  ['school','Школьный возраст — ориентировочно 6–11 лет'],
  ['teen','Подростковый период — ориентировочно 12–17 лет'],
]) {
  assert.ok(html.includes('id="age-'+stage+'" data-age-stage="'+stage+'"'),
    'Missing age-stage anchor: '+stage);
  assert.ok(html.includes(marker), 'Missing age-stage explanation '+stage);
}
for(const marker of [
  'В нём присутствует упоминание телесного наказания',
  'Этот урок не рекомендует телесные наказания',
  'не являются религиозными границами',
  'педагогические рекомендации, а не цитаты',
  'UNICEF: позитивная дисциплина',
]) {
  assert.ok(html.includes(marker),'Evidence/safety boundary missing: '+marker);
}
const sourceCount=(html.match(/href="https:\/\/www\.unicef\.org/g)||[]).length;
assert.ok(sourceCount>=3, 'Developmental recommendations need attributed external evidence');
assert.ok(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),
  'Expert approval must remain centrally tracked, not invented inside the lesson');
console.log('PASS: child upbringing sources, 8 sections, 3 age stages, 6 self-checks and safety boundaries');
console.log('NOT CERTIFIED: independent pedagogical or religious expert review');
