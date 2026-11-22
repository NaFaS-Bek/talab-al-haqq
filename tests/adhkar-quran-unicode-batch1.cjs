'use strict';
// Exact Unicode regression comparison against four pinned VERBATIM verses
// from a third-party Tanzil Uthmani 1.1 mirror (file + attribution in
// tests/fixtures/tanzil-uthmani-1.1-four-duas.txt).
//
// NOT a recitation, transliteration, translation or independent expert audit.
// Tatweel U+0640 is an optional display elongation under superscript alef;
// it is the ONLY difference allowed between the copied mirror and the app.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const fixture = fs.readFileSync('tests/fixtures/tanzil-uthmani-1.1-four-duas.txt', 'utf8');
assert.match(fixture, /Tanzil Quran Text \(Uthmani, Version 1\.1\)/,
  'Keep attribution and copyright notice with the reference snapshot');
const ref = new Map();
for (const line of fixture.split(/\r?\n/)) {
  const match = line.match(/^(\d+)\|(\d+)\|(.+)$/);
  if (!match) continue;
  const key = match[1] + ':' + match[2];
  assert.ok(!ref.has(key), 'Duplicate source verse ' + key);
  ref.set(key, match[3]);
}
const specs = [
  {verse:'17:24',id:'q_17_24',tatweel:0},
  {verse:'2:250',id:'q_2_250',tatweel:1},
  {verse:'27:19',id:'q_27_19',tatweel:2},
  {verse:'7:23',id:'q_7_23',tatweel:1},
];
assert.equal(ref.size,4,'Snapshot should contain exactly four reference verses');

const data = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const cards = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(cards.map(card => [card.id, card]));
const space = s => String(s ?? '').replace(/\s+/g, ' ').trim();

for (const spec of specs) {
  const card = byId.get(spec.id);
  assert.ok(card, spec.id + ': card missing');
  const upstream = ref.get(spec.verse);
  assert.ok(upstream, spec.verse + ': reference verse missing');
  assert.equal((upstream.match(/\u0640/g) || []).length, spec.tatweel,
    spec.id + ': reference-mirror display-mark profile changed');
  assert.equal(card.originKind,'quran',spec.id + ': not Quran');
  assert.equal(card.excerptKind,'full_verse',spec.id + ': not a full verse');
  assert.ok(card.sourceRefs?.some(source =>
    source.number === spec.verse &&
    source.url === 'https://quran.com/' + spec.verse.replace(':','/')),
    spec.id + ': source reference differs');

  // Do NOT strip vowel marks, hamza, superscript alef or pause symbols.
  // Strip only the optional U+0640 tatweel in the pinned mirror.
  const referenceWithoutTatweel = upstream.replace(/\u0640/g, '');
  assert.equal(card.arabicText,referenceWithoutTatweel,
    spec.id + ': Quran wording/harakat differ from reference after tatweel only');
  assert.equal(card.fullVerseArabic,card.arabicText,
    spec.id + ': fullVerseArabic must agree with the displayed full verse');
  assert.equal(space(card.segments?.map(s => s.arabicText).join(' ')),
    space(card.arabicText),spec.id + ': Arabic segments differ');
  assert.equal(space(card.segments?.map(s => s.transliterationRu).join(' ')),
    space(card.transliterationRu),spec.id + ': transliteration segments differ');
  assert.ok(card.transliterationRu?.trim(),spec.id + ': transliteration missing');
  assert.notEqual(card.reviewStatus,'expert_checked',
    spec.id + ': machine comparison does not imply expert phonetics review');
}
console.log('PASS 4 Quranic verses: exact Unicode matches pinned Tanzil-mirror text after tatweel-only removal');
console.log('Display-only tatweel differences: 17:24 = 0; 2:250 = 1; 27:19 = 2; 7:23 = 1');
console.log('NOTE Quran.com uses other display conventions; Arabic recitation and Russian transcription NOT certified');
