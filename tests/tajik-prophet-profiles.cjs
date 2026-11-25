'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),db=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const start=app.indexOf('const tajikLibraryProfiles = '),end=app.indexOf('const title = (x, kind)',start);
assert(start>=0&&end>start);
const ctx=vm.createContext({isTajik:()=>true});
vm.runInContext(app.slice(start,end)+'\nthis.resolve=tajikLibraryProfile;this.localize=localizedLibrary;',ctx);
const prophets=db.library.items.filter(p=>p.kind==='prophet');
assert.equal(prophets.length,25);assert.equal(prophets.filter(ctx.resolve).length,25);
for(const id of ["prophet_adam","prophet_idris","prophet_nuh","prophet_hud","prophet_salih","prophet_ibrahim","prophet_lut","prophet_ismail","prophet_ishaq","prophet_yaqub","prophet_yusuf","prophet_ayyub","prophet_shuayb","prophet_musa","prophet_harun","prophet_dhul_kifl","prophet_dawud","prophet_sulayman","prophet_ilyas","prophet_al_yasa","prophet_yunus","prophet_zakariya","prophet_yahya","prophet_isa","prophet_muhammad"]){const p=prophets.find(x=>x.id===id),t=ctx.resolve(p);assert(t);assert.equal(t.sections.length,p.sections.length);for(const [i,s] of p.sections.entries()){assert.equal(t.sections[i].id,s.id);assert(t.sections[i].title&&t.sections[i].text);}for(const mutate of [p=>p.summaryRu+='x',p=>p.sections[0].sourceRefs[0].url+='x',p=>p.sections.reverse(),p=>p.duaEntryIds.push('changed')]){const clone=JSON.parse(JSON.stringify(p));mutate(clone);assert.equal(ctx.resolve(clone),null);}}
assert(ctx.resolve(prophets.find(x=>x.id==='prophet_nuh')).sections[3].text.includes('ба давомнокии умумии муайяншудаи умр'));
ctx.isTajik=()=>false;assert.equal(ctx.localize(prophets[0]),null);
assert(app.includes('data-tg-prophet-progress'));assert(app.includes('data-tg-library-profile'));
console.log('PASS: twenty-five guarded prophet biographies; original source references and order retained');

ctx.isTajik=()=>true;
const hud=ctx.resolve(prophets.find(p=>p.id==='prophet_hud')),salih=ctx.resolve(prophets.find(p=>p.id==='prophet_salih')),ibrahim=ctx.resolve(prophets.find(p=>p.id==='prophet_ibrahim'));
assert(hud.sections[1].text.includes('ҳафт шабу ҳашт рӯз'));
assert(salih.sections[2].text.includes('тарзи муфассали пайдо шудани он тасвир нашудааст'));
assert(ibrahim.sections[1].text.includes('Дар 37:102–107 номи писар зикр нашудааст'));
assert(ibrahim.sections[4].text.includes('шумораи бофташудаи такрор илова нашудааст'));
console.log('PASS: Hud, Salih, Ibrahim and source boundaries');

const lut=ctx.resolve(prophets.find(p=>p.id==='prophet_lut')),ismail=ctx.resolve(prophets.find(p=>p.id==='prophet_ismail')),ishaq=ctx.resolve(prophets.find(p=>p.id==='prophet_ishaq'));
assert(lut.sections[0].text.includes('бе даъват ба худсарона ҷазо'));
assert(lut.sections[4].text.includes('шумораи бофташудаи қироат'));
assert(ismail.sections[1].text.includes('номи писар бевосита зикр нашудааст'));
assert(ismail.sections[2].text.includes('ҷудогона ҳамчун ҳадис'));
assert(ishaq.sections[4].text.includes('матни дақиқ барои чунин карточка омода нест'));
console.log('PASS: Lut, Ismail, Ishaq and source boundaries');

const yaqub=ctx.resolve(prophets.find(p=>p.id==='prophet_yaqub')),yusuf=ctx.resolve(prophets.find(p=>p.id==='prophet_yusuf')),ayyub=ctx.resolve(prophets.find(p=>p.id==='prophet_ayyub'));
assert(yaqub.sections[2].text.includes('на дастури умумӣ барои табобати бемориҳои чашм'));
assert(yaqub.sections[4].text.includes('бо матни аз номи ӯ сохташуда иваз намешавад'));
assert(yusuf.sections[0].text.includes('номи фиръавни мушаххаси таърихӣ ё сулола дар ин ҷо муайян нашудааст'));
assert(yusuf.sections[4].text.includes('хоҳиши марги фаврӣ'));
assert(ayyub.sections[2].text.includes('Ин тавсифи усули умумии худтабобаткунӣ'));
assert(ayyub.sections[4].text.includes('ваъдаи шифо дар муҳлати муайян'));
console.log('PASS: Yaqub, Yusuf, Ayyub and source boundaries');

const shuayb=ctx.resolve(prophets.find(p=>p.id==='prophet_shuayb')),musa=ctx.resolve(prophets.find(p=>p.id==='prophet_musa')),harun=ctx.resolve(prophets.find(p=>p.id==='prophet_harun'));
assert(shuayb.sections[3].text.includes('дар 28:23 номи ӯ оварда нашудааст'));
assert(musa.sections[2].text.includes('ҳамчун ҳунари ҷодугарие тасвир намешаванд'));
assert(harun.sections[1].text.includes('набояд ба айбдор кардани Ҳорун дар парастиши гӯсола'));
assert(harun.sections[4].text.includes('Ин дуое нест, ки Ҳорун гуфта бошад'));
console.log('PASS: Shuayb, Musa, Harun and source boundaries');

const dhulKifl=ctx.resolve(prophets.find(p=>p.id==='prophet_dhul_kifl')),dawud=ctx.resolve(prophets.find(p=>p.id==='prophet_dawud')),sulayman=ctx.resolve(prophets.find(p=>p.id==='prophet_sulayman'));
assert(dhulKifl.sections[3].text.includes('калимаи «паёмбар» оварда нашудааст'));
assert(dhulKifl.sections[4].text.includes('Матни мустақили дуо аз номи ӯ низ оварда нашудааст'));
assert(dawud.sections[4].text.includes('муроҷиати гурӯҳе дар қиссаи Толут'));
assert(sulayman.sections[0].text.includes('Номи ҳокима дар ин оятҳо зикр нашудааст'));
assert(sulayman.sections[3].text.includes('ҷинҳо ғайбро намедонистанд'));
console.log('PASS: Dhul Kifl, Dawud, Sulayman and source boundaries');

const ilyas=ctx.resolve(prophets.find(p=>p.id==='prophet_ilyas')),alyasa=ctx.resolve(prophets.find(p=>p.id==='prophet_al_yasa')),yunus=ctx.resolve(prophets.find(p=>p.id==='prophet_yunus'));
assert(ilyas.sections[3].text.includes('наметавон хулоса кард, ки зиндагии заминии Илёс то ҳол идома дорад'));
assert(alyasa.sections[2].text.includes('Дар ин оятҳо рӯйхати муъҷизаҳои мушаххас нест'));
assert(yunus.sections[1].text.includes('шумораи рӯзҳои даруни моҳӣ'));
assert(yunus.sections[4].text.includes('Шумораи такрор дар оят муқаррар нашудааст'));
console.log('PASS: Ilyas, Al-Yasa, Yunus and source boundaries');

const zakariya=ctx.resolve(prophets.find(p=>p.id==='prophet_zakariya')),yahya=ctx.resolve(prophets.find(p=>p.id==='prophet_yahya')),isa=ctx.resolve(prophets.find(p=>p.id==='prophet_isa')),muhammad=ctx.resolve(prophets.find(p=>p.id==='prophet_muhammad'));
assert(zakariya.sections[2].text.includes('се шаб'));
assert(zakariya.sections[4].text.includes('кафолати таваллуди фарзанд'));
assert(yahya.sections[4].text.includes('ҳамоно дуои Закариё'));
assert(isa.sections[2].text.includes('Иҷозати Аллоҳ'));
assert(isa.sections[3].text.includes('Аллоҳ ӯро ба сӯи Худ боло бурд'));
assert(muhammad.sections[1].text.includes('ҳамчун оят пешниҳод намегардад'));
assert(muhammad.sections[3].text.includes('Бухорӣ 3902'));
assert(muhammad.sections[3].text.includes('Муслим 1162b'));
assert(muhammad.sections[3].text.includes('шасту сесолагӣ'));
console.log('PASS: Zakariya, Yahya, Isa, Muhammad and source boundaries');

// Comprehensive inventory and per-section source rendering audit.
const allDuas=new Set([...db.catalog.entries,...db.catalog_additions.entries].map(x=>x.id));
let sectionCount=0,refCount=0,duaCount=0;const uniqueUrls=new Set();
const sourceCtx=vm.createContext({sourceCard:r=>'<a href="'+r.url+'">'+r.reference+'</a>'});
const sourceStart=app.indexOf('function prophetSectionSources('),sourceEnd=app.indexOf('function refsFor(',sourceStart);
assert(sourceStart>=0&&sourceEnd>sourceStart);
vm.runInContext(app.slice(sourceStart,sourceEnd)+'\nthis.render=prophetSectionSources;',sourceCtx);
assert.equal(sourceCtx.render([],true),'');
for(const p of prophets){
  const t=ctx.resolve(p);assert(t.title.trim()&&t.summary.trim());
  for(const [i,s] of p.sections.entries()){
    assert.equal(t.sections[i].id,s.id);
    assert(s.sourceRefs.length>0);
    for(const tg of [true,false]){
      const html=sourceCtx.render(s.sourceRefs,tg);
      assert(html.includes(tg?'Сарчашмаҳои ин бахш':'Источники этого раздела'));
      assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),s.sourceRefs.map(r=>r.url));
    }
    for(const r of s.sourceRefs){assert(/^https:\/\/(quran\.com|sunnah\.com)\//.test(r.url));uniqueUrls.add(r.url);refCount++;}
    sectionCount++;
  }
  for(const id of p.duaEntryIds){assert(allDuas.has(id));duaCount++;}
}
assert.equal(sectionCount,149);assert.equal(refCount,276);assert.equal(uniqueUrls.size,136);assert.equal(duaCount,18);
assert(app.includes("prophetSectionSources(s.sourceRefs,isTajik())"));
assert(app.includes("if (x.kind==='prophet') html += arabic(x.arabicName)"));
console.log('PASS: 25 profiles, 149 sections, 276 source occurrences, 136 distinct URLs, 18 dua links');

// Targeted editorial corrections, without altering guarded Russian snapshots.
for (const item of [
  {
    "id": "prophet_adam",
    "sec": "events",
    "field": "title",
    "to": "Огоҳӣ, хато ва бозгашт"
  },
  {
    "id": "prophet_nuh",
    "sec": "events",
    "field": "text",
    "to": "Мавҷ миёни онҳо ҳоил шуд."
  },
  {
    "id": "prophet_hud",
    "sec": "events",
    "field": "text",
    "to": "боди шадиди харобиоваре"
  },
  {
    "id": "prophet_hud",
    "sec": "dates",
    "field": "title",
    "to": "Санаҳо ва фарзияҳои таърихии тасдиқнашуда"
  },
  {
    "id": "prophet_salih",
    "sec": "summary",
    "field": "summary",
    "to": "Онҳо ин амрро риоя накарданд."
  },
  {
    "id": "prophet_ibrahim",
    "sec": "mission",
    "field": "text",
    "to": "водии бе кишту зироат"
  },
  {
    "id": "prophet_ibrahim",
    "sec": "events",
    "field": "text",
    "to": "хобе, ки дар он писарашро қурбонӣ мекард"
  },
  {
    "id": "prophet_lut",
    "sec": "events",
    "field": "text",
    "to": "ҳамсараш аз азоби баъдӣ наҷот наёфт"
  },
  {
    "id": "prophet_ishaq",
    "sec": "gifts",
    "field": "text",
    "to": "ба як андоза муфассал"
  },
  {
    "id": "prophet_ishaq",
    "sec": "lessons",
    "field": "text",
    "to": "ҷузъиёти номаълуми зиндагиномаро"
  },
  {
    "id": "prophet_ayyub",
    "sec": "dates",
    "field": "text",
    "to": "санҷиши ҷудогонаи матни ривоят ва дараҷаи эътимоднокии онро"
  },
  {
    "id": "prophet_ayyub",
    "sec": "duas",
    "field": "text",
    "to": "баён кардани ранҷи ба сараш омада"
  },
  {
    "id": "prophet_shuayb",
    "sec": "dates",
    "field": "text",
    "to": "ақидаи маъмул дар бораи он ки ин шахс Шуъайб будааст"
  },
  {
    "id": "prophet_musa",
    "sec": "events",
    "field": "text",
    "to": "агар аз осеб расидан ба кӯдак битарсад"
  },
  {
    "id": "prophet_musa",
    "sec": "gifts",
    "field": "text",
    "to": "бо асо ба баҳр бизанад"
  },
  {
    "id": "prophet_dhul_kifl",
    "sec": "events",
    "field": "text",
    "to": "Набудани ҷузъиёти бештар"
  },
  {
    "id": "prophet_sulayman",
    "sec": "gifts",
    "field": "text",
    "to": "боде, ки Аллоҳ ба ӯ тобеъ карда буд"
  },
  {
    "id": "prophet_ilyas",
    "sec": "mission",
    "field": "text",
    "to": "Ӯ қавмашро ба тақво даъват карда"
  },
  {
    "id": "prophet_ilyas",
    "sec": "gifts",
    "field": "text",
    "to": "ситоише, ки Аллоҳ дар бораи ӯ баён кардааст"
  },
  {
    "id": "prophet_al_yasa",
    "sec": "events",
    "field": "text",
    "to": "ин ки ӯ ҷонишини кадом паёмбар буд"
  },
  {
    "id": "prophet_al_yasa",
    "sec": "dates",
    "field": "text",
    "to": "ҳамчун иқтибос аз суханони ӯ"
  },
  {
    "id": "prophet_yunus",
    "sec": "summary",
    "field": "summary",
    "to": "имон овардани мардум ба худи онҳо фоида расонд"
  },
  {
    "id": "prophet_yunus",
    "sec": "mission",
    "field": "text",
    "to": "имон овардани мардум ба худи онҳо фоида расонд"
  },
  {
    "id": "prophet_yunus",
    "sec": "events",
    "field": "text",
    "to": "қуръа ба зарари ӯ афтод"
  },
  {
    "id": "prophet_zakariya",
    "sec": "dates",
    "field": "text",
    "to": "давомнокии умр"
  },
  {
    "id": "prophet_yahya",
    "sec": "gifts",
    "field": "text",
    "to": "Муъҷизаҳои дигари мушаххасе"
  },
  {
    "id": "prophet_yahya",
    "sec": "dates",
    "field": "text",
    "to": "санаи дақиқу боэътимод"
  }
]) {
  const profile=ctx.resolve(prophets.find(p=>p.id===item.id));
  const field=item.sec==='summary'?profile:profile.sections.find(s=>s.id===item.sec);
  assert(field[item.field].includes(item.to),item.id+':'+item.sec+':'+item.field);
}
console.log('PASS: targeted Tajik editorial corrections');
