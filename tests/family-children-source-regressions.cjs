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
assert.equal((html.match(/<details>/g)||[]).length,4,
  'Four short self-check questions should remain readable');
assert.ok(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),
  'Expert approval must remain centrally tracked, not invented inside the lesson');
console.log('PASS: child upbringing sources, 8 sections, four self-checks and attribution boundaries');
console.log('NOT CERTIFIED: independent pedagogical or religious expert review');
