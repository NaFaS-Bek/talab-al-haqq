'use strict';
// Cross-lesson editorial consistency checks. These do not certify the religious
// interpretation, the accessibility of every external URL, or expert approval.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const files=[
  'family-nikah.html','family-mahr.html','family-children.html',
  'family-child-rights.html','family-parent-duties.html','family-custody.html',
  'family-child-safety.html','family-teen-dialogue.html','family-filial-duties.html',
  'family-prophetic-example.html'
];
const overview=fs.readFileSync('family-rights.html','utf8');
const app=fs.readFileSync('app.js','utf8');
// Source guide is reachable from family lessons, but is not lesson eleven.
const supplement='family-difficult-passages.html';
const htmls=new Map([['family-rights.html',overview],
  ...files.map(p=>[p,fs.readFileSync(p,'utf8')]),
  [supplement,fs.readFileSync(supplement,'utf8')],
  ...['family-rights-tg.html','family-nikah-tg.html','family-mahr-tg.html','family-children-tg.html','family-child-rights-tg.html','family-parent-duties-tg.html'].map(p=>[p,fs.readFileSync(p,'utf8')])]);

// One common curriculum: exactly ten distinct lessons, linked from both entrances.
const section=overview.match(/<section class="card" id="family-curriculum"[\s\S]*?<\/section>/);
assert(section,'Family overview curriculum section missing');
const overviewLinks=[...section[0].matchAll(/<li><a href="(family-[^"#?]+\.html)"/g)].map(m=>m[1]);
assert.equal(overviewLinks.length,10,'Family overview must have exactly ten lessons');
assert.deepEqual(new Set(overviewLinks),new Set(files),'Overview and catalog differ');
for(const p of files){
  assert.equal(overviewLinks.filter(x=>x===p).length,1,'Duplicate overview lesson: '+p);
  assert.equal(app.split('href="'+p+'"').length-1,1,'Category must link once to '+p);
}
assert(overview.includes('Продолжить обучение: десять уроков'),'Overview count is stale');
assert(!overviewLinks.includes(supplement),'Source guide is not the eleventh lesson');
assert(!/Все материалы пока проходят содержательную проверку/.test(overview),
  'Do not suggest unverified expert review is in progress');

// All links between the lessons must resolve, including fragment identifiers.
for(const [path,html] of htmls){
  assert(!/Урок\s+\d+\s+из\s+4/.test(html),'Outdated breadcrumb in '+path);
  for(const m of html.matchAll(/href="(family-[^"#?]+\.html)(?:#([^"]+))?"/g)){
    const target=m[1],anchor=m[2];
    assert(htmls.has(target),path+' has missing family destination '+target);
    if(anchor)assert(htmls.get(target).includes('id="'+anchor+'"'),
      path+' missing target fragment '+target+'#'+anchor);
  }
  for(const m of html.matchAll(/href="#([^"]+)"/g)){
    assert(html.includes('id="'+m[1]+'"'),path+' missing local anchor #'+m[1]);
  }
  for(const m of html.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g)){
    assert(m[0].includes('target="_blank"')&&m[0].includes('rel="noopener noreferrer"'),
      path+' has missing external-link safety attributes: '+m[0]);
  }
  assert(!html.includes('id="source-policy"')&&!html.includes('expert_checked'),
    path+': editorial certification status must stay centralized');
}

// Cross-references prevent misleading one-sided readings of contested topics.
const child=htmls.get('family-children.html');
const safety=htmls.get('family-child-safety.html');
assert(child.includes('href="family-child-safety.html#safety-3"'),
  'Prayer/discipline needs context from the child-safety lesson');
assert(safety.includes('href="family-children.html#section-5"'),
  'Child-safety lesson must acknowledge Abu Dawud 495 discussion');
assert(child.includes('Медицинские рекомендации и религиозно-правовое толкование хадиса'),
  'Medical versus religious evidentiary boundary is absent');
assert(safety.includes('Это историко-религиозный источник'),
  'Source distinction absent from child-safety lesson');
for(const p of ['family-children.html','family-child-rights.html','family-parent-duties.html']){
 const h=htmls.get(p);
 assert(h.includes('https://sunnah.com/bukhari:2587'),
   'Gift-giving hadith not attributed: '+p);
}
assert(htmls.get('family-custody.html').includes('при реальных угрозах и насилии нельзя требовать опасных встреч'),
  'Custody must not impose unsafe contact');
assert(htmls.get('family-filial-duties.html').includes('не является требованием терпеть насилие или оставаться в опасном доме'),
  'Parent respect must not impose unsafe contact');
assert(overview.includes('В аяте есть сложный фрагмент о супружеском конфликте'),
  'Quran 4:34 must not be presented without a context warning');

// One truthful site-wide review status and a stable main-branch source-journal URL.
assert(app.includes('Независимая содержательная проверка всех семейных уроков пока не проводилась'),
  'Central review status must apply to every family lesson');
assert(!app.includes('Независимая содержательная проверка этих пяти уроков'),
  'Stale five-lesson source status');
assert(app.includes('https://github.com/NaFaS-Bek/talab-al-haqq/blob/main/docs/family-curriculum-source-review-2026-11-22.md'),
  'Family source-review journal must link to main rather than temporary branch');
console.log('PASS: ten linked lessons, source boundaries, link/anchor and review-status consistency');
console.log('NOT CERTIFIED: no independent fiqh, child-safety, clinical, or legal review');
