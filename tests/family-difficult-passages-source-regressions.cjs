'use strict';
// Editorial regression only, NOT fiqh/hadith certification or a medical approval.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-difficult-passages.html','utf8');
const ids=[...html.matchAll(/<section class="card" id="(difficult-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(ids,Array.from({length:7},(_,i)=>'difficult-'+(i+1)),'Seven ordered sections required');
for(const id of ids)assert(html.includes('href="#'+id+'"'),'Missing quick navigation '+id);
assert.equal((html.match(/<details>/g)||[]).length,5,'Five review questions required');
const sourceLinks=[
'https://quran.com/4/34','https://quran.com/4/35','https://quran.com/4/19',
'https://quran.com/30/21','https://quran.com/20/132',
'https://quran.com/an-nisa/34/tafsirs/en-tafisr-ibn-kathir',
'https://al-islam.org/enlightening-commentary-light-holy-quran-vol-4/section-6-surah-nisa-verses-34-35-disagreement-reconciliation-between-husband-wife',
'https://al-islam.org/sw/ask/in-a-discussion-today-i-heard-someone-say-that-men-in-islam-are-allowed-to-hit-their-wives-if-the-wives-are-doing-something-wrong-i-also-heard-someone-say-women-are-not-allowed-to-pay-charity-without-permission-from-their-husband-is-this-true',
'https://sunnah.com/muslim:1218a','https://sunnah.com/muslim:2328a',
'https://sunnah.com/abudawud:495',
'https://alsalam.ac.uk/an-investigation-of-the-hadith-beat-them-for-it-when-they-are-ten-years-old/',
'https://www.who.int/ru/news-room/fact-sheets/detail/corporal-punishment-and-health',
'https://www.who.int/ru/news-room/fact-sheets/detail/violence-against-women'
];
for(const href of sourceLinks)assert(html.includes('href="'+href+'" target="_blank" rel="noopener noreferrer"'),'Missing source or link protection '+href);
for(const phrase of [
'справка к существующим десяти семейным урокам, а не одиннадцатый урок',
'многие классические комментаторы понимали как физический удар',
'соседний этап разрешения супружеского конфликта',
'Ибн Касир, классический суннитский тафсир',
'Это несогласие между конкретными публикациями, а не «позиция всех шиитов»',
'Это не только хадис об алиментах',
'не бил рукой ни женщин, ни слуг',
'прямое упоминание телесного наказания в возрасте десяти лет',
'«хасан сахих» аль-Альбани',
'оспаривает достоверность соответствующих сообщений',
'ВОЗ — медицинский источник, не хадисовед и не муфтий',
'из ВОЗ, а не из Корана и не из хадисов',
'При непосредственной угрозе жизни или здоровью'
])assert(html.includes(phrase),'Context/safety caveat missing: '+phrase);
for(const path of ['family-rights.html','family-children.html','family-child-safety.html','family-prophetic-example.html'])
 assert(fs.readFileSync(path,'utf8').includes('href="family-difficult-passages.html#difficult-'),
   'Source reference not connected from '+path);
for(const [path,frag] of [['family-rights.html','#difficult-2'],['family-children.html','#difficult-5'],
 ['family-child-safety.html','#difficult-5'],['family-prophetic-example.html','#difficult-4']]){
 assert(fs.readFileSync(path,'utf8').includes('href="family-difficult-passages.html'+frag+'"'),
 'Wrong source-reference destination from '+path);
}
const overview=fs.readFileSync('family-rights.html','utf8');
const lessonList=overview.match(/<section class="card" id="family-curriculum"[\s\S]*?<\/section>/)?.[0]||'';
assert.equal((lessonList.match(/<li><a href="family-[^"]+\.html"/g)||[]).length,10,
 'Source guide must not silently become curriculum lesson 11');
assert(!lessonList.includes('href="family-difficult-passages.html"'),
 'Source guide must be a supplement, not listed as an eleventh lesson');
assert(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),'Expert signoff cannot be fabricated');
console.log('PASS: sensitive-source references, 7 sections, 5 self-checks, school-specific attribution and safety');
console.log('NOT CERTIFIED: independent fiqh, isnad, clinical and legal reviews remain pending');
