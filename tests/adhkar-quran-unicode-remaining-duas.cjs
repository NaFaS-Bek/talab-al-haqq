'use strict';
// Pinned Unicode comparison of all 11 Quranic dua cards not covered by pass 1.
// Source is a verbatim 16-verse snapshot from a third-party Tanzil 1.1 mirror.
// The ONLY normalized code points: U+0640 tatweel, U+06D6 (pause), U+06DA
// (pause) and U+06DE (rub el hizb marker). Their source counts are pinned;
// any other Arabic character or vowel-sign difference makes the test FAIL.
// This is not verification of phonetics, tajwid, translations or a fatwa.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const fixture = fs.readFileSync('tests/fixtures/tanzil-uthmani-1.1-remaining-duas.txt', 'utf8');
assert.match(fixture, /Tanzil Quran Text \(Uthmani, Version 1\.1\)/,
  'Verbatim Tanzil license notice and attribution must remain');
assert.match(fixture, /f2f03c415ea50f8493d2058ec67a90257333abe3/,
  'Reference mirror must remain identified by its immutable Git blob');

const verses = new Map();
for (const line of fixture.split(/\r?\n/)) {
  const match = line.match(/^(\d+)\|(\d+)\|(.+)$/);
  if (!match) continue;
  const key = match[1] + ':' + match[2];
  assert.ok(!verses.has(key), 'Duplicate fixture verse: ' + key);
  verses.set(key, match[3]);
}

const codepoints = [0x0640, 0x06D6, 0x06DA, 0x06DE];
const normalize = text => String(text ?? '')
  .replace(/[\u0640\u06D6\u06DA\u06DE]/g, '')
  .replace(/\s+/g, ' ').trim();
const markCounts = text => codepoints.map(cp =>
  [...String(text ?? '')].filter(ch => ch.codePointAt(0) === cp).length);
const markPositions = text => [...String(text ?? '')]
  .flatMap((ch, i) => codepoints.includes(ch.codePointAt(0))
    ? [[ch.codePointAt(0), i]] : []);

// The mark-count profile is deliberate and MUST be revised by a person when
// changing Unicode conventions; differing stop signs are not called errors
// or treated as expert-approved omissions by this regression test.
const specs = [
  {id:'q_71_28',verses:['71:28'],kind:'full_verse',refMarks:[2,0,0,0]},
  {id:'q_14_40_41',verses:['14:40','14:41'],kind:'verse_range',refMarks:[0,0,1,0]},
  {id:'q_2_127_128',verses:['2:127','2:128'],kind:'verse_range',
    refMarks:[2,2,0,0],siteMarks:[[0x0640,25]]},
  {id:'q_26_169',verses:['26:169'],kind:'full_verse',refMarks:[0,0,0,0]},
  {id:'q_12_101',verses:['12:101'],kind:'full_verse',
    refMarks:[3,1,1,1],siteMarks:[[0x0640,151]]},
  {id:'q_21_83',verses:['21:83'],kind:'full_verse',refMarks:[0,0,0,1]},
  {id:'q_7_89',verses:['7:89'],kind:'full_verse',refMarks:[1,0,4,0]},
  {id:'q_20_25_28',verses:['20:25','20:26','20:27','20:28'],
    kind:'full_verses',refMarks:[0,0,0,0]},
  {id:'q_21_87',verses:['21:87'],kind:'full_verse',refMarks:[5,0,0,0]},
  {id:'q_21_89',verses:['21:89'],kind:'full_verse',refMarks:[0,0,0,0]},
  {id:'q_5_114',verses:['5:114'],kind:'full_verse',refMarks:[0,1,0,0]},
];

assert.equal(verses.size, 16, 'Expected exactly 16 source verses');
assert.equal(specs.length, 11, 'Expected exactly 11 remaining Quranic dua cards');
assert.equal(new Set(specs.flatMap(x => x.verses)).size, 16,
  'Each source verse must be represented exactly once');

const db = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const entries = [...db.catalog.entries, ...db.catalog_additions.entries];
const byId = new Map(entries.map(x => [x.id, x]));

for (const spec of specs) {
  const card = byId.get(spec.id);
  assert.ok(card, spec.id + ': missing card');
  const raw = spec.verses.map(key => {
    assert.ok(verses.has(key), 'Missing source verse: ' + key);
    return verses.get(key);
  }).join(' ');
  assert.deepEqual(markCounts(raw), spec.refMarks,
    spec.id + ': source mirror mark profile changed');
  assert.deepEqual(markPositions(card.arabicText), spec.siteMarks || [],
    spec.id + ': site mark placement changed and needs review');
  assert.equal(normalize(card.arabicText), normalize(raw),
    spec.id + ': substantive Arabic Unicode differs beyond pinned formatting codepoints');
  assert.equal(card.fullVerseArabic, card.arabicText,
    spec.id + ': fullVerseArabic diverges from the displayed text');
  assert.equal(card.excerptKind, spec.kind, spec.id + ': verse type changed');
  assert.equal(card.originKind, 'quran', spec.id + ': not Quran-origin material');
  assert.equal(card.contentKind, 'dua', spec.id + ': not a Quranic dua');
  assert.ok(card.sourceRefs?.some(ref =>
    spec.verses[0] === String(ref.number).replace(/\u2013/g, '-').split('-')[0] &&
    ref.url === 'https://quran.com/' + spec.verses[0].replace(':','/')),
    spec.id + ': missing exact Quran passage link');
  assert.ok(card.segments?.length, spec.id + ': no reading segments');
  assert.equal(normalize(card.segments.map(s => s.arabicText).join(' ')),
    normalize(card.arabicText), spec.id + ': Arabic segments do not reconstruct full verse(s)');
  assert.equal(card.segments.map(s => s.transliterationRu).join(' ').replace(/\s+/g,' ').trim(),
    String(card.transliterationRu ?? '').replace(/\s+/g,' ').trim(),
    spec.id + ': transliteration segments differ from parent record');
  assert.notEqual(card.reviewStatus,'expert_checked',
    spec.id + ': Unicode comparison does NOT grant independent expert review');
}
console.log('PASS 11 Quran dua entries / 16 verses: source Unicode matches after precisely pinned mark differences');
console.log('NOTE tatweel, pause signs and rub-el-hizb symbols differ; review reading implications manually');
console.log('NOTE no independent verified Tajwid, phonetic transcription or translation approval');
