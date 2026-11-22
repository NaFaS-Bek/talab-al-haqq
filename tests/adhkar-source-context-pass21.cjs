'use strict';
// Pass 21: context, source, and count invariants for six remaining hadith cards.
// These checks are NOT independent phonetic, isnad, theological, or translation review.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const entries=[...(root.catalog?.entries||[]),...(root.catalog_additions?.entries||[])];
const byId=new Map(entries.map(entry=>[entry.id,entry]));
const norm=s=>String(s||'').normalize('NFC').replace(/\s+/g,' ').trim();
const cases=[
 {id:'h_muslim_2202',source:'https://sunnah.com/muslim:2202',kind:'supplication_excerpt',
  start:'بِاسْمِ اللَّهِ',end:'وَأُحَاذِرُ',counts:[3,7]},
 {id:'h_bukhari_6369',source:'https://sunnah.com/bukhari:6369',kind:'supplication_excerpt',
  start:'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ',end:'وَغَلَبَةِ الرِّجَالِ',counts:[]},
 {id:'h_bukhari_3282',source:'https://sunnah.com/bukhari:3282',kind:'supplication_excerpt',
  start:'أَعُوذُ بِاللَّهِ',end:'مِنَ الشَّيْطَانِ',counts:[]},
 {id:'h_muslim_918b',source:'https://sunnah.com/muslim:918b',kind:'supplication_excerpt',
  start:'إِنَّا لِلَّهِ',end:'مِنْهَا',counts:[]},
 {id:'h_muslim_2725a',source:'https://sunnah.com/muslim:2725a',kind:'supplication_excerpt',
  start:'اللَّهُمَّ اهْدِنِي',end:'وَسَدِّدْنِي',counts:[]},
 {id:'h_muslim_2727a',source:'https://sunnah.com/muslim:2727a',kind:'dhikr_instruction',
  start:'أَنْ تُكَبِّرَا اللَّهَ',end:'ثَلاَثًا وَثَلاَثِينَ',counts:[34,33,33]}
];
assert.equal(new Set(cases.map(s=>s.id)).size,6);
assert.equal(entries.length,43,'Catalog size changed: review every required card and tally');
for(const spec of cases){
 const card=byId.get(spec.id);
 assert(card,'Missing card: '+spec.id);
 assert.equal(card.originKind,'hadith','Card origin changed: '+spec.id);
 assert.equal(card.excerptKind,spec.kind,'Narration vs supplication distinction changed: '+spec.id);
 assert(card.sourceRefs?.some(r=>r.url===spec.source),'Cited source changed: '+spec.id);
 assert(norm(card.arabicText).startsWith(norm(spec.start)),'Quote beginning changed: '+spec.id);
 assert(norm(card.arabicText).endsWith(norm(spec.end)),'Quote ending changed: '+spec.id);
 assert.deepEqual(card.repetitionRule?.stages?.map(s=>s.count)||[],spec.counts,
  'Repetition count or stage order changed: '+spec.id);
 assert(Array.isArray(card.segments)&&card.segments.length>0,'Missing learning segments: '+spec.id);
 for(const field of ['arabicText','transliterationRu','translationRu']){
  assert.equal(norm(card.segments.map(s=>s[field]).join(' ')),norm(card[field]),
   'Segment/full text inconsistent ('+field+'): '+spec.id);
 }
 assert.notEqual(card.reviewStatus,'expert_checked',
  'No independent specialist review is established for: '+spec.id);
}
const pain=byId.get('h_muslim_2202');
assert.equal(pain.repetitionRule.stages.length,2,
 'Muslim 2202 has two distinct stages, not one repeated full prayer');
const sleep=byId.get('h_muslim_2727a');
assert.equal(sleep.excerptKind,'dhikr_instruction',
 'Muslim 2727a is narrated dhikr instruction, not a prescribed recitation of the narrative');
assert(!sleep.arabicText.startsWith('اللَّهُ أَكْبَرُ'),
 'Do not substitute takbir recitation for the narrated instruction in this card');
const guidance=byId.get('h_muslim_2725a');
assert(!guidance.arabicText.includes('الطَّرِيقَ'),
 'The analogy about the road belongs to hadith explanation, not the quoted dua');
console.log('PASS: 6 hadith cards, 2-stage pain dhikr, pre-sleep 34/33/33, source links and quotation boundaries');
console.log('NOT CERTIFIED: pronunciation, vocalization, hadith grading, full translations or independent religious expertise');
