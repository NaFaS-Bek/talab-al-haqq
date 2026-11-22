'use strict';
// Regression guards for the four cards described in:
// docs/adhkar-phonetics-pass2-four-hadith-2026-11-22.md
// The snapshots are limited to SOURCE REFERENCES, ENDINGS and INTERNAL
// CONSISTENCY. This is not audio, tajwid, tashkeel or expert validation.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const cards = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(cards.map(card => [card.id, card]));
const space = value => String(value ?? '').replace(/\s+/g, ' ').trim();

const cases = [
  {
    id: 'h_abudawud_5088',
    source: 'https://sunnah.com/abudawud:5088',
    arabicStart: 'بِسْمِ اللَّهِ الَّذِي',
    arabicEnd: 'وَهُوَ السَّمِيعُ الْعَلِيمُ',
    // Russian text ends in a pausal form, not an invented extra final vowel.
    transliterationSuffix: 'ва хува-с-сами‘у-ль-‘алим.',
    repetitions: [3],
  },
  {
    id: 'h_tirmidhi_3391_morning',
    source: 'https://sunnah.com/tirmidhi:3391',
    arabicStart: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
    arabicEnd: 'وَإِلَيْكَ الْمَصِيرُ',
    transliterationSuffix: 'ва иляйка-ль-масыр.',
    repetitions: [],
  },
  {
    id: 'h_tirmidhi_3391_evening',
    source: 'https://sunnah.com/tirmidhi:3391',
    arabicStart: 'اللَّهُمَّ بِكَ أَمْسَيْنَا',
    arabicEnd: 'وَإِلَيْكَ النُّشُورُ',
    transliterationSuffix: 'ва иляйка-н-нушур.',
    repetitions: [],
  },
  {
    id: 'h_bukhari_6306',
    source: 'https://sunnah.com/bukhari:6306',
    arabicStart: 'اللَّهُمَّ أَنْتَ رَبِّي',
    arabicEnd: 'إِلاَّ أَنْتَ',
    transliterationSuffix: 'илля анта.',
    repetitions: [],
    segments: 3,
  },
];

assert.equal(new Set(cases.map(c => c.id)).size, 4, 'Four distinct hadith cards');
for (const spec of cases) {
  const card = byId.get(spec.id);
  assert.ok(card, spec.id + ': card missing');
  assert.equal(card.originKind, 'hadith', spec.id + ': origin changed');
  assert.ok(card.sourceRefs?.some(x => x.url === spec.source),
    spec.id + ': source link changed');
  assert.ok(card.arabicText.startsWith(spec.arabicStart),
    spec.id + ': source-linked Arabic opening changed');
  assert.ok(card.arabicText.endsWith(spec.arabicEnd),
    spec.id + ': source-linked Arabic ending changed');
  assert.ok(card.transliterationRu.endsWith(spec.transliterationSuffix),
    spec.id + ': documented Russian ending changed; manually review pronunciation');
  assert.ok(Array.isArray(card.segments) && card.segments.length > 0,
    spec.id + ': segments missing');
  if (spec.segments) assert.equal(card.segments.length, spec.segments,
    spec.id + ': expected educational phrase boundaries changed');
  assert.equal(space(card.segments.map(s => s.arabicText).join(' ')),
    space(card.arabicText), spec.id + ': Arabic segments differ from parent');
  assert.equal(space(card.segments.map(s => s.transliterationRu).join(' ')),
    space(card.transliterationRu), spec.id + ': transliteration segments differ from parent');
  assert.deepEqual(card.repetitionRule?.stages?.map(s => s.count) || [],
    spec.repetitions, spec.id + ': recitation count changed');
}
assert.ok(byId.get('h_tirmidhi_3391_morning').arabicText.endsWith('الْمَصِيرُ'));
assert.ok(byId.get('h_tirmidhi_3391_evening').arabicText.endsWith('النُّشُورُ'));
console.log('PASS 4 hadith cards: source, critical endings, segments, counts');
console.log('NOTE no claim of independent phonetic, tashkeel or expert certification');
