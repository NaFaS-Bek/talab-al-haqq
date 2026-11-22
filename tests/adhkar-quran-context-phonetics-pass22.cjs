'use strict';
// Pass 22: specific Quranic narrative/dua boundaries and human phonetic queue.
// This is a REGRESSION of research anchors, not a Quranic recitation certificate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const content=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const cards=[...(content.catalog?.entries||[]),...(content.catalog_additions?.entries||[])];
const byId=new Map(cards.map(c=>[c.id,c]));
const n=v=>String(v??'').normalize('NFC').replace(/\s+/g,' ').trim();
const specs=[
 {id:'q_17_24',verses:['17:24'],links:['https://quran.com/17/24'],kind:'full_verse',
  prefix:'وَٱخْفِضْ لَهُمَا جَنَاحَ ٱلذُّلِّ مِنَ ٱلرَّحْمَةِ وَقُل',
  start:'رَّبِّ ٱرْحَمْهُمَا',arabic:'ٱخْفِضْ',ru:'Вахфид'},
 {id:'q_2_250',verses:['2:250'],links:['https://quran.com/2/250'],kind:'full_verse',
  prefix:'وَلَمَّا بَرَزُوا۟ لِجَالُوتَ وَجُنُودِهِۦ قَالُوا۟',
  start:'رَبَّنَآ أَفْرِغْ',arabic:'قَالُوا۟',ru:'калю'},
 {id:'q_27_19',verses:['27:19'],links:['https://quran.com/27/19'],kind:'full_verse',
  prefix:'فَتَبَسَّمَ ضَاحِكًا مِّن قَوْلِهَا وَقَالَ',
  start:'رَبِّ أَوْزِعْنِىٓ',arabic:'أَوْزِعْنِىٓ',ru:'аузи‘ни'},
 {id:'q_7_23',verses:['7:23'],links:['https://quran.com/7/23'],kind:'full_verse',
  prefix:'قَالَا',start:'رَبَّنَا ظَلَمْنَآ',arabic:'قَالَا',ru:'Каля'},
 {id:'q_71_28',verses:['71:28'],links:['https://quran.com/71/28'],kind:'full_verse',
  prefix:'',start:'رَّبِّ ٱغْفِرْ',arabic:'ٱلظَّٰلِمِينَ',ru:'з-залимина',
  context:'وَلَا تَزِدِ ٱلظَّٰلِمِينَ'},
 {id:'q_14_40_41',verses:['14:40','14:41'],links:['https://quran.com/14/40'],kind:'verse_range',
  prefix:'',start:'رَبِّ ٱجْعَلْنِى',arabic:'ٱلصَّلَوٰةِ',ru:'с-саляти'}
];
assert.equal(cards.length,43,'Catalog count changed; revisit reviewed/remaining inventory');
assert.equal(new Set(specs.map(s=>s.id)).size,6,'Each review record must be distinct');
assert.equal(specs.reduce((sum,s)=>sum+s.verses.length,0),7,'Six cards refer to seven verses');
for(const spec of specs){
 const c=byId.get(spec.id);
 assert(c,'Missing source card '+spec.id);
 assert.equal(c.originKind,'quran',spec.id+': must remain Quran');
 assert.equal(c.contentKind,'dua',spec.id+': reviewed as Quranic dua content');
 assert.equal(c.excerptKind,spec.kind,spec.id+': verse scope changed');
 for(const url of spec.links)assert(c.sourceRefs?.some(ref=>ref.url===url),
  spec.id+': missing precise Quran URL '+url);
 // Four older single-verse cards keep the precise verse in sourceRefs but
 // do not have verseKey on their single teaching segment. Do not invent it.
 const mapped=(c.segments||[]).map(s=>s.verseKey).filter(Boolean);
 if(mapped.length){
  assert.deepEqual(mapped,spec.verses,
   spec.id+': explicit verse-segment source mapping changed');
 }else{
  assert.equal(spec.verses.length,1,
   spec.id+': multiple verses require explicit segment-to-verse mapping');
  assert.equal(c.segments?.length,1,
   spec.id+': legacy single-verse source must be one learning segment');
  assert(c.sourceRefs.some(ref=>
    ref.number===spec.verses[0] && ref.url===spec.links[0]),
   spec.id+': unnumbered segment must retain exact verse source reference');
 }
 for(const field of ['arabicText','transliterationRu','translationRu']){
  assert.equal(n(c.segments.map(s=>s[field]).join(' ')),n(c[field]),
   spec.id+': segment mismatch in '+field);
 }
 assert.equal(n(c.arabicText),n(c.fullVerseArabic),
  spec.id+': full verse and visible source text must agree');
 const expected=n((spec.prefix ? spec.prefix+' ' : '')+spec.start);
 assert(n(c.arabicText).startsWith(expected),
  spec.id+': narrative/quotation boundary changed');
 assert(c.segments.some(s=>s.arabicText.includes(spec.arabic)&&
  s.transliterationRu.includes(spec.ru)),
  spec.id+': phonetic review anchor no longer aligned in one segment');
 assert.equal(c.repetitionRule,null,spec.id+': no automatic repetition prescription from Quran alone');
 assert.equal(c.timingRule,null,spec.id+': no automatic clock-time prescription from Quran alone');
 assert.notEqual(c.reviewStatus,'expert_checked',
  spec.id+': no independent audio/linguistic review was performed');
 if(spec.context)assert(c.arabicText.includes(spec.context),
  spec.id+': historically sensitive conclusion must not be silently omitted');
}
assert.equal(byId.get('q_2_250').arabicText.split(' ')[4], 'قَالُوا۟',
 '2:250 plural narrative verb must not be confused with 7:23 dual form');
assert.equal(byId.get('q_7_23').arabicText.split(' ')[0], 'قَالَا',
 '7:23 narrative verb is dual, do not conflate with 2:250');
assert.deepEqual(byId.get('q_14_40_41').segments.map(s=>s.verseKey),['14:40','14:41']);
console.log('PASS pass22: 6 Quranic dua cards, 7 verse IDs, context/recitation boundary, phonetic review anchors');
console.log('NOT CERTIFIED: Arabic pronunciation, Tajwid, full diacritics, Russian phonetics or translations');
