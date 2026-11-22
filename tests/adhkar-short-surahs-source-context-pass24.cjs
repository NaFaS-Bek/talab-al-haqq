'use strict';
// Pass 24: seven short surah context, order, and hadith-linked counting guards.
// A passing regression is NOT a specialist Quran recitation/translation certificate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const cards=[...(root.catalog?.entries||[]),...(root.catalog_additions?.entries||[])];
const byId=new Map(cards.map(c=>[c.id,c]));
const norm=x=>String(x??'').normalize('NFC').replace(/\s+/g,' ').trim();
const specs=[
  {
    "id": "q_surah_1",
    "num": 1,
    "verses": 7,
    "first": "بِسْمِ ٱللَّهِ",
    "last": "ٱلضَّآلِّينَ",
    "arabic": "ٱلضَّآلِّينَ",
    "ru": "даллин",
    "hasSchedule": false
  },
  {
    "id": "q_surah_103",
    "num": 103,
    "verses": 3,
    "first": "وَٱلْعَصْرِ",
    "last": "وَتَوَاصَوْا۟ بِٱلصَّبْرِ",
    "arabic": "وَٱلْعَصْرِ",
    "ru": "Валь-‘аср",
    "hasSchedule": false
  },
  {
    "id": "q_surah_108",
    "num": 108,
    "verses": 3,
    "first": "إِنَّآ أَعْطَيْنَٰكَ",
    "last": "هُوَ ٱلْأَبْتَرُ",
    "arabic": "ٱلْكَوْثَرَ",
    "ru": "Каусар",
    "hasSchedule": false
  },
  {
    "id": "q_surah_109",
    "num": 109,
    "verses": 6,
    "first": "قُلْ يَٰٓأَيُّهَا",
    "last": "وَلِىَ دِينِ",
    "arabic": "عَبَدتُّمْ",
    "ru": "‘абаттум",
    "hasSchedule": false
  },
  {
    "id": "q_surah_112",
    "num": 112,
    "verses": 4,
    "first": "قُلْ هُوَ ٱللَّهُ",
    "last": "كُفُوًا أَحَدٌۢ",
    "arabic": "كُفُوًا",
    "ru": "куфуван",
    "hasSchedule": true
  },
  {
    "id": "q_surah_113",
    "num": 113,
    "verses": 5,
    "first": "قُلْ أَعُوذُ بِرَبِّ",
    "last": "حَاسِدٍ إِذَا حَسَدَ",
    "arabic": "ٱلنَّفَّٰثَٰتِ",
    "ru": "наффасати",
    "hasSchedule": true
  },
  {
    "id": "q_surah_114",
    "num": 114,
    "verses": 6,
    "first": "قُلْ أَعُوذُ بِرَبِّ",
    "last": "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
    "arabic": "ٱلْوَسْوَاسِ",
    "ru": "васваси",
    "hasSchedule": true
  }
];
assert.equal(cards.length,43,'Review catalog size and editorial cycle when expanding');
assert.equal(new Set(specs.map(s=>s.id)).size,7,'Expected seven distinct surah cards');
assert.equal(specs.reduce((total,s)=>total+s.verses,0),34,'Expected 34 verses across seven surahs');
for(const s of specs){
 const c=byId.get(s.id);
 assert(c,'Missing surah '+s.id);
 assert.equal(c.originKind,'quran',s.id+': origin');
 assert.equal(c.contentKind,'dhikr',s.id+': surah is not a fabricated standalone supplication');
 assert.equal(c.excerptKind,'full_surah',s.id+': retain entire surah');
 assert.equal(c.segments?.length,s.verses,s.id+': verse count');
 assert.deepEqual(c.segments.map(x=>x.verseKey),
  Array.from({length:s.verses},(_,i)=>s.num+':'+(i+1)),s.id+': verse order');
 assert(c.sourceRefs.some(r=>r.collection==='Коран'&&r.number===s.num+':1–'+s.verses&&r.url==='https://quran.com/'+s.num+'/1'),
  s.id+': Quran source missing');
 assert(norm(c.arabicText).startsWith(norm(s.first)),s.id+': surah start changed');
 assert(norm(c.arabicText).endsWith(norm(s.last)),s.id+': surah end changed');
 for(const field of ['arabicText','transliterationRu','translationRu']){
  assert.equal(norm(c.segments.map(x=>x[field]).join(' ')),norm(c[field]),
   s.id+': segmented '+field+' differs from whole');
 }
 assert(c.segments.some(x=>x.arabicText.includes(s.arabic)&&x.transliterationRu.includes(s.ru)),
  s.id+': phonetic-review anchor lost');
 assert.notEqual(c.reviewStatus,'expert_checked',
  s.id+': CI does not establish independent tajwid or recitation review');
 if(s.hasSchedule){
  const hadith='https://sunnah.com/abudawud:5082';
  assert(c.sourceRefs.some(x=>x.url===hadith&&x.number==='5082'),
   s.id+': hadith attribution missing');
  assert.equal(c.timingRule?.sourceUrl,hadith,s.id+': timing authority');
  assert.deepEqual(c.timingRule?.periods,['morning','evening'],
   s.id+': morning-evening schedule changed');
  assert.equal(c.repetitionRule?.stages?.length,1,s.id+': unexpected counting stages');
  const stage=c.repetitionRule.stages[0];
  assert.equal(stage.count,3,s.id+': number of readings');
  assert.equal(stage.sourceUrl,hadith,s.id+': count source');
  assert.equal(norm(stage.arabicText),norm(c.arabicText),
   s.id+': repeat whole surah, not isolated excerpt');
 }else{
  assert.equal(c.timingRule,null,s.id+': no schedule from these sourceRefs');
  assert.equal(c.repetitionRule,null,s.id+': no repeat count from these sourceRefs');
 }
}
const kafirun=byId.get('q_surah_109');
assert.equal(norm(kafirun.segments[2].arabicText),norm(kafirun.segments[4].arabicText),
 '109:3 and 109:5 intentionally repeat the same Quranic wording');
const fatiha=byId.get('q_surah_1');
assert.equal(fatiha.segments[0].verseKey,'1:1',
 'Do not silently change verse numbering scheme for the Basmala');
console.log('PASS pass24: 7 short surahs/34 verses, Quran links, verse order, phonetic review anchors and Abu Dawud 5082 counts');
console.log('NOT CERTIFIED: tajwid, makharij, hearing, complete vowel signs or independent translation review');
