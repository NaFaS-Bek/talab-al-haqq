'use strict';
// Pass 23: source context, quotation boundaries, phonetic review anchors.
// A machine regression is NOT a specialist Arabic/recitation/translation certificate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const cards = [...(root.catalog?.entries||[]),...(root.catalog_additions?.entries||[])];
const byId = new Map(cards.map(c=>[c.id,c]));
const norm = x=>String(x??'').normalize('NFC').replace(/\\s+/g,' ').trim();
const specs = [
  {
    "id": "q_2_127_128",
    "verse": "2:127–128",
    "url": "https://quran.com/2/127",
    "keys": [
      "2:127",
      "2:128"
    ],
    "kind": "verse_range",
    "before": "وَإِذْ يَرْفَعُ إِبْرَٰهِـۧمُ ٱلْقَوَاعِدَ مِنَ ٱلْبَيْتِ وَإِسْمَٰعِيلُ",
    "dua": "رَبَّنَا تَقَبَّلْ",
    "phonArabic": "ٱلسَّمِيعُ",
    "phonRu": "с-сами‘у"
  },
  {
    "id": "q_26_169",
    "verse": "26:169",
    "url": "https://quran.com/26/169",
    "keys": [
      "26:169"
    ],
    "kind": "full_verse",
    "before": "",
    "dua": "رَبِّ نَجِّنِى",
    "phonArabic": "نَجِّنِى",
    "phonRu": "наджжини"
  },
  {
    "id": "q_12_101",
    "verse": "12:101",
    "url": "https://quran.com/12/101",
    "keys": [
      "12:101"
    ],
    "kind": "full_verse",
    "before": "",
    "dua": "رَبِّ قَدْ ءَاتَيْتَنِى",
    "phonArabic": "ٱلْأَحَادِيثِ",
    "phonRu": "ахадис"
  },
  {
    "id": "q_21_83",
    "verse": "21:83",
    "url": "https://quran.com/21/83",
    "keys": [
      "21:83"
    ],
    "kind": "full_verse",
    "before": "وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُۥٓ",
    "dua": "أَنِّى مَسَّنِىَ ٱلضُّرُّ",
    "phonArabic": "ٱلضُّرُّ",
    "phonRu": "д-дурру"
  },
  {
    "id": "q_7_89",
    "verse": "7:89",
    "url": "https://quran.com/7/89",
    "keys": [
      "7:89"
    ],
    "kind": "full_verse",
    "before": "قَدِ ٱفْتَرَيْنَا عَلَى ٱللَّهِ كَذِبًا إِنْ عُدْنَا فِى مِلَّتِكُم بَعْدَ إِذْ نَجَّىٰنَا ٱللَّهُ مِنْهَا وَمَا يَكُونُ لَنَآ أَن نَّعُودَ فِيهَآ إِلَّآ أَن يَشَآءَ ٱللَّهُ رَبُّنَا وَسِعَ رَبُّنَا كُلَّ شَىْءٍ عِلْمًا عَلَى ٱللَّهِ تَوَكَّلْنَا",
    "dua": "رَبَّنَا ٱفْتَحْ",
    "phonArabic": "رَبَّنَا ٱفْتَحْ",
    "phonRu": "Раббана-ф-тах"
  },
  {
    "id": "q_20_25_28",
    "verse": "20:25–28",
    "url": "https://quran.com/20/25",
    "keys": [
      "20:25",
      "20:26",
      "20:27",
      "20:28"
    ],
    "kind": "full_verses",
    "before": "قَالَ",
    "dua": "رَبِّ ٱشْرَحْ",
    "phonArabic": "ٱشْرَحْ",
    "phonRu": "Рабби-шрах"
  },
  {
    "id": "q_21_87",
    "verse": "21:87",
    "url": "https://quran.com/21/87",
    "keys": [
      "21:87"
    ],
    "kind": "full_verse",
    "before": "وَذَا ٱلنُّونِ إِذ ذَّهَبَ مُغَٰضِبًا فَظَنَّ أَن لَّن نَّقْدِرَ عَلَيْهِ فَنَادَىٰ فِى ٱلظُّلُمَٰتِ أَن",
    "dua": "لَّآ إِلَٰهَ إِلَّآ أَنتَ",
    "phonArabic": "ٱلظُّلُمَٰتِ",
    "phonRu": "з-зулюмати"
  },
  {
    "id": "q_21_89",
    "verse": "21:89",
    "url": "https://quran.com/21/89",
    "keys": [
      "21:89"
    ],
    "kind": "full_verse",
    "before": "وَزَكَرِيَّآ إِذْ نَادَىٰ رَبَّهُۥ",
    "dua": "رَبِّ لَا تَذَرْنِى",
    "phonArabic": "ٱلْوَٰرِثِينَ",
    "phonRu": "варисин"
  },
  {
    "id": "q_5_114",
    "verse": "5:114",
    "url": "https://quran.com/5/114",
    "keys": [
      "5:114"
    ],
    "kind": "full_verse",
    "before": "قَالَ عِيسَى ٱبْنُ مَرْيَمَ",
    "dua": "ٱللَّهُمَّ رَبَّنَآ",
    "phonArabic": "ٱرْزُقْنَا",
    "phonRu": "варзукна"
  }
];
assert.equal(cards.length,43,'Catalog count changed: revisit reviewed inventory');
assert.equal(new Set(specs.map(x=>x.id)).size,9,'Expected nine unique Quranic appeals');
assert.equal(specs.reduce((n,x)=>n+x.keys.length,0),14,'Expected 14 verses across nine cards');
for(const spec of specs){
 const card=byId.get(spec.id);
 assert(card,'Missing Quranic card: '+spec.id);
 assert.equal(card.originKind,'quran',spec.id+': origin');
 assert.equal(card.contentKind,'dua',spec.id+': content kind');
 assert.equal(card.excerptKind,spec.kind,spec.id+': excerpt scope');
 assert(card.sourceRefs?.some(s=>s.collection==='Коран'&&s.number===spec.verse&&s.url===spec.url),
  spec.id+': verse and primary-source mapping changed');
 assert.deepEqual(card.segments?.map(x=>x.verseKey),spec.keys,spec.id+': verse boundaries changed');
 assert.equal(norm(card.fullVerseArabic),norm(card.arabicText),
  spec.id+': whole verse/full source Arabic changed');
 for(const field of ['arabicText','transliterationRu','translationRu']){
  assert.equal(norm(card.segments.map(x=>x[field]).join(' ')),norm(card[field]),
   spec.id+': parent and segmented '+field+' mismatch');
 }
 const expected = norm((spec.before?spec.before+' ':'')+spec.dua);
 assert(norm(card.arabicText).startsWith(expected),spec.id+': narration to dua boundary changed');
 assert(card.segments.some(s=>s.arabicText.includes(spec.phonArabic)&&
  s.transliterationRu.includes(spec.phonRu)),
  spec.id+': current phonetic review anchor lost or split');
 assert.equal(card.repetitionRule,null,spec.id+': do not prescribe recitation count from Quran citation alone');
 assert.equal(card.timingRule,null,spec.id+': do not prescribe fixed clock time from Quran citation alone');
 assert.notEqual(card.reviewStatus,'expert_checked',spec.id+': independent expert review not performed');
}
assert(byId.get('q_21_87').arabicText.includes('فَنَادَىٰ فِى ٱلظُّلُمَٰتِ أَن لَّآ إِلَٰهَ'),
 'Do not detach Quran 21:87 quoted supplication from its context-specific conjunction');
assert.deepEqual(byId.get('q_20_25_28').segments.map(x=>x.verseKey),
 ['20:25','20:26','20:27','20:28'],'Musa appeal: retain four verse boundaries');
console.log('PASS pass23: 9 source-grounded Quranic cards, 14 verse mappings, quotation boundaries and human review anchors');
console.log('NOT CERTIFIED: independent phonetics, tajwid, full Arabic diacritic review, translations or expert grading');
