'use strict';
// Exact audit of waqf-mark locations from a pinned third-party Tanzil mirror.
// This is a reproducible source comparison, NOT a religious ruling or approval
// to insert/delete pause marks in Quranic scripture.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('tests/fixtures/tanzil-uthmani-1.1-remaining-duas.txt','utf8');
assert.match(source, /Tanzil Quran Text \(Uthmani, Version 1\.1\)/);
assert.match(source, /f2f03c415ea50f8493d2058ec67a90257333abe3/);
const verses = new Map();
for (const line of source.split(/\r?\n/)) {
  const match = line.match(/^(\d+)\|(\d+)\|(.+)$/);
  if (match) {
    const key = match[1] + ':' + match[2];
    assert.ok(!verses.has(key),'Repeated source verse '+key);
    verses.set(key,match[3]);
  }
}
assert.equal(verses.size,16,'Expected 16 independently pinned source ayats');
const db = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const entries = [...db.catalog.entries,...db.catalog_additions.entries];
const duaEntries = entries.filter(e => e.originKind === 'quran' && e.contentKind === 'dua');
assert.equal(duaEntries.length,15,'A changed Quran dua inventory needs human review');
const byId = new Map(duaEntries.map(e => [e.id,e]));

const specs = [
  {id:'q_14_40_41',number:'14:40–41',url:'https://quran.com/14/40',marks:[
    ['14:40','ذُرِّيَّتِى','ۚ'],
  ]},
  {id:'q_2_127_128',number:'2:127–128',url:'https://quran.com/2/127',marks:[
    ['2:127','مِنَّآ','ۖ'],['2:128','عَلَيْنَآ','ۖ'],
  ]},
  {id:'q_12_101',number:'12:101',url:'https://quran.com/12/101',marks:[
    ['12:101','ٱلْأَحَادِيثِ','ۚ'],['12:101','ٱلْـَٔاخِرَةِ','ۖ'],
  ]},
  {id:'q_7_89',number:'7:89',url:'https://quran.com/7/89',marks:[
    ['7:89','مِنْهَا','ۚ'],['7:89','ٱللَّهُ رَبُّنَا','ۚ'],
    ['7:89','عِلْمًا','ۚ'],['7:89','تَوَكَّلْنَا','ۚ'],
  ]},
  {id:'q_5_114',number:'5:114',url:'https://quran.com/5/114',marks:[
    ['5:114','مِّنكَ','ۖ'],
  ]},
];
assert.equal(specs.length,5);
assert.equal(new Set(specs.map(x=>x.id)).size,5,'Duplicate reviewed Quran entry');
const markCodes = new Set(['ۚ','ۖ']);
const expectedOffsets = new Set();
let count = 0, jeem = 0, silaa = 0;
for (const spec of specs) {
  const card = byId.get(spec.id);
  assert.ok(card,spec.id+': missing Quran dua');
  assert.ok(card.sourceRefs?.some(ref =>
    ref.collection === 'Коран' && ref.number === spec.number && ref.url === spec.url),
    spec.id+': cited Quran source changed');
  assert.ok(Array.isArray(card.segments) && card.segments.length > 0);
  assert.ok(!/[ۚۖ]/u.test(card.arabicText),spec.id+': site now contains pause marks; review explanatory UI');
  assert.notEqual(card.reviewStatus,'expert_checked',
    spec.id+': mechanical inspection cannot establish expert approval');
  for (const [verse,after,mark] of spec.marks) {
    assert.ok(markCodes.has(mark),spec.id+': unsupported source pause mark');
    assert.ok(verses.has(verse),'Missing source verse '+verse);
    const siteSegment = card.segments.find(s => s.id === spec.id+'_a'+verse.split(':')[1]);
    assert.ok(siteSegment,spec.id+': source verse segment missing');
    assert.equal(siteSegment.arabicText.split(after).length-1,1,
      spec.id+': Arabic marker anchor absent or ambiguous');
    const original=verses.get(verse);
    const token=after+' '+mark;
    assert.equal(original.split(token).length-1,1,
      verse+': source marker no longer appears precisely after '+after);
    const signIndex=original.indexOf(token)+token.length-mark.length;
    const key=verse+'@'+signIndex;
    assert.ok(!expectedOffsets.has(key),'Repeated mark at '+key);
    expectedOffsets.add(key);
    count++;
    if (mark==='ۚ') jeem++; else silaa++;
  }
}
assert.equal(count,10);
assert.equal(jeem,6);
assert.equal(silaa,4);
const actualOffsets = new Set();
for (const [verse,arabic] of verses) {
  for (let i=0;i<arabic.length;i++) {
    if (markCodes.has(arabic[i])) actualOffsets.add(verse+'@'+i);
  }
}
assert.deepEqual([...actualOffsets].sort(),[...expectedOffsets].sort(),
  'The pinned mirror has added/removed/moved a waqf marker: re-audit every location');
for (const entry of duaEntries.filter(e=>!specs.some(s=>s.id===e.id))) {
  assert.ok(!/[ۚۖ]/u.test(entry.arabicText),
    entry.id+': new pause-sign formatting needs manual review');
}
console.log('PASS 5 Quran dua cards / 10 mirror pause signs at exact after-word positions');
console.log('PASS 6 U+06DA (ۚ) / 4 U+06D6 (ۖ); no Quran scripture or reading-status changes');
console.log('NOT CERTIFIED: export parity, independent expert waqf judgment or tajwid recitation');
