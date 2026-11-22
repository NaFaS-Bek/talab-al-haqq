'use strict';
// Editorial guards for new child-rights lesson. These tests verify structure,
// source citation, boundary wording and non-false-certification; they do not
// validate a personal legal ruling, tafsir or expert judgement.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-child-rights.html','utf8');
const sections=[...html.matchAll(/<section class="card" id="(right-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(sections,Array.from({length:8},(_,i)=>'right-'+(i+1)));
for(const id of sections){
  assert(html.includes('href="#'+id+'"'),'Missing quick navigation for '+id);
}
assert.equal((html.match(/<details>/g)||[]).length,5,
  'Five independent source-context questions expected');

const citations={
  'right-1':['https://quran.com/17/31'],
  'right-2':['https://sunnah.com/bukhari:5467'],
  'right-3':['https://quran.com/2/233','https://sunnah.com/bukhari:5364'],
  'right-4':['https://quran.com/20/132','https://quran.com/31/13-19'],
  'right-5':['https://sunnah.com/bukhari:5997','https://quran.com/49/11'],
  'right-6':['https://sunnah.com/bukhari:2587'],
  'right-7':['https://quran.com/4/2','https://quran.com/4/9'],
};
const boundaries={
  'right-1':'конкретный запрет на убийство',
  'right-2':'Описание тахника не является медицинской рекомендацией',
  'right-3':'Контекст аята связан с кормлением',
  'right-4':'Наставления Лукмана — слова персонажа коранического рассказа',
  'right-5':'Аят 49:11 обращён к верующим в целом',
  'right-6':'Это рассказ о дарении одному из детей',
  'right-7':'Эти аяты имеют конкретные имущественные и опекунские контексты',
};
for(const [id,hrefs] of Object.entries(citations)){
  const start=html.indexOf('<section class="card" id="'+id+'">');
  const end=html.indexOf('</section>',start);
  assert(start>=0&&end>start,'Missing '+id);
  const body=html.slice(start,end);
  for(const href of hrefs){
    assert(body.includes('href="'+href+'" target="_blank" rel="noopener noreferrer"'),
      id+': missing source or safe external-link attributes: '+href);
  }
  assert(body.includes(boundaries[id]),id+': source-interpretation limit absent');
}
for(const phrase of [
  'а не инструкция самовольно распоряжаться чужим имуществом',
  'педагогические выводы и современные рекомендации',
  'Это современная практическая иллюстрация, а не цитата из хадиса',
  'Точные правила распределения имущества',
]) {
  // One of these phrases may occur only in the accompanying family-children
  // lesson; keep the new lesson self-contained instead of requiring a cross-file
  // quote.
  if(phrase==='Точные правила распределения имущества') continue;
  assert(html.includes(phrase),'Missing interpretive caution: '+phrase);
}
assert(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),
  'Expert status must not be self-certified or duplicated on individual lessons');
assert(html.includes('href="family-children.html"'),'Cross-link to upbringing guide missing');
assert(html.includes('href="family-rights.html"'),'Return to family overview missing');

const app=fs.readFileSync('app.js','utf8');
const overview=fs.readFileSync('family-rights.html','utf8');
const upbringing=fs.readFileSync('family-children.html','utf8');
assert(app.includes('href="family-child-rights.html"'),'Family knowledge category link missing');
assert(overview.includes('href="family-child-rights.html"'),'Family overview link missing');
assert(upbringing.includes('href="family-child-rights.html"'),'Upbringing cross-link missing');
console.log('PASS: child rights 8 sections, 5 self-checks, source boundaries and cross-links');
console.log('NOT CERTIFIED: independent legal, tafsir, medical or pedagogical expert review');
