'use strict';
// Independently sourced Uthmani 1.1 sample, pinned verbatim in fixtures/.
// This test checks codepoints (including harakat); it does NOT validate
// pronunciations, tajwid, translations or the canonicality of other readings.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const fixture = JSON.parse(fs.readFileSync('tests/fixtures/tanzil-uthmani-1.1-quran-sample-54.json','utf8'));
const data = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const entries = [...data.catalog.entries,...data.catalog_additions.entries];
const quran = entries.filter(x => x.originKind === 'quran');
const byId = new Map(quran.map(x => [x.id,x]));
const specs = Object.entries(fixture.cards);
const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ';
const allowedBasmalaOmissions = new Set([
  'q_surah_103','q_surah_108','q_surah_109',
  'q_surah_112','q_surah_113','q_surah_114'
]);

assert.equal(quran.length,22,'Unexpected number of Quranic cards: human review needed');
assert.equal(specs.length,22,'All Quran cards must be source-covered');
assert.equal(Object.keys(fixture.verses).length,54,'Pinned sample must contain 54 distinct verse lines');
assert.deepEqual(new Set(specs.map(([id])=>id)),new Set(quran.map(x=>x.id)),
  'Every Quran card needs a pinned independent-source reference');

const usedVerses = new Set();
let checked = 0, omitted = 0;
for (const [id,spec] of specs) {
  const card = byId.get(id);
  assert.ok(card, 'Missing Quran card '+id);
  assert.ok(card.sourceRefs?.some(ref => ref.number===spec.sourceNumber &&
    /^https:\/\/quran\.com\//.test(ref.url||'')),
    id + ': source number/link changed');
  assert.ok(Array.isArray(card.segments),'Missing segments for '+id);
  assert.equal(card.segments.length,spec.verseKeys.length,id+': verse count changed');
  let expected = spec.verseKeys.map(key => {
    const line = fixture.verses[key];
    assert.ok(typeof line==='string'&&line.length>0,'No pinned verse '+key);
    usedVerses.add(key);
    return line;
  });
  const omit = spec.sourceFileIncludesLeadingBasmala === true;
  assert.equal(omit,allowedBasmalaOmissions.has(id),
    id+': basmala treatment changed; review source formatting before updating');
  if (omit) {
    assert.ok(spec.verseKeys[0].endsWith(':1'),id+': omitted basmala is not at verse 1');
    assert.ok(expected[0].startsWith(BISMILLAH),
      id+': independent source does not have the documented initial basmala');
    // Keep the unmodified external verse line in the fixture.
    // Compare only its numbered-verse span to the site's existing excerpt.
    expected = [expected[0].slice(BISMILLAH.length), ...expected.slice(1)];
    omitted++;
  }
  for (let i=0;i<expected.length;i++) {
    assert.equal(card.segments[i].arabicText, expected[i],
      id+': Unicode codepoint mismatch against independent Tanzil verse '+spec.verseKeys[i]);
  }
  assert.equal(card.arabicText, expected.join(' '),
    id+': combined Arabic text differs from exact publisher-sample verse sequence');
  if (card.fullVerseArabic != null) {
    assert.equal(card.fullVerseArabic, expected.join(' '),
      id+': fullVerseArabic differs from exact publisher-sample verse sequence');
  }
  assert.equal(card.segments.map(s=>s.transliterationRu).join(' ').replace(/\s+/g,' ').trim(),
    String(card.transliterationRu || '').replace(/\s+/g,' ').trim(),
    id+': transliteration segments and parent must agree internally');
  checked++;
}
assert.deepEqual(usedVerses,new Set(Object.keys(fixture.verses)),
  'The fixture contains untested or missing verse lines');
assert.equal(omitted,6);
console.log('PASS '+checked+' Quran cards and '+usedVerses.size+
  ' verse lines against independent Tanzil Uthmani 1.1 sample (exact Unicode)');
console.log('INFO 6 non-Fatiha surahs display numbered verses without the Tanzil file’s prefixed basmala');
console.log('NOT CERTIFIED: audio, tajwid, pronunciation, translations, expert assessment');
