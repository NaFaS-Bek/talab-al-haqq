'use strict';
// Quran short-surah source references and review regression checks.
// Snapshot pinning is NOT an independent source comparison, tajwid, audio, or full diacritic certification.
// Verse counts and meanings checked at Quran.com; Dawud 5082 morning/evening rule at sunnah.com.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const cards = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(cards.map(x=>[x.id,x]));
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const specs=[
  {
    "id": "q_surah_1",
    "num": 1,
    "verseCount": 7,
    "verseKeys": [
      "1:1",
      "1:2",
      "1:3",
      "1:4",
      "1:5",
      "1:6",
      "1:7"
    ],
    "arabic": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ مَٰلِكِ يَوْمِ ٱلدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
    "verses": [
      "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
      "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "مَٰلِكِ يَوْمِ ٱلدِّينِ",
      "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
      "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ"
    ],
    "quranUrl": "https://quran.com/1/1",
    "hadith5082": false,
    "scope": "full_surah"
  },
  {
    "id": "q_surah_103",
    "num": 103,
    "verseCount": 3,
    "verseKeys": [
      "103:1",
      "103:2",
      "103:3"
    ],
    "arabic": "وَٱلْعَصْرِ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ",
    "verses": [
      "وَٱلْعَصْرِ",
      "إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ",
      "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ"
    ],
    "quranUrl": "https://quran.com/103/1",
    "hadith5082": false,
    "scope": "full_surah"
  },
  {
    "id": "q_surah_108",
    "num": 108,
    "verseCount": 3,
    "verseKeys": [
      "108:1",
      "108:2",
      "108:3"
    ],
    "arabic": "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ فَصَلِّ لِرَبِّكَ وَٱنْحَرْ إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
    "verses": [
      "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
      "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
      "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ"
    ],
    "quranUrl": "https://quran.com/108/1",
    "hadith5082": false,
    "scope": "full_surah"
  },
  {
    "id": "q_surah_109",
    "num": 109,
    "verseCount": 6,
    "verseKeys": [
      "109:1",
      "109:2",
      "109:3",
      "109:4",
      "109:5",
      "109:6"
    ],
    "arabic": "قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ لَآ أَعْبُدُ مَا تَعْبُدُونَ وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ لَكُمْ دِينُكُمْ وَلِىَ دِينِ",
    "verses": [
      "قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ",
      "لَآ أَعْبُدُ مَا تَعْبُدُونَ",
      "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ",
      "وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ",
      "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ",
      "لَكُمْ دِينُكُمْ وَلِىَ دِينِ"
    ],
    "quranUrl": "https://quran.com/109/1",
    "hadith5082": false,
    "scope": "full_surah"
  },
  {
    "id": "q_surah_112",
    "num": 112,
    "verseCount": 4,
    "verseKeys": [
      "112:1",
      "112:2",
      "112:3",
      "112:4"
    ],
    "arabic": "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
    "verses": [
      "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
      "ٱللَّهُ ٱلصَّمَدُ",
      "لَمْ يَلِدْ وَلَمْ يُولَدْ",
      "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ"
    ],
    "quranUrl": "https://quran.com/112/1",
    "hadith5082": true,
    "scope": "full_surah"
  },
  {
    "id": "q_surah_113",
    "num": 113,
    "verseCount": 5,
    "verseKeys": [
      "113:1",
      "113:2",
      "113:3",
      "113:4",
      "113:5"
    ],
    "arabic": "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    "verses": [
      "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
      "مِن شَرِّ مَا خَلَقَ",
      "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
      "وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ",
      "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
    ],
    "quranUrl": "https://quran.com/113/1",
    "hadith5082": true,
    "scope": "full_surah"
  },
  {
    "id": "q_surah_114",
    "num": 114,
    "verseCount": 6,
    "verseKeys": [
      "114:1",
      "114:2",
      "114:3",
      "114:4",
      "114:5",
      "114:6"
    ],
    "arabic": "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مَلِكِ ٱلنَّاسِ إِلَٰهِ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
    "verses": [
      "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
      "مَلِكِ ٱلنَّاسِ",
      "إِلَٰهِ ٱلنَّاسِ",
      "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
      "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
      "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ"
    ],
    "quranUrl": "https://quran.com/114/1",
    "hadith5082": true,
    "scope": "full_surah"
  }
];
assert.equal(cards.length,43,'Review full catalog count if content changes');
assert.equal(specs.length,7);
assert.equal(new Set(specs.map(x=>x.num)).size,7);
for (const s of specs) {
 const c=byId.get(s.id);
 assert.ok(c,s.id+': surah missing');
 assert.equal(c.originKind,'quran',s.id+': wrong origin');
 assert.equal(c.excerptKind,'full_surah',s.id+': full surah must remain labelled');
 assert.equal(c.segments.length,s.verseCount,s.id+': verse count changed');
 assert.deepEqual(c.segments.map(v=>v.verseKey),s.verseKeys,s.id+': verse order changed');
 assert.deepEqual(c.segments.map(v=>norm(v.arabicText)),s.verses.map(norm),s.id+': pinned verses changed');
 assert.equal(norm(c.arabicText),norm(s.arabic),s.id+': pinned full reading changed');
 if (typeof c.fullVerseArabic === 'string') assert.equal(norm(c.fullVerseArabic),norm(s.arabic),s.id+': optional fullVerseArabic changed');
 assert.equal(norm(c.segments.map(v=>v.arabicText).join(' ')),norm(s.arabic),s.id+': segmentation inconsistent');
 assert.equal(norm(c.segments.map(v=>v.translationRu).join(' ')),norm(c.translationRu),s.id+': Russian translation mismatch between card and verses');
 assert.equal(norm(c.segments.map(v=>v.transliterationRu).join(' ')),norm(c.transliterationRu),s.id+': Russian transliteration mismatch between card and verses');
 const ref=c.sourceRefs?.find(r=>r.collection==='Коран');
 assert.ok(ref&&ref.number===s.num+':1–'+s.verseCount&&ref.url===s.quranUrl,s.id+': Quran reference changed');
 if (s.hadith5082) {
   assert.ok(c.sourceRefs?.some(r=>r.number==='5082'&&r.url==='https://sunnah.com/abudawud:5082'),s.id+': hadith 5082 reference missing');
   assert.equal(c.timingRule?.sourceUrl,'https://sunnah.com/abudawud:5082',s.id+': timing authority missing');
   assert.deepEqual(c.timingRule?.periods,['morning','evening'],s.id+': timing changed');
   assert.equal(c.repetitionRule?.stages?.length,1,s.id+': unsupported repeat stages');
   const stage=c.repetitionRule.stages[0];
   assert.equal(stage.count,3,s.id+': repeat count changed');
   assert.equal(stage.sourceUrl,'https://sunnah.com/abudawud:5082',s.id+': repeat authority changed');
   assert.equal(norm(stage.arabicText),norm(c.arabicText),s.id+': repeat must be whole surah');
 } else {
   assert.equal(c.timingRule,null,s.id+': no timing prescribed by Quran citation alone');
   assert.equal(c.repetitionRule,null,s.id+': no fixed repeat count prescribed by Quran citation alone');
 }
 assert.notEqual(c.reviewStatus,'expert_checked',s.id+': not independently certified');
}
console.log('PASS seven short surahs (34 ayats), verse order, Quran links, and Dawud 5082 recitation rules');
console.log('NOTE Complete Tanzil diacritics, recitation/audio, scholarly translation still require separate audit');
