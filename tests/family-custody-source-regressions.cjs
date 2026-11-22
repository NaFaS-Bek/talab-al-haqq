'use strict';
// This is a source/attribution regression check, NOT a fiqh, judicial or
// child-development certification. The canonical Arabic data is untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('family-custody.html','utf8');
const sections=[...html.matchAll(/<section class="card" id="(custody-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(sections,Array.from({length:8},(_,i)=>'custody-'+(i+1)),
  'The custody lesson must contain 8 ordered sections');
for(const id of sections) assert(html.includes('href="#'+id+'"'),'Missing navigation anchor '+id);
assert.equal((html.match(/<details>/g)||[]).length,5,'Custody self checks must have 5 questions');

const evidence={
  'custody-1':[
    'https://al-islam.org/marriage-according-five-schools-islamic-law-muhammad-jawad-mughniyya/custody-al-hidanah'
  ],
  'custody-2':['https://quran.com/2/233','https://quran.com/65/6','https://quran.com/65/7'],
  'custody-3':['https://sunnah.com/abudawud:2276','https://sunnah.com/abudawud:2277'],
  'custody-4':['https://quran.com/2/233','https://quran.com/65/6','https://quran.com/65/7','https://www.unicef.org/uruguay/crianza/etapa-escolar/cuando-los-padres-con-hijos-se-separan-algunas-recomendaciones'],
  'custody-5':['https://al-islam.org/marriage-according-five-schools-islamic-law-muhammad-jawad-mughniyya/custody-al-hidanah','https://dorar.net/en/feqhia/461'],
  'custody-6':['https://www.sistani.org/english/book/48/2372/','https://al-islam.org/marriage-according-five-schools-islamic-law-muhammad-jawad-mughniyya/custody-al-hidanah'],
  'custody-7':['https://www.unicef.org/uruguay/crianza/etapa-escolar/cuando-los-padres-con-hijos-se-separan-algunas-recomendaciones']
};
const limits={
  'custody-1':'не обязательно один и тот же вопрос',
  'custody-2':'не устанавливает универсальную возрастную границу передачи опеки',
  'custody-3':'каждый ребёнок любого возраста может единолично решить вопрос опеки',
  'custody-4':'Контакт с родителем должен обсуждаться с учётом безопасности',
  'custody-5':'не единые действующие законы всех мусульманских стран',
  'custody-6':'позиция конкретного джафаритского правоведа',
  'custody-7':'не дословные хадисы и не юридические инструкции'
};
for(const [id,urls] of Object.entries(evidence)){
  const start=html.indexOf('<section class="card" id="'+id+'">');
  const end=html.indexOf('</section>',start);
  assert(start>=0&&end>start,id+': missing section boundary');
  const body=html.slice(start,end);
  for(const url of urls){
    assert(body.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'),
      id+': missing/unsafe source '+url);
  }
  assert(body.includes(limits[id]),id+': missing factual or legal limitation');
}
for(const phrase of [
  '«хасан» аль-Альбани','«сахих» аль-Альбани',
  'не Коран и не хадисы','если разлучение причинит ребёнку вред, оно недопустимо',
  'не дословная цитата из аятов','не религиозный источник',
  'при реальных угрозах и насилии нельзя требовать опасных встреч',
  'не заменяет решение семейного спора',
]){
  assert(html.includes(phrase),'Custody source/child safety qualification absent: '+phrase);
}
assert(!/id="source-policy"|expert_checked|проверено экспертом/.test(html),
  'Expert review status must not be fabricated');
for(const path of ['app.js','family-rights.html','family-child-rights.html','family-parent-duties.html']){
  assert(fs.readFileSync(path,'utf8').includes('href="family-custody.html"'),
    path+': linked custody learning is missing');
}
console.log('PASS: custody 8 sections, five self-checks, Quran/hadith/fiqh/UNICEF links and safety limits');
console.log('NOT CERTIFIED: no independent expert, judicial or pedagogical review');
