'use strict';
// Source-reference and presentation regression guards only.
// This does not certify religious, pedagogical or family-law interpretations.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-parent-duties.html','utf8');

const ids=[...html.matchAll(/<section class="card" id="(duty-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(ids,Array.from({length:7},(_,i)=>'duty-'+(i+1)),
  'Seven parental duties sections must remain ordered and complete');
for(const id of ids)assert(html.includes('href="#'+id+'"'),'Quick navigation missing '+id);
assert.equal((html.match(/<details>/g)||[]).length,5,'Expected five self-check questions');
const sources={
  'duty-1':['https://sunnah.com/bukhari:7138','https://quran.com/66/6'],
  'duty-2':['https://quran.com/20/132','https://quran.com/31/13-19'],
  'duty-3':['https://quran.com/2/233','https://quran.com/65/7','https://sunnah.com/bukhari:5364'],
  'duty-4':['https://sunnah.com/bukhari:2587'],
  'duty-5':['https://quran.com/4/2','https://quran.com/4/10','https://quran.com/93/9'],
  'duty-6':[
    'https://www.fiqhpedia.org/articles/article:kwfe:v11:a084?lang=en',
    'https://seekersguidance.org/answers/hanafi-fiqh/estate-division-and-the-sunna-of-equal-treatment-of-children-in-gift-giving/',
    'https://al-islam.org/children-quran-and-sunnah-muhammadi-reyshahri/chapter-4-ethics-upbringing'
  ]
};
const boundaries={
  'duty-1':'духовно-нравственное обращение, а не подробный современный регламент',
  'duty-2':'Наставления Лукмана — коранический рассказ, не хадис',
  'duty-3':'в контексте суры о разводе и связанных обязательствах',
  'duty-4':'при жизни родителей; наследование после смерти',
  'duty-5':'Имущественная охрана и повседневный уход связаны, но это не тождественные',
  'duty-6':'Это обзор описанных позиций учёных, а не перечень обязательных решений'
};
for(const [id,urls] of Object.entries(sources)){
  const a=html.indexOf('<section class="card" id="'+id+'">');
  const b=html.indexOf('</section>',a);
  assert(a>=0&&b>a,'Missing section '+id);
  const body=html.slice(a,b);
  for(const url of urls) {
    assert(body.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'),
      id+': missing source URL/safe link '+url);
  }
  assert(body.includes(boundaries[id]),id+': original evidence qualification missing');
}
const fiqh=html.slice(html.indexOf('<section class="card" id="duty-6">'),html.indexOf('</section>',html.indexOf('<section class="card" id="duty-6">')));
for(const term of ['ханафитских','маликитских','шафиитских','ханбалитском','шиитских','Внутри самих школ','прижизненных дарах','Вторичные правовые материалы','не удостоверенный консенсус']){
  assert(fiqh.includes(term),'Nuanced legal-comparison note missing '+term);
}
assert(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),
 'Expert endorsement must be tracked centrally and not be invented');
for(const file of ['app.js','family-rights.html','family-children.html','family-child-rights.html']){
  assert(fs.readFileSync(file,'utf8').includes('href="family-parent-duties.html"'),
   file+': parental duties lesson not linked');
}
console.log('PASS parental duties: 7 sections, 5 quizzes, 13 source anchors, legal views and contextual limits');
console.log('NOT CERTIFIED: expert religious or family-law review');
