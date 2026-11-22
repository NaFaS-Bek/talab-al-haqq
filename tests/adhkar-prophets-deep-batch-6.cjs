'use strict';
// Text-context regression checks for six remaining prophet Quranic appeals.
// Comparison of wording context and broad sense: Quran.com, 2026-11-22.
// Pinned snapshot != independent Uthmani diacritics or audio verification.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const cards=[...data.catalog.entries,...data.catalog_additions.entries];
const byId=new Map(cards.map(card=>[card.id,card]));
const clean=text=>String(text||'').replace(/\s+/g,' ').trim();
const specs=[
  {
    "id": "q_2_127_128",
    "verse": "2:127–128",
    "url": "https://quran.com/2/127",
    "keys": [
      "2:127",
      "2:128"
    ],
    "start": "رَبَّنَا تَقَبَّلْ",
    "note": "Повество­вание об Ибрахиме и Исмаиле предшествует словам просьбы в 2:127; весь 2:128 — мольба",
    "excerptKind": "verse_range",
    "narrative": "وَإِذْ يَرْفَعُ إِبْرَٰهِـۧمُ ٱلْقَوَاعِدَ مِنَ ٱلْبَيْتِ وَإِسْمَٰعِيلُ",
    "supplication": "رَبَّنَا تَقَبَّلْ مِنَّآ إِنَّكَ أَنتَ ٱلسَّمِيعُ ٱلْعَلِيمُ رَبَّنَا وَٱجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِن ذُرِّيَّتِنَآ أُمَّةً مُّسْلِمَةً لَّكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَآ إِنَّكَ أَنتَ ٱلتَّوَّابُ ٱلرَّحِيمُ",
    "fullArabic": "وَإِذْ يَرْفَعُ إِبْرَٰهِـۧمُ ٱلْقَوَاعِدَ مِنَ ٱلْبَيْتِ وَإِسْمَٰعِيلُ رَبَّنَا تَقَبَّلْ مِنَّآ إِنَّكَ أَنتَ ٱلسَّمِيعُ ٱلْعَلِيمُ رَبَّنَا وَٱجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِن ذُرِّيَّتِنَآ أُمَّةً مُّسْلِمَةً لَّكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَآ إِنَّكَ أَنتَ ٱلتَّوَّابُ ٱلرَّحِيمُ",
    "segmentArabic": [
      "وَإِذْ يَرْفَعُ إِبْرَٰهِـۧمُ ٱلْقَوَاعِدَ مِنَ ٱلْبَيْتِ وَإِسْمَٰعِيلُ رَبَّنَا تَقَبَّلْ مِنَّآ إِنَّكَ أَنتَ ٱلسَّمِيعُ ٱلْعَلِيمُ",
      "رَبَّنَا وَٱجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِن ذُرِّيَّتِنَآ أُمَّةً مُّسْلِمَةً لَّكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَآ إِنَّكَ أَنتَ ٱلتَّوَّابُ ٱلرَّحِيمُ"
    ]
  },
  {
    "id": "q_26_169",
    "verse": "26:169",
    "url": "https://quran.com/26/169",
    "keys": [
      "26:169"
    ],
    "start": "رَبِّ نَجِّنِى",
    "note": "Весь аят — просьба Лута о спасении его и семьи в контексте деяний народа",
    "excerptKind": "full_verse",
    "narrative": "",
    "supplication": "رَبِّ نَجِّنِى وَأَهْلِى مِمَّا يَعْمَلُونَ",
    "fullArabic": "رَبِّ نَجِّنِى وَأَهْلِى مِمَّا يَعْمَلُونَ",
    "segmentArabic": [
      "رَبِّ نَجِّنِى وَأَهْلِى مِمَّا يَعْمَلُونَ"
    ]
  },
  {
    "id": "q_12_101",
    "verse": "12:101",
    "url": "https://quran.com/12/101",
    "keys": [
      "12:101"
    ],
    "start": "رَبِّ قَدْ",
    "note": "Весь аят — слова Юсуфа; просьба о благом завершении следует за благодарностью",
    "excerptKind": "full_verse",
    "narrative": "",
    "supplication": "رَبِّ قَدْ ءَاتَيْتَنِى مِنَ ٱلْمُلْكِ وَعَلَّمْتَنِى مِن تَأْوِيلِ ٱلْأَحَادِيثِ فَاطِرَ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ أَنتَ وَلِىِّۦ فِى ٱلدُّنْيَا وَٱلْـَٔاخِرَةِ تَوَفَّنِى مُسْلِمًا وَأَلْحِقْنِى بِٱلصَّٰلِحِينَ",
    "fullArabic": "رَبِّ قَدْ ءَاتَيْتَنِى مِنَ ٱلْمُلْكِ وَعَلَّمْتَنِى مِن تَأْوِيلِ ٱلْأَحَادِيثِ فَاطِرَ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ أَنتَ وَلِىِّۦ فِى ٱلدُّنْيَا وَٱلْـَٔاخِرَةِ تَوَفَّنِى مُسْلِمًا وَأَلْحِقْنِى بِٱلصَّٰلِحِينَ",
    "segmentArabic": [
      "رَبِّ قَدْ ءَاتَيْتَنِى مِنَ ٱلْمُلْكِ وَعَلَّمْتَنِى مِن تَأْوِيلِ ٱلْأَحَادِيثِ فَاطِرَ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ أَنتَ وَلِىِّۦ فِى ٱلدُّنْيَا وَٱلْـَٔاخِرَةِ تَوَفَّنِى مُسْلِمًا وَأَلْحِقْنِى بِٱلصَّٰلِحِينَ"
    ]
  },
  {
    "id": "q_7_89",
    "verse": "7:89",
    "url": "https://quran.com/7/89",
    "keys": [
      "7:89"
    ],
    "start": "رَبَّنَا ٱفْتَحْ",
    "note": "Большая часть аята — речь Шуайба о вере; собственно просьба начинается в конце",
    "excerptKind": "full_verse",
    "narrative": "قَدِ ٱفْتَرَيْنَا عَلَى ٱللَّهِ كَذِبًا إِنْ عُدْنَا فِى مِلَّتِكُم بَعْدَ إِذْ نَجَّىٰنَا ٱللَّهُ مِنْهَا وَمَا يَكُونُ لَنَآ أَن نَّعُودَ فِيهَآ إِلَّآ أَن يَشَآءَ ٱللَّهُ رَبُّنَا وَسِعَ رَبُّنَا كُلَّ شَىْءٍ عِلْمًا عَلَى ٱللَّهِ تَوَكَّلْنَا",
    "supplication": "رَبَّنَا ٱفْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِٱلْحَقِّ وَأَنتَ خَيْرُ ٱلْفَٰتِحِينَ",
    "fullArabic": "قَدِ ٱفْتَرَيْنَا عَلَى ٱللَّهِ كَذِبًا إِنْ عُدْنَا فِى مِلَّتِكُم بَعْدَ إِذْ نَجَّىٰنَا ٱللَّهُ مِنْهَا وَمَا يَكُونُ لَنَآ أَن نَّعُودَ فِيهَآ إِلَّآ أَن يَشَآءَ ٱللَّهُ رَبُّنَا وَسِعَ رَبُّنَا كُلَّ شَىْءٍ عِلْمًا عَلَى ٱللَّهِ تَوَكَّلْنَا رَبَّنَا ٱفْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِٱلْحَقِّ وَأَنتَ خَيْرُ ٱلْفَٰتِحِينَ",
    "segmentArabic": [
      "قَدِ ٱفْتَرَيْنَا عَلَى ٱللَّهِ كَذِبًا إِنْ عُدْنَا فِى مِلَّتِكُم بَعْدَ إِذْ نَجَّىٰنَا ٱللَّهُ مِنْهَا وَمَا يَكُونُ لَنَآ أَن نَّعُودَ فِيهَآ إِلَّآ أَن يَشَآءَ ٱللَّهُ رَبُّنَا وَسِعَ رَبُّنَا كُلَّ شَىْءٍ عِلْمًا عَلَى ٱللَّهِ تَوَكَّلْنَا رَبَّنَا ٱفْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِٱلْحَقِّ وَأَنتَ خَيْرُ ٱلْفَٰتِحِينَ"
    ]
  },
  {
    "id": "q_21_89",
    "verse": "21:89",
    "url": "https://quran.com/21/89",
    "keys": [
      "21:89"
    ],
    "start": "رَبِّ لَا تَذَرْنِى",
    "note": "Повествование о Закарии до прямой речи; просьба о потомстве, не о любой форме одиночества",
    "excerptKind": "full_verse",
    "narrative": "وَزَكَرِيَّآ إِذْ نَادَىٰ رَبَّهُۥ",
    "supplication": "رَبِّ لَا تَذَرْنِى فَرْدًا وَأَنتَ خَيْرُ ٱلْوَٰرِثِينَ",
    "fullArabic": "وَزَكَرِيَّآ إِذْ نَادَىٰ رَبَّهُۥ رَبِّ لَا تَذَرْنِى فَرْدًا وَأَنتَ خَيْرُ ٱلْوَٰرِثِينَ",
    "segmentArabic": [
      "وَزَكَرِيَّآ إِذْ نَادَىٰ رَبَّهُۥ رَبِّ لَا تَذَرْنِى فَرْدًا وَأَنتَ خَيْرُ ٱلْوَٰرِثِينَ"
    ]
  },
  {
    "id": "q_5_114",
    "verse": "5:114",
    "url": "https://quran.com/5/114",
    "keys": [
      "5:114"
    ],
    "start": "ٱللَّهُمَّ رَبَّنَآ",
    "note": "Вводное 'Иса сын Марьям сказал' — не слова мольбы; контекст просьбы о небесной трапезе",
    "excerptKind": "full_verse",
    "narrative": "قَالَ عِيسَى ٱبْنُ مَرْيَمَ",
    "supplication": "ٱللَّهُمَّ رَبَّنَآ أَنزِلْ عَلَيْنَا مَآئِدَةً مِّنَ ٱلسَّمَآءِ تَكُونُ لَنَا عِيدًا لِّأَوَّلِنَا وَءَاخِرِنَا وَءَايَةً مِّنكَ وَٱرْزُقْنَا وَأَنتَ خَيْرُ ٱلرَّٰزِقِينَ",
    "fullArabic": "قَالَ عِيسَى ٱبْنُ مَرْيَمَ ٱللَّهُمَّ رَبَّنَآ أَنزِلْ عَلَيْنَا مَآئِدَةً مِّنَ ٱلسَّمَآءِ تَكُونُ لَنَا عِيدًا لِّأَوَّلِنَا وَءَاخِرِنَا وَءَايَةً مِّنكَ وَٱرْزُقْنَا وَأَنتَ خَيْرُ ٱلرَّٰزِقِينَ",
    "segmentArabic": [
      "قَالَ عِيسَى ٱبْنُ مَرْيَمَ ٱللَّهُمَّ رَبَّنَآ أَنزِلْ عَلَيْنَا مَآئِدَةً مِّنَ ٱلسَّمَآءِ تَكُونُ لَنَا عِيدًا لِّأَوَّلِنَا وَءَاخِرِنَا وَءَايَةً مِّنكَ وَٱرْزُقْنَا وَأَنتَ خَيْرُ ٱلرَّٰزِقِينَ"
    ]
  }
];
assert.equal(cards.length,43,'Catalog size changed: update review inventory');
assert.equal(new Set(specs.map(s=>s.id)).size,6);
for(const s of specs){
  const card=byId.get(s.id);
  assert.ok(card,s.id+': missing');
  assert.equal(clean(card.arabicText),clean(s.fullArabic),s.id+': source snapshot changed');
  assert.equal(clean(card.fullVerseArabic),clean(s.fullArabic),s.id+': full source reading changed');
  assert.equal(card.originKind,'quran',s.id+': Quran origin changed');
  assert.equal(card.excerptKind,s.excerptKind,s.id+': passage scope changed');
  assert.ok(card.sourceRefs?.some(ref=>ref.number===s.verse&&ref.url===s.url),s.id+': source mismatch');
  assert.deepEqual(card.segments.map(x=>x.verseKey),s.keys,s.id+': verse mapping changed');
  assert.deepEqual(card.segments.map(x=>clean(x.arabicText)),s.segmentArabic.map(clean),s.id+': segment text changed');
  assert.equal(clean(card.segments.map(x=>x.arabicText).join(' ')),clean(s.fullArabic),s.id+': total segments != full reading');
  assert.equal(clean(card.segments.map(x=>x.transliterationRu).join(' ')),clean(card.transliterationRu),s.id+': transliteration not aligned');
  assert.equal(clean(card.segments.map(x=>x.translationRu).join(' ')),clean(card.translationRu),s.id+': translation not aligned');
  assert.equal(clean([s.narrative,s.supplication].filter(Boolean).join(' ')),clean(s.fullArabic),s.id+': narrative/dua boundary changed');
  assert.ok(s.supplication.startsWith(s.start),s.id+': supplication opening changed');
  assert.equal(card.repetitionRule,null,s.id+': unsupported fixed repeat rule');
  assert.equal(card.timingRule,null,s.id+': unsupported fixed timing rule');
  assert.notEqual(card.reviewStatus,'expert_checked',s.id+': no independent expert approval');
}
console.log('PASS six Quranic prophet appeals: source links, boundaries, segments and metadata');
console.log('NOTE Recitation, Tajwid, independent Tanzil glyph-by-glyph and Russian phonetics NOT verified');
