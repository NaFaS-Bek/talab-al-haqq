'use strict';
// Five prophet supplications: Quranic full-verse snapshots + narrative boundaries.
// Reviewed for meaning and boundaries using Quran.com on 2026-11-22.
// This does not certify every Tanzil glyph, recitation, tajwid or Russian translation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const cards = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(cards.map(card => [card.id, card]));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const specs = [
  {
    "id": "q_71_28",
    "verse": "71:28",
    "sourceUrl": "https://quran.com/71/28",
    "keys": [
      "71:28"
    ],
    "narrative": "",
    "comment": "Весь аят — обращение Нуха; заключительная часть о несправедливых требует исторического контекста",
    "excerptKind": "full_verse",
    "snapshot": "رَّبِّ ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِمَن دَخَلَ بَيْتِىَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَٱلْمُؤْمِنَٰتِ وَلَا تَزِدِ ٱلظَّٰلِمِينَ إِلَّا تَبَارًۢا",
    "segments": [
      "رَّبِّ ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِمَن دَخَلَ بَيْتِىَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَٱلْمُؤْمِنَٰتِ وَلَا تَزِدِ ٱلظَّٰلِمِينَ إِلَّا تَبَارًۢا"
    ],
    "firstDuaWord": "رَّبِّ"
  },
  {
    "id": "q_14_40_41",
    "verse": "14:40–41",
    "sourceUrl": "https://quran.com/14/40",
    "keys": [
      "14:40",
      "14:41"
    ],
    "narrative": "",
    "comment": "Два самостоятельных аята-обращения Ибрахима; каждый сегмент имеет собственный номер",
    "excerptKind": "verse_range",
    "snapshot": "رَبِّ ٱجْعَلْنِى مُقِيمَ ٱلصَّلَوٰةِ وَمِن ذُرِّيَّتِى رَبَّنَا وَتَقَبَّلْ دُعَآءِ رَبَّنَا ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ ٱلْحِسَابُ",
    "segments": [
      "رَبِّ ٱجْعَلْنِى مُقِيمَ ٱلصَّلَوٰةِ وَمِن ذُرِّيَّتِى رَبَّنَا وَتَقَبَّلْ دُعَآءِ",
      "رَبَّنَا ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ ٱلْحِسَابُ"
    ],
    "firstDuaWord": "رَبِّ"
  },
  {
    "id": "q_20_25_28",
    "verse": "20:25–28",
    "sourceUrl": "https://quran.com/20/25",
    "keys": [
      "20:25",
      "20:26",
      "20:27",
      "20:28"
    ],
    "narrative": "قَالَ",
    "comment": "Вводное قَالَ («сказал») не часть прямой мольбы Мусы; обращение начинается с رَبِّ",
    "excerptKind": "full_verses",
    "snapshot": "قَالَ رَبِّ ٱشْرَحْ لِى صَدْرِى وَيَسِّرْ لِىٓ أَمْرِى وَٱحْلُلْ عُقْدَةً مِّن لِّسَانِى يَفْقَهُوا۟ قَوْلِى",
    "segments": [
      "قَالَ رَبِّ ٱشْرَحْ لِى صَدْرِى",
      "وَيَسِّرْ لِىٓ أَمْرِى",
      "وَٱحْلُلْ عُقْدَةً مِّن لِّسَانِى",
      "يَفْقَهُوا۟ قَوْلِى"
    ],
    "firstDuaWord": "رَبِّ"
  },
  {
    "id": "q_21_83",
    "verse": "21:83",
    "sourceUrl": "https://quran.com/21/83",
    "keys": [
      "21:83"
    ],
    "narrative": "وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُۥٓ",
    "comment": "Начало аята повествует об Айюбе; просьба передана с أَنِّى مَسَّنِىَ",
    "excerptKind": "full_verse",
    "snapshot": "وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُۥٓ أَنِّى مَسَّنِىَ ٱلضُّرُّ وَأَنتَ أَرْحَمُ ٱلرَّٰحِمِينَ",
    "segments": [
      "وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُۥٓ أَنِّى مَسَّنِىَ ٱلضُّرُّ وَأَنتَ أَرْحَمُ ٱلرَّٰحِمِينَ"
    ],
    "firstDuaWord": "أَنِّى"
  },
  {
    "id": "q_21_87",
    "verse": "21:87",
    "sourceUrl": "https://quran.com/21/87",
    "keys": [
      "21:87"
    ],
    "narrative": "وَذَا ٱلنُّونِ إِذ ذَّهَبَ مُغَٰضِبًا فَظَنَّ أَن لَّن نَّقْدِرَ عَلَيْهِ فَنَادَىٰ فِى ٱلظُّلُمَٰتِ أَن",
    "comment": "Вступительное повествование и أَن перед прямой речью не часть самостоятельного зикра; при отдельном отображении нельзя слепо копировать графику стыка أَن لَّآ",
    "excerptKind": "full_verse",
    "snapshot": "وَذَا ٱلنُّونِ إِذ ذَّهَبَ مُغَٰضِبًا فَظَنَّ أَن لَّن نَّقْدِرَ عَلَيْهِ فَنَادَىٰ فِى ٱلظُّلُمَٰتِ أَن لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبْحَٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّٰلِمِينَ",
    "segments": [
      "وَذَا ٱلنُّونِ إِذ ذَّهَبَ مُغَٰضِبًا فَظَنَّ أَن لَّن نَّقْدِرَ عَلَيْهِ فَنَادَىٰ فِى ٱلظُّلُمَٰتِ أَن لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبْحَٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّٰلِمِينَ"
    ],
    "firstDuaWord": "لَّآ"
  }
];

assert.equal(cards.length, 43, 'Review the audit inventory when catalog grows');
assert.equal(new Set(specs.map(s=>s.id)).size, 5, 'Five distinct prophet supplication cards');
for (const s of specs) {
  const card = byId.get(s.id);
  assert.ok(card, s.id + ': card missing');
  assert.equal(clean(card.arabicText), clean(s.snapshot), s.id + ': pinned Quranic text changed');
  assert.equal(clean(card.fullVerseArabic), clean(s.snapshot), s.id + ': full source verse changed');
  assert.equal(card.originKind, 'quran', s.id + ': not marked as Quran');
  assert.equal(card.excerptKind, s.excerptKind, s.id + ': excerpt scope changed');
  assert.ok(card.sourceRefs?.some(ref => ref.url === s.sourceUrl && ref.number === s.verse), s.id + ': Quran link or verse reference changed');
  assert.deepEqual(card.segments.map(part => part.verseKey), s.keys, s.id + ': segment verse mapping changed');
  assert.deepEqual(card.segments.map(part => clean(part.arabicText)), s.segments.map(clean), s.id + ': pinned verse segmentation changed');
  assert.equal(clean(card.segments.map(part => part.arabicText).join(' ')), clean(s.snapshot), s.id + ': full Arabic and verses differ');
  assert.equal(clean(card.segments.map(part => part.transliterationRu).join(' ')), clean(card.transliterationRu), s.id + ': transliteration segments differ');
  assert.equal(clean(card.segments.map(part => part.translationRu).join(' ')), clean(card.translationRu), s.id + ': translation segments differ');
  const words = clean(s.snapshot).split(' ');
  const narrativeWords = s.narrative ? clean(s.narrative).split(' ') : [];
  if (narrativeWords.length) {
    assert.equal(words.slice(0, narrativeWords.length).join(' '), clean(s.narrative), s.id + ': narrative boundary changed');
    assert.equal(words[narrativeWords.length], s.firstDuaWord, s.id + ': first spoken supplication word changed');
  } else {
    assert.equal(words[0], s.firstDuaWord, s.id + ': supplication beginning changed');
  }
  assert.equal(card.repetitionRule, null, s.id + ': Quran reference does not prescribe a repeat count');
  assert.equal(card.timingRule, null, s.id + ': Quran reference does not prescribe a fixed time');
  assert.notEqual(card.reviewStatus, 'expert_checked', s.id + ': this audit is not expert certification');
}
console.log('PASS 5 prophet-related Quranic cards: pinned verses, context, references and segment consistency');
console.log('NOTE Tajwid, full character-level Tanzil comparison and Russian phonetics remain open');
