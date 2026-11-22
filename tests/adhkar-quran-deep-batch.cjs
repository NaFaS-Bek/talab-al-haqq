'use strict';
// Source-context regression checks for four Quranic cards.
// Exact pinned Uthmani snapshots preserve the site's Tanzil text; the
// narrative/dua boundary was manually compared with Quran.com on 2026-11-22.
// These tests DO NOT validate Arabic diacritics against a downloaded
// independent Tanzil file, phonetic pronunciation or Russian translation.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const cards = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(cards.map(card => [card.id, card]));
const trimSpace = s => String(s || '').replace(/\s+/g, ' ').trim();
const cases = [
  {
    "id": "q_17_24",
    "verse": "17:24",
    "sourceUrl": "https://quran.com/17/24",
    "narrativeArabic": "وَٱخْفِضْ لَهُمَا جَنَاحَ ٱلذُّلِّ مِنَ ٱلرَّحْمَةِ وَقُل",
    "supplicationArabic": "رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًا",
    "lastNarrativeWord": "وَقُل",
    "firstSupplicationWord": "رَّبِّ"
  },
  {
    "id": "q_2_250",
    "verse": "2:250",
    "sourceUrl": "https://quran.com/2/250",
    "narrativeArabic": "وَلَمَّا بَرَزُوا۟ لِجَالُوتَ وَجُنُودِهِۦ قَالُوا۟",
    "supplicationArabic": "رَبَّنَآ أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَٰفِرِينَ",
    "lastNarrativeWord": "قَالُوا۟",
    "firstSupplicationWord": "رَبَّنَآ"
  },
  {
    "id": "q_27_19",
    "verse": "27:19",
    "sourceUrl": "https://quran.com/27/19",
    "narrativeArabic": "فَتَبَسَّمَ ضَاحِكًا مِّن قَوْلِهَا وَقَالَ",
    "supplicationArabic": "رَبِّ أَوْزِعْنِىٓ أَنْ أَشْكُرَ نِعْمَتَكَ ٱلَّتِىٓ أَنْعَمْتَ عَلَىَّ وَعَلَىٰ وَٰلِدَىَّ وَأَنْ أَعْمَلَ صَٰلِحًا تَرْضَىٰهُ وَأَدْخِلْنِى بِرَحْمَتِكَ فِى عِبَادِكَ ٱلصَّٰلِحِينَ",
    "lastNarrativeWord": "وَقَالَ",
    "firstSupplicationWord": "رَبِّ"
  },
  {
    "id": "q_7_23",
    "verse": "7:23",
    "sourceUrl": "https://quran.com/7/23",
    "narrativeArabic": "قَالَا",
    "supplicationArabic": "رَبَّنَا ظَلَمْنَآ أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ ٱلْخَٰسِرِينَ",
    "lastNarrativeWord": "قَالَا",
    "firstSupplicationWord": "رَبَّنَا"
  }
];

assert.equal(cards.length, 43, 'Expected total catalog size must be reviewed on expansion');
assert.equal(new Set(cases.map(c => c.id)).size, 4, 'Four distinct Quranic cards');
for (const spec of cases) {
  const card = byId.get(spec.id);
  assert.ok(card, spec.id + ': missing card');
  const verseArabic = spec.narrativeArabic + ' ' + spec.supplicationArabic;
  assert.equal(trimSpace(card.arabicText), trimSpace(verseArabic),
    spec.id + ': pinned full Uthmani wording or narrative/dua boundary changed');
  assert.equal(trimSpace(card.fullVerseArabic), trimSpace(verseArabic),
    spec.id + ': fullVerseArabic must remain unchanged');
  assert.equal(card.excerptKind, 'full_verse',
    spec.id + ': the full verse must not be confused with the standalone dua');
  assert.equal(card.originKind, 'quran', spec.id + ': origin must remain Quran');
  assert.ok(card.sourceRefs?.some(ref => ref.url === spec.sourceUrl &&
    ref.number === spec.verse), spec.id + ': verse source mismatch');
  assert.ok(card.segments?.length, spec.id + ': no segments');
  assert.equal(trimSpace(card.segments.map(s => s.arabicText).join(' ')),
    trimSpace(verseArabic), spec.id + ': segment Arabic differs from full verse');
  assert.equal(trimSpace(card.segments.map(s => s.transliterationRu).join(' ')),
    trimSpace(card.transliterationRu),
    spec.id + ': segment transliteration differs from card');
  assert.equal(trimSpace(card.segments.map(s => s.translationRu).join(' ')),
    trimSpace(card.translationRu), spec.id + ': segment translation differs');
  const words = trimSpace(card.arabicText).split(' ');
  const prefixLength = trimSpace(spec.narrativeArabic).split(' ').length;
  assert.equal(words[prefixLength - 1], spec.lastNarrativeWord,
    spec.id + ': unexpected narrative end');
  assert.equal(words[prefixLength], spec.firstSupplicationWord,
    spec.id + ': unexpected supplication beginning');
  assert.equal(card.repetitionRule, null, spec.id + ': no repetition count is prescribed by cited verse');
  assert.equal(card.timingRule, null, spec.id + ': no timing schedule is prescribed by cited verse');
  assert.notEqual(card.reviewStatus, 'expert_checked',
    spec.id + ': this review is not an independent expert certificate');
}
console.log('PASS 4 Quranic full-verse snapshots, dua boundaries and source links');
console.log('NOTE Russian pronunciation, all tashkeel and exact translation remain open');
