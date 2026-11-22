'use strict';
// Hadith wording/source regression checks: 13 remaining cards, reviewed 2026-11-22.
// Snapshots and source references do not independently certify audio, isnad or phonetics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const cards = [...data.catalog.entries,...data.catalog_additions.entries];
const byId = new Map(cards.map(c=>[c.id,c]));
const n = s=>String(s||'').replace(/\s+/g,' ').trim();
const checked = [
  {
    "id": "h_muslim_2692",
    "title": "Субханаллахи ва би-хамдих — утром и вечером",
    "sourceNumber": "2692",
    "sourceUrl": "https://sunnah.com/muslim:2692",
    "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    "segmentArabic": [
      "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": 100,
    "timingPeriods": null
  },
  {
    "id": "h_abudawud_5088",
    "title": "С именем Аллаха — утром и вечером",
    "sourceNumber": "5088",
    "sourceUrl": "https://sunnah.com/abudawud:5088",
    "arabic": "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَىْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    "segmentArabic": [
      "بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَىْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": 3,
    "timingPeriods": null
  },
  {
    "id": "h_bukhari_6306",
    "title": "Саййид аль-истигфар — обращение о прощении",
    "sourceNumber": "6306",
    "sourceUrl": "https://sunnah.com/bukhari:6306",
    "arabic": "اللَّهُمَّ أَنْتَ رَبِّي، لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَىَّ وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ",
    "segmentArabic": [
      "اللَّهُمَّ أَنْتَ رَبِّي، لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ،",
      "أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَىَّ وَأَبُوءُ لَكَ بِذَنْبِي،",
      "فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_tirmidhi_3391_morning",
    "title": "Когда наступило утро",
    "sourceNumber": "3391",
    "sourceUrl": "https://sunnah.com/tirmidhi:3391",
    "arabic": "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
    "segmentArabic": [
      "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_tirmidhi_3391_evening",
    "title": "Когда наступил вечер",
    "sourceNumber": "3391",
    "sourceUrl": "https://sunnah.com/tirmidhi:3391",
    "arabic": "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    "segmentArabic": [
      "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_bukhari_6324_waking",
    "title": "После пробуждения",
    "sourceNumber": "6324",
    "sourceUrl": "https://sunnah.com/bukhari:6324",
    "arabic": "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا، وَإِلَيْهِ النُّشُورُ",
    "segmentArabic": [
      "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا، وَإِلَيْهِ النُّشُورُ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_tirmidhi_1858_before",
    "title": "Перед едой — назвать имя Аллаха",
    "sourceNumber": "1858",
    "sourceUrl": "https://sunnah.com/tirmidhi:1858",
    "arabic": "بِسْمِ اللَّهِ",
    "segmentArabic": [
      "بِسْمِ اللَّهِ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_tirmidhi_1858_forgot",
    "title": "Если забыл перед едой",
    "sourceNumber": "1858",
    "sourceUrl": "https://sunnah.com/tirmidhi:1858",
    "arabic": "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ",
    "segmentArabic": [
      "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_tirmidhi_3458",
    "title": "После еды — хвала за пропитание",
    "sourceNumber": "3458",
    "sourceUrl": "https://sunnah.com/tirmidhi:3458",
    "arabic": "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلاَ قُوَّةٍ",
    "segmentArabic": [
      "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلاَ قُوَّةٍ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_abudawud_5095",
    "title": "При выходе из дома",
    "sourceNumber": "5095",
    "sourceUrl": "https://sunnah.com/abudawud:5095",
    "arabic": "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ",
    "segmentArabic": [
      "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_muslim_2018a",
    "title": "При входе домой — наставление о поминании",
    "sourceNumber": "2018a",
    "sourceUrl": "https://sunnah.com/muslim:2018a",
    "arabic": "إِذَا دَخَلَ الرَّجُلُ بَيْتَهُ فَذَكَرَ اللَّهَ عِنْدَ دُخُولِهِ وَعِنْدَ طَعَامِهِ قَالَ الشَّيْطَانُ لاَ مَبِيتَ لَكُمْ وَلاَ عَشَاءَ",
    "segmentArabic": [
      "إِذَا دَخَلَ الرَّجُلُ بَيْتَهُ فَذَكَرَ اللَّهَ عِنْدَ دُخُولِهِ وَعِنْدَ طَعَامِهِ قَالَ الشَّيْطَانُ لاَ مَبِيتَ لَكُمْ وَلاَ عَشَاءَ"
    ],
    "excerptKind": "dhikr_instruction",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_muslim_1342",
    "title": "В начале путешествия",
    "sourceNumber": "1342",
    "sourceUrl": "https://sunnah.com/muslim:1342",
    "arabic": "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الأَهْلِ اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمَنْظَرِ وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالأَهْلِ",
    "segmentArabic": [
      "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
      "وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
      "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى",
      "اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ",
      "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الأَهْلِ",
      "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمَنْظَرِ وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالأَهْلِ"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  },
  {
    "id": "h_bukhari_6324_sleep",
    "title": "Перед сном",
    "sourceNumber": "6324",
    "sourceUrl": "https://sunnah.com/bukhari:6324",
    "arabic": "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    "segmentArabic": [
      "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا"
    ],
    "excerptKind": "supplication_excerpt",
    "repeatCount": null,
    "timingPeriods": null
  }
];
assert.equal(cards.length,43,'Review catalog changes and the audit tally');
assert.equal(new Set(checked.map(c=>c.id)).size,13,'Must have 13 distinct hadith cards');
for(const s of checked){
 const c=byId.get(s.id);
 assert.ok(c,s.id+': card removed');
 assert.equal(c.originKind,'hadith',s.id+': origin changed');
 assert.equal(c.excerptKind,s.excerptKind,s.id+': scope changed');
 assert.ok(c.sourceRefs.some(r=>r.number===s.sourceNumber&&r.url===s.sourceUrl),s.id+': source link differs');
 assert.equal(n(c.arabicText),n(s.arabic),s.id+': Arabic version changed since audit');
 assert.deepEqual(c.segments.map(x=>n(x.arabicText)),s.segmentArabic.map(n),s.id+': segment Arabic changed');
 assert.equal(n(c.segments.map(x=>x.arabicText).join(' ')),n(c.arabicText),s.id+': segment/full Arabic mismatch');
 assert.equal(n(c.segments.map(x=>x.translationRu).join(' ')),n(c.translationRu),s.id+': segment/full Russian translation mismatch');
 assert.equal(n(c.segments.map(x=>x.transliterationRu).join(' ')),n(c.transliterationRu),s.id+': segment/full transliteration mismatch');
 const count=c.repetitionRule?.stages?.[0]?.count??null;
 assert.equal(count,s.repeatCount,s.id+': repetition count differs from reviewed evidence');
 if(s.repeatCount){
   assert.equal(c.repetitionRule.stages.length,1,s.id+': unexpected additional repetition rules');
   assert.equal(c.repetitionRule.stages[0].sourceUrl,s.sourceUrl,s.id+': repetition source link changed');
   assert.equal(n(c.repetitionRule.stages[0].arabicText),n(c.arabicText),s.id+': repeated words do not match formula');
 }
 assert.notEqual(c.reviewStatus,'expert_checked',s.id+': source review is not a scholar/audio certificate');
}
assert.equal(byId.get('h_muslim_2018a').excerptKind,'dhikr_instruction','2018a must not be presented as a recitation formula');
assert.equal(byId.get('h_muslim_2692').repetitionRule.stages[0].count,100,'Muslim 2692 one hundred repetitions');
assert.equal(byId.get('h_abudawud_5088').repetitionRule.stages[0].count,3,'Abu Dawud 5088 three repetitions');
assert.ok(byId.get('h_tirmidhi_3391_morning').arabicText.endsWith('وَإِلَيْكَ الْمَصِيرُ'),'Tirmidhi 3391 morning ending');
assert.ok(byId.get('h_tirmidhi_3391_evening').arabicText.endsWith('وَإِلَيْكَ النُّشُورُ'),'Tirmidhi 3391 evening ending');
assert.ok(byId.get('h_muslim_1342').sourceRefs.some(x=>x.number==='43:13–14'),'Muslim 1342 Quranic reference missing');
assert.ok(!byId.get('h_muslim_1342').arabicText.includes('آيِبُونَ'),'Return-journey extension must remain distinct from departure excerpt');
assert.ok(byId.get('h_bukhari_6324_waking').arabicText.includes('الْحَمْدُ'),'Bukhari 6324 waking invocation lost');
assert.ok(byId.get('h_bukhari_6324_sleep').arabicText.includes('بِاسْمِكَ'),'Bukhari 6324 sleep invocation lost');
console.log('PASS 13 hadith cards: pinned wording, source links, split variants, repetitions and segmented translations');
console.log('NOTE timing metadata may need a separate UI/data fix; phonetics, full variant critique and isnad expertise NOT certified');
