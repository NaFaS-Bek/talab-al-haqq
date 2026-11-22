'use strict';
// Pass 20: six source-bound hadith cards. This safeguards source context,
// excerpts, segments and repetition; it is NOT a linguistic or expert certificate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const all = [...(data.catalog?.entries || []), ...(data.catalog_additions?.entries || [])];
const byId = new Map(all.map(c => [c.id, c]));
const n = x => String(x || '').normalize('NFC').replace(/\s+/g, ' ').trim();
const cases = [
  {id:'h_abudawud_5088',source:'https://sunnah.com/abudawud:5088',
   start:'بِسْمِ اللَّهِ الَّذِي',end:'وَهُوَ السَّمِيعُ الْعَلِيمُ',repeats:[3],
   kind:'supplication_excerpt'},
  {id:'h_bukhari_6306',source:'https://sunnah.com/bukhari:6306',
   start:'اللَّهُمَّ أَنْتَ رَبِّي',end:'إِلاَّ أَنْتَ',repeats:[],
   kind:'supplication_excerpt'},
  {id:'h_tirmidhi_3391_morning',source:'https://sunnah.com/tirmidhi:3391',
   start:'اللَّهُمَّ بِكَ أَصْبَحْنَا',end:'وَإِلَيْكَ الْمَصِيرُ',repeats:[],
   kind:'supplication_excerpt'},
  {id:'h_tirmidhi_3391_evening',source:'https://sunnah.com/tirmidhi:3391',
   start:'اللَّهُمَّ بِكَ أَمْسَيْنَا',end:'وَإِلَيْكَ النُّشُورُ',repeats:[],
   kind:'supplication_excerpt'},
  {id:'h_abudawud_5095',source:'https://sunnah.com/abudawud:5095',
   start:'بِسْمِ اللَّهِ تَوَكَّلْتُ',end:'إِلاَّ بِاللَّهِ',repeats:[],
   kind:'supplication_excerpt'},
  {id:'h_muslim_2018a',source:'https://sunnah.com/muslim:2018a',
   start:'إِذَا دَخَلَ الرَّجُلُ بَيْتَهُ',end:'وَلاَ عَشَاءَ',repeats:[],
   kind:'dhikr_instruction'}
];
assert.equal(new Set(cases.map(c => c.id)).size, 6);
for (const s of cases) {
  const c = byId.get(s.id);
  assert(c, 'Missing card: ' + s.id);
  assert.equal(c.originKind, 'hadith', 'Not a hadith card: ' + s.id);
  assert.equal(c.excerptKind, s.kind, 'Do not conflate narration and recitation: ' + s.id);
  assert(c.sourceRefs?.some(r => r.url === s.source), 'Source changed: ' + s.id);
  assert(n(c.arabicText).startsWith(n(s.start)), 'Unexpected source excerpt start: ' + s.id);
  assert(n(c.arabicText).endsWith(n(s.end)), 'Unexpected source excerpt end: ' + s.id);
  assert.deepEqual(c.repetitionRule?.stages?.map(x=>x.count)||[], s.repeats,
    'Do not invent or omit source repetition: ' + s.id);
  assert(Array.isArray(c.segments) && c.segments.length, 'Segments absent: ' + s.id);
  assert.equal(n(c.segments.map(x=>x.arabicText).join(' ')), n(c.arabicText),
    'Arabic segments differ from source excerpt: ' + s.id);
  assert.equal(n(c.segments.map(x=>x.transliterationRu).join(' ')), n(c.transliterationRu),
    'Russian reading segments differ from parent: ' + s.id);
  assert.equal(n(c.segments.map(x=>x.translationRu).join(' ')), n(c.translationRu),
    'Russian translation segments differ from parent: ' + s.id);
  assert.notEqual(c.reviewStatus, 'expert_checked',
    'Independent expert certification cannot be inferred from a CI check: ' + s.id);
}
const a=byId.get('h_tirmidhi_3391_morning').arabicText;
const b=byId.get('h_tirmidhi_3391_evening').arabicText;
assert(!a.includes('النُّشُورُ'), 'Morning card must not contain evening ending');
assert(!b.includes('الْمَصِيرُ'), 'Evening card must not contain morning ending');
assert(!byId.get('h_abudawud_5095').arabicText.includes('هُدِيتَ'),
 'Reported response after leaving home is not a part of the supplication');
assert(!byId.get('h_muslim_2018a').arabicText.includes('بِسْمِ اللَّهِ'),
 'Muslim 2018a must not be replaced by an invented fixed formula');
console.log('PASS pass20: six source-bound hadith excerpts, variants, boundaries and counts');
console.log('NOT CERTIFIED: full Arabic diacritics, pronunciation, translation, isnad or independent religious review');
