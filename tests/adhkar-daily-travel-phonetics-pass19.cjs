'use strict';
// Pass 19: source-bound review of six hadith dua cards, not an expert tajwid
// or chain-of-narration certification. No source data are rewritten.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const entries=[...(root.catalog?.entries||[]),...(root.catalog_additions?.entries||[])];
const byId=new Map(entries.map(x=>[x.id,x]));
const norm=s=>String(s||'').normalize('NFC').replace(/\s+/g,' ').trim();
const cases=[
 {id:'h_bukhari_6324_sleep',source:'https://sunnah.com/bukhari:6324',
  arabic:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
  russian:'Бисмика-Ллахумма амуту ва ахья.'},
 {id:'h_bukhari_6324_waking',source:'https://sunnah.com/bukhari:6324',
  arabic:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا، وَإِلَيْهِ النُّشُورُ',
  russian:'Аль-хамду лилляхи-ллязи ахьяна ба‘да ма аматана, ва иляйхи-н-нушур.'},
 {id:'h_tirmidhi_1858_before',source:'https://sunnah.com/tirmidhi:1858',
  arabic:'بِسْمِ اللَّهِ',russian:'Бисмиллях.'},
 {id:'h_tirmidhi_1858_forgot',source:'https://sunnah.com/tirmidhi:1858',
  arabic:'بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ',
  russian:'Бисмилляхи фи аввалихи ва ахирих.'},
 {id:'h_tirmidhi_3458',source:'https://sunnah.com/tirmidhi:3458',
  arabic:'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلاَ قُوَّةٍ',
  russian:'Аль-хамду лилляхи-ллязи ат‘амани хаза ва разаканихи мин гайри хавлин минни ва ля кувватин.'},
 {id:'h_muslim_1342',source:'https://sunnah.com/muslim:1342',
  arabicStart:'سُبْحَانَ الَّذِي سَخَّرَ لَنَا',
  arabicEnding:'فِي الْمَالِ وَالأَهْلِ',
  russianEnding:'фи-ль-мали ва-ль-ахль.',segments:6}
];
assert.equal(new Set(cases.map(s=>s.id)).size,6);
for(const spec of cases){
 const card=byId.get(spec.id);
 assert(card,'Missing card '+spec.id);
 assert.equal(card.originKind,'hadith','Origin must remain a hadith: '+spec.id);
 assert.equal(card.excerptKind,'supplication_excerpt','Narration and invocation boundaries must stay separate: '+spec.id);
 assert(card.sourceRefs?.some(ref=>ref.url===spec.source),'Cited source changed: '+spec.id);
 if(spec.arabic)assert.equal(norm(card.arabicText),norm(spec.arabic),
  'Source-linked Arabic text changed; manually verify before changing: '+spec.id);
 if(spec.arabicStart)assert(card.arabicText.startsWith(spec.arabicStart),
  'Hadith excerpt beginning changed: '+spec.id);
 if(spec.arabicEnding)assert(card.arabicText.endsWith(spec.arabicEnding),
  'Hadith excerpt end changed: '+spec.id);
 if(spec.russian)assert.equal(card.transliterationRu,spec.russian,
  'Russian reading cue changed without new source review: '+spec.id);
 if(spec.russianEnding)assert(card.transliterationRu.endsWith(spec.russianEnding),
  'Russian excerpt ending changed without source review: '+spec.id);
 assert.equal(card.reviewStatus,'draft','Do not silently claim independent specialist review');
 assert.deepEqual(card.repetitionRule?.stages?.map(s=>s.count)||[],[],
  'No fixed repetition count is given by these cited variants: '+spec.id);
 assert(!card.timingRule?.periods?.length,
  'Contextual moments (sleep, food, journey) are not fixed clock-time schedules');
 assert(Array.isArray(card.segments)&&card.segments.length>0,'Missing learning segments');
 if(spec.segments)assert.equal(card.segments.length,spec.segments,'Travel segmentation changed');
 assert.equal(norm(card.segments.map(x=>x.arabicText).join(' ')),norm(card.arabicText),
  'Parent Arabic and segments differ: '+spec.id);
 assert.equal(norm(card.segments.map(x=>x.transliterationRu).join(' ')),norm(card.transliterationRu),
  'Parent transliteration and segments differ: '+spec.id);
}
const travel=byId.get('h_muslim_1342');
assert(travel.sourceRefs.some(x=>x.url==='https://quran.com/43/13-14'),
  'Quranic opening must be cited separately');
assert(!travel.arabicText.includes('آيِبُونَ'),'Returning addition is not in this departing excerpt');
assert(!travel.arabicText.startsWith('اللَّهُ أَكْبَرُ'),
 'Three takbirs occur in narrative before the excerpt, not in the recited Arabic quote');
const app=fs.readFileSync('app.js','utf8');
for(const id of ['h_tirmidhi_1858_forgot','h_tirmidhi_3458']){
 assert(app.includes(id+': {'),'Per-card reading note absent: '+id);
}
assert(app.includes('data-supplication-excerpt-context'),
 'Muslim 1342 narrative context must be distinguishable from quoted Arabic');
assert(app.includes('sourceLinkedExcerptContexts'),
 'Missing strict source+Arabic excerpt note guard');
console.log('PASS: six source-linked hadith cards, segmentation, counting boundaries, pausal notes and travel excerpt distinctions');
console.log('NOT CERTIFIED: acoustic makharij, full diacritic-by-diacritic expert validation, isnad regrading or legal rulings');
