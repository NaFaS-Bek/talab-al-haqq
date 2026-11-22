'use strict';
// Limited source/phonetics regression. NOT an audio or tajwid certification.
// Published hadith references:
//   https://sunnah.com/muslim:2692
//   https://sunnah.com/muslim:2708a
//   https://sunnah.com/bukhari:5743
const assert=require('node:assert/strict');
const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const entries=[...(data.catalog?.entries||[]),...(data.catalog_additions?.entries||[])];
const byId=new Map(entries.map(x=>[x.id,x]));
const white=s=>String(s||'').normalize('NFC').replace(/\s+/g,' ').trim();
const unvowel=s=>white(s).replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g,'');
const specs=[
 {id:'h_muslim_2692',url:'https://sunnah.com/muslim:2692',
   words:'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',count:100,
   kind:'supplication_excerpt'},
 {id:'h_muslim_2708a',url:'https://sunnah.com/muslim:2708a',
   words:'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
   count:0,kind:'supplication_excerpt'},
 {id:'h_bukhari_5743',url:'https://sunnah.com/bukhari:5743',
   words:'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَاسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ، شِفَاءً لاَ يُغَادِرُ سَقَمًا',
   count:0,kind:'supplication_excerpt'},
];
const report=[];
for(const spec of specs){
 const c=byId.get(spec.id);
 assert(c,'Missing card '+spec.id);
 assert.equal(c.originKind,'hadith','Wrong origin type: '+spec.id);
 assert(c.sourceRefs?.some(r=>r.url===spec.url),'Wrong cited hadith: '+spec.id);
 const compact=s=>unvowel(s).replace(/[،؛.\s]/g,'');
 assert(compact(c.arabicText).includes(compact(spec.words)),
   'Arabic wording differs from the published cited formula; manual review required: '+spec.id);
 assert.equal(c.excerptKind,spec.kind,'Do not mix the narrated action with the supplication: '+spec.id);
 const counts=c.repetitionRule?.stages?.map(s=>s.count)||[];
 if(spec.count)assert.deepEqual(counts,[spec.count],'Wrong verified source count: '+spec.id);
 else assert.deepEqual(counts,[],'Do not invent a prescribed repetition count: '+spec.id);
 assert(Array.isArray(c.segments)&&c.segments.length>0,'Missing educational segments: '+spec.id);
 assert.equal(white(c.segments.map(s=>s.arabicText).join(' ')),white(c.arabicText),
  'Arabic segments differ from parent: '+spec.id);
 assert.equal(white(c.segments.map(s=>s.transliterationRu).join(' ')),white(c.transliterationRu),
  'Russian segments differ from parent: '+spec.id);
 if(spec.id==='h_muslim_2692'){
  assert.match(c.transliterationRu,/би-хамдихи/i,'Must preserve continuous final -hi');
  assert.match(c.transliterationNoteRu||'',/остановк/i,'Pausal form note must remain');
 }
 report.push({id:spec.id,source:spec.url,reviewStatus:c.reviewStatus,
   arabic:c.arabicText,transliteration:c.transliterationRu,
   pronunciationNote:c.transliterationNoteRu||null,
   transliterationEnding:c.transliterationRu.slice(-80),
   lastSegment:c.segments.at(-1),counts,
   automaticExpertCertification:false});
}
console.log('PASS verified source-linked excerpts, literal segmentation and repetition boundaries for 3 cards');
console.log('SOURCE_AUDIT_EXCERPTS='+JSON.stringify(report));
console.log('NOT CERTIFIED: phonetic realization, all Arabic diacritics, translations, or specialist review');
