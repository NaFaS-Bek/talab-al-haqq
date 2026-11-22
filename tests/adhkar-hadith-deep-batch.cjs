'use strict';
// Source-anchored invariants for the eight entries documented in
// docs/adhkar-deep-review-batch-3-2026-11-22.md.
// IMPORTANT: stripping diacritics makes this a WORDING test, not a test
// of exact vocalization, transliteration, translation, or hadith grading.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const cards = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(cards.map(card => [card.id, card]));
const lexical = s => String(s || '').normalize('NFC')
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
  .replace(/[،؛,.:!?]/g, ' ').replace(/\s+/g, ' ').trim();
const whitespace = s => String(s || '').replace(/\s+/g, ' ').trim();

// These short source excerpts were compared with the individual Sunnah.com
// pages on 2026-11-22; preserve their exact order, not just a substring.
const cases = [
  {
    id: 'h_muslim_2202', ref: 'muslim:2202',
    words: 'باسم الله أعوذ بالله وقدرته من شر ما أجد وأحاذر',
    counts: [3, 7], kind: 'supplication_excerpt',
  },
  {
    id: 'h_bukhari_6369', ref: 'bukhari:6369',
    words: 'اللهم إني أعوذ بك من الهم والحزن والعجز والكسل والجبن والبخل وضلع الدين وغلبة الرجال',
    counts: [], kind: 'supplication_excerpt',
  },
  {
    id: 'h_bukhari_3282', ref: 'bukhari:3282',
    words: 'أعوذ بالله من الشيطان',
    counts: [], kind: 'supplication_excerpt',
  },
  {
    id: 'h_bukhari_5743', ref: 'bukhari:5743',
    words: 'اللهم رب الناس أذهب الباس اشفه وأنت الشافي لا شفاء إلا شفاؤك شفاء لا يغادر سقما',
    counts: [], kind: 'supplication_excerpt',
  },
  {
    id: 'h_muslim_918b', ref: 'muslim:918b',
    words: 'إنا لله وإنا إليه راجعون اللهم أجرني في مصيبتي وأخلف لي خيرا منها',
    counts: [], kind: 'supplication_excerpt',
  },
  {
    id: 'h_muslim_2708a', ref: 'muslim:2708a',
    words: 'أعوذ بكلمات الله التامات من شر ما خلق',
    counts: [], kind: 'supplication_excerpt',
  },
  {
    id: 'h_muslim_2725a', ref: 'muslim:2725a',
    words: 'اللهم اهدني وسددني',
    counts: [], kind: 'supplication_excerpt',
  },
  {
    id: 'h_muslim_2727a', ref: 'muslim:2727a',
    words: 'أن تكبرا الله أربعا وثلاثين وتسبحاه ثلاثا وثلاثين وتحمداه ثلاثا وثلاثين',
    counts: [34, 33, 33], kind: 'dhikr_instruction',
  },
];

assert.equal(cards.length, 43, 'Track the expected catalog size');
assert.equal(new Set(cases.map(x => x.id)).size, 8, 'The batch must contain 8 distinct entries');
for (const spec of cases) {
  const card = byId.get(spec.id);
  assert.ok(card, 'Missing reviewed card: ' + spec.id);
  assert.ok(card.sourceRefs?.some(ref => ref.url === 'https://sunnah.com/' + spec.ref),
    spec.id + ': source link differs');
  assert.equal(lexical(card.arabicText), lexical(spec.words),
    spec.id + ': Arabic word order differs from documented source excerpt');
  assert.ok(card.segments?.length, spec.id + ': segments missing');
  assert.equal(lexical(card.segments.map(s => s.arabicText).join(' ')), lexical(card.arabicText),
    spec.id + ': Arabic segment text differs from parent');
  assert.equal(whitespace(card.segments.map(s => s.transliterationRu).join(' ')),
    whitespace(card.transliterationRu),
    spec.id + ': transliteration segment text differs from parent');
  assert.equal(card.excerptKind, spec.kind,
    spec.id + ': supplication and narrative instruction must not be conflated');
  const counts = card.repetitionRule?.stages?.map(s => s.count) || [];
  assert.deepEqual(counts, spec.counts,
    spec.id + ': prescribed repetitions must remain tied to their source');
  assert.notEqual(card.reviewStatus, 'expert_checked',
    spec.id + ': the test cannot certify independent expert review');
}
console.log('PASS 8 source-linked adhkar wording and segment regression checks');
console.log('NOTE exact tashkeel, pronunciation, translation and hadith grading are not certified');
