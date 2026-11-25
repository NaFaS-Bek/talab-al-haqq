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

// Source-checked bilingual corrections: ensure both versions resolve together.
for (const item of [
  {
    "id": "prophet_harun",
    "sec": "summary",
    "ru": "напомнил людям, что их Господь — Милостивый, и призвал следовать за ним, Харуном, и повиноваться его велению",
    "tg": "ба мардум ёдрас кард, ки Парвардигорашон Раҳмон аст, ва онҳоро ба пайравӣ аз худ ва итоат ба амраш даъват намуд",
    "verse": "20:90"
  },
  {
    "id": "prophet_ayyub",
    "sec": "summary",
    "ru": "даровал ему его семью и ещё столько же вместе с ней",
    "tg": "аҳли оилаашро ба ӯ ато намуд ва ҳамроҳи онҳо боз ба ҳамон шумора",
    "verse": "21:84"
  },
  {
    "id": "prophet_ayyub",
    "sec": "events",
    "ru": "даровании ему его семьи и ещё стольких же вместе с ней",
    "tg": "ато шудани аҳли оилааш ва боз ба ҳамон шумора ҳамроҳи онҳо",
    "verse": "21:84"
  },
  {
    "id": "prophet_ayyub",
    "sec": "gifts",
    "ru": "дарование ему его семьи и ещё стольких же вместе с ней",
    "tg": "ато шудани аҳли оилааш ва боз ба ҳамон шумора ҳамроҳи онҳо",
    "verse": "21:84"
  },
  {
    "id": "prophet_yaqub",
    "sec": "summary",
    "ru": "кому они будут поклоняться после его смерти.",
    "tg": "ки пас аз вафоти ӯ киро мепарастанд.",
    "verse": "2:133"
  },
  {
    "id": "prophet_yaqub",
    "sec": "mission",
    "ru": "их поклонение после его смерти. Сыновья ответили, что будут поклоняться единому Богу.",
    "tg": "ин буд, ки пас аз вафоти ӯ киро мепарастанд. Писаронаш ҷавоб доданд, ки Худои ягонаро мепарастанд.",
    "verse": "2:133"
  },
  {
    "id": "prophet_ilyas",
    "sec": "summary",
    "ru": "называет самого Ильяса одним из верующих рабов Аллаха.",
    "tg": "ӯро аз ҷумлаи бандагони имондори Аллоҳ мешуморад.",
    "verse": "37:132"
  },
  {
    "id": "prophet_yahya",
    "sec": "summary",
    "ru": "и отмечает, что он не был высокомерным и непокорным.",
    "tg": "таъкид мекунад ва хабар медиҳад, ки ӯ мутакаббир ва нофармон набуд.",
    "verse": "19:14"
  },
  {
    "id": "prophet_isa",
    "sec": "dates",
    "ru": "Подробности того, каким образом им это представилось, в этих аятах не раскрыты.",
    "tg": "Дар ин оятҳо ҷузъиёти он ки ин воқеа чӣ гуна ба назари онҳо чунин намуд, баён нашудааст.",
    "verse": "4:157"
  },
  {
    "id": "prophet_isa",
    "sec": "gifts",
    "ru": "после того как Иса дует в созданную из глины форму птицы, она становится птицей по дозволению Аллаха",
    "tg": "пас аз он ки Исо ба сурати аз гил сохтаи паранда медамад, он бо иҷозати Аллоҳ ба паранда табдил меёбад",
    "verse": "3:49"
  },
  {
    "id": "prophet_nuh",
    "sec": "duas",
    "ru": "для себя, родителей, вошедших в его дом с верой, а также верующих мужчин и женщин.",
    "tg": "худ, падару модар, касоне, ки бо имон ба хонааш медароянд, ва мардону занони мӯъмин",
    "verse": "71:28"
  },
  {
    "id": "prophet_dawud",
    "sec": "events",
    "ru": "В 38:25 говорится о прощении Аллахом и близости Дауда к Нему. Затем следует веление",
    "tg": "Дар 38:25 аз омурзиши Аллоҳ ва наздикии Довуд ба Ӯ хабар дода мешавад. Сипас амр меояд",
    "verse": "38:25"
  },
  {
    "id": "prophet_sulayman",
    "sec": "events",
    "ru": "попросил Аллаха помочь ему благодарить за милость, оказанную ему и его родителям, совершать угодные Ему праведные дела и по Его милости войти в число праведных рабов.",
    "tg": "аз Аллоҳ хост, ки ӯро дар шукргузорӣ барои неъматҳои ба ӯ ва падару модараш додашуда ва анҷом додани корҳои солеҳи писандидаи Ӯ ёрӣ диҳад ва бо раҳмати Худ ӯро аз ҷумлаи бандагони солеҳ гардонад.",
    "verse": "27:19"
  }
]) {
 const p=prophets.find(p=>p.id===item.id),tr=ctx.resolve(p);assert(tr,item.id);
 const ru=item.sec==='summary'?p.summaryRu:p.sections.find(s=>s.id===item.sec).textRu;
 const tg=item.sec==='summary'?tr.summary:tr.sections.find(s=>s.id===item.sec).text;
 assert(ru.includes(item.ru),item.id+':'+item.verse+':ru');assert(tg.includes(item.tg),item.id+':'+item.verse+':tg');
}
console.log('PASS: bilingual source-checked editorial corrections');

// Further editorial refinements checked against the cited verses.
for (const item of [
  {
    "id": "prophet_idris",
    "sec": "gifts",
    "ru": null,
    "tg": "ба ҷойгоҳи баланд бардошт",
    "verse": "19:57"
  },
  {
    "id": "prophet_salih",
    "sec": "mission",
    "ru": "о дворцах, которые они строили на равнинах",
    "tg": "аз қасрҳое, ки онҳо дар ҳамвориҳо месохтанд",
    "verse": "7:74"
  },
  {
    "id": "prophet_ismail",
    "sec": "summary",
    "ru": "велел своей семье совершать молитву и выплачивать закят",
    "tg": "аҳли оилаи худро ба намоз ва закот амр мекард",
    "verse": "19:55"
  },
  {
    "id": "prophet_ismail",
    "sec": "mission",
    "ru": "велел своей семье совершать молитву и выплачивать закят",
    "tg": null,
    "verse": "19:55"
  },
  {
    "id": "prophet_harun",
    "sec": "events",
    "ru": "что Муса обвинит его в разделении сынов Исраиля и несоблюдении его слов",
    "tg": "ки Мусо ӯро дар пароканда кардани Банӣ Исроил ва риоя накардани суханаш айбдор кунад",
    "verse": "20:94"
  },
  {
    "id": "prophet_sulayman",
    "sec": "events",
    "ru": "признанием того, что она поступила несправедливо по отношению к самой себе",
    "tg": "эътирофи ситаме, ки бар худ карда буд",
    "verse": "27:44"
  },
  {
    "id": "prophet_sulayman",
    "sec": "gifts",
    "ru": "труд некоторых джиннов по дозволению Господа",
    "tg": "кори баъзе аз ҷинҳо бо иҷозати Парвардигор",
    "verse": "34:12"
  },
  {
    "id": "prophet_yunus",
    "sec": "events",
    "ru": "его поглотила большая рыба. В 37:143–144 сказано, что, если бы Юнус не был из числа прославляющих Аллаха, он остался бы в её чреве до Дня воскресения.",
    "tg": "моҳии бузурге ӯро фурӯ бурд. Дар 37:143–144 гуфта мешавад, ки агар Юнус аз ҷумлаи тасбеҳгӯёни Аллоҳ намебуд, то рӯзи барангехта шудан дар шиками моҳӣ мемонд.",
    "verse": "37:143–144"
  },
  {
    "id": "prophet_ibrahim",
    "sec": "events",
    "ru": null,
    "tg": "Аллоҳ писарро бо қурбонии бузурге раҳоӣ бахшид",
    "verse": "37:107"
  },
  {
    "id": "prophet_yaqub",
    "sec": "events",
    "ru": "а в 12:87 побуждает сыновей",
    "tg": "дар 12:87 бошад, писаронашро ба ҷустуҷӯи",
    "verse": "12:87"
  }
]) {
 const p=prophets.find(p=>p.id===item.id),tr=ctx.resolve(p);assert(tr,item.id);
 const ru=item.sec==='summary'?p.summaryRu:p.sections.find(s=>s.id===item.sec).textRu;
 const tg=item.sec==='summary'?tr.summary:tr.sections.find(s=>s.id===item.sec).text;
 if(item.ru!==null)assert(ru.includes(item.ru),item.id+':'+item.verse+':ru');if(item.tg!==null)assert(tg.includes(item.tg),item.id+':'+item.verse+':tg');
}
assert(prophets.find(p=>p.id==='prophet_yunus').sections.find(s=>s.id==='events').sourceRefs.some(r=>r.reference==='Коран 37:140–144'));
console.log('PASS: further bilingual editorial corrections and Yunus reference range');

// Additional refinements verified against individual Quran verses.
for (const item of [
  {
    "id": "prophet_nuh",
    "sec": "gifts",
    "ru": "В 29:15 о спасении Нуха и находившихся в ковчеге говорится вместе со знамением для миров.",
    "tg": "Дар 29:15 аз наҷоти Нӯҳ ва касоне, ки дар киштӣ буданд, ҳамроҳ бо нишонае барои ҷаҳониён хабар дода мешавад.",
    "verse": "29:15"
  },
  {
    "id": "prophet_shuayb",
    "sec": "mission",
    "ru": "запрет ущемлять людей в том, что им принадлежит",
    "tg": "манъи кам кардани ҳаққи мардум",
    "verse": "7:85"
  },
  {
    "id": "prophet_shuayb",
    "sec": "duas",
    "ru": "обращение Шуайба от лица верующих к Аллаху",
    "tg": "муроҷиати Шуъайб аз номи мӯъминон ба Аллоҳи",
    "verse": "7:89"
  },
  {
    "id": "prophet_dhul_kifl",
    "sec": "mission",
    "ru": "отмечено их терпение; Аллах ввёл их в Свою милость, поскольку они были из числа праведных.",
    "tg": "аз сабри онҳо ёд мешавад; Аллоҳ онҳоро ба раҳмати Худ дохил кард, зеро онҳо аз ҷумлаи солеҳон буданд.",
    "verse": "21:85–86"
  },
  {
    "id": "prophet_yunus",
    "sec": "summary",
    "ru": "о его бегстве к переполненному кораблю",
    "tg": "аз гурехтани ӯ ба сӯи киштии пурбор",
    "verse": "37:140"
  },
  {
    "id": "prophet_yunus",
    "sec": "summary",
    "ru": "о растении, которое Аллах взрастил над ним",
    "tg": "аз гиёҳе, ки Аллоҳ бар болои ӯ рӯёнд",
    "verse": "37:146"
  },
  {
    "id": "prophet_yunus",
    "sec": "events",
    "ru": "Юнус бежал к переполненному кораблю",
    "tg": "Юнус ба сӯи киштии пурбор гурехт",
    "verse": "37:140"
  },
  {
    "id": "prophet_yunus",
    "sec": "mission",
    "ru": "и от кого Аллах отвёл унизительное наказание земной жизни, даровав им благополучие до определённого срока.",
    "tg": "ва Аллоҳ азоби хоркунандаи зиндагии дунёро аз онҳо дур кард ва то муддате онҳоро баҳраманд гардонд.",
    "verse": "10:98"
  },
  {
    "id": "prophet_zakariya",
    "sec": "gifts",
    "ru": "и исправлении положения жены. В контексте 19:8 это означает, что Аллах даровал ей способность иметь детей.",
    "tg": "ва ислоҳи аҳволи ҳамсар сухан меравад. Бо назардошти 19:8 маънои ин он аст, ки Аллоҳ ҳамсарашро қобили фарзанддорӣ гардонд.",
    "verse": "21:90; 19:8"
  }
]) {
 const p=prophets.find(p=>p.id===item.id),tr=ctx.resolve(p);assert(tr,item.id);
 const ru=item.sec==='summary'?p.summaryRu:p.sections.find(s=>s.id===item.sec).textRu;
 const tg=item.sec==='summary'?tr.summary:tr.sections.find(s=>s.id===item.sec).text;
 assert(ru.includes(item.ru),item.id+':'+item.verse+':ru');assert(tg.includes(item.tg),item.id+':'+item.verse+':tg');
}
console.log('PASS: additional bilingual verse refinements');

// Hadith-specific bilingual editorial refinements.
{
 const p=prophets.find(p=>p.id==='prophet_muhammad'),tr=ctx.resolve(p);assert(tr);
 for(const [id,ru,tg] of [["death","опираясь на неё","ба ӯ такя карда буд"],["dua","помощи придерживаться его","устувор мондан дар он"]]){
  assert(p.sections.find(s=>s.id===id).textRu.includes(ru));assert(tr.sections.find(s=>s.id===id).text.includes(tg));
 }
}

// Linked dua integrity: both catalog layers, exact source/Arabic alignment and complete segment reconstruction.
{
 const prefix='const tajikDuaMeanings = Object.freeze(';
 const start=app.indexOf(prefix)+prefix.length, end=app.indexOf('\n});',start);
 assert(start>=prefix.length && end>start);
 const meanings=JSON.parse(app.slice(start,end+2));
 const linked=prophets.flatMap(p=>p.duaEntryIds||[]), ids=[...new Set(linked)].sort();
 assert.equal(linked.length,18);
 assert.deepEqual(ids,["h_bukhari_6369","h_muslim_2725a","q_12_101","q_14_40_41","q_20_25_28","q_21_83","q_21_87","q_21_89","q_26_169","q_27_19","q_2_127_128","q_2_250","q_5_114","q_71_28","q_7_23","q_7_89"]);
 const entries=[...db.catalog.entries,...db.catalog_additions.entries];
 let segments=0;
 for(const id of ids){
  const matches=entries.filter(e=>e.id===id);assert.equal(matches.length,1,id);
  const e=matches[0],m=meanings[id];assert(m&&m.meaning&&m.context,id);
  assert.equal(m.arabicText,e.arabicText,id);
  assert.deepEqual(m.sourceUrls,e.sourceRefs.map(s=>s.url),id);
  assert(e.segments.length&&e.segments.every(s=>s.arabicText&&s.transliterationRu&&s.translationRu),id);
  assert.equal(e.segments.map(s=>s.arabicText).join(' '),e.arabicText,id);
  assert.equal(e.segments.map(s=>s.transliterationRu).join(' '),e.transliterationRu,id);
  if(m.segments){for(const s of e.segments){const local=m.segments[s.id];assert(local&&local.meaning,id+':'+s.id);assert.equal(local.arabicText,s.arabicText,id+':'+s.id);}}
  segments+=e.segments.length;
 }
 assert.equal(segments,24);
 console.log('PASS: linked prophetic duas, 18 links, 16 unique entries and 24 segments');
}

// Editorial corrections: preserve word unity and direct address in prophetic supplications.
{
 const entries=[...db.catalog.entries,...db.catalog_additions.entries];
 const y=entries.find(e=>e.id==='q_12_101'),i=entries.find(e=>e.id==='q_14_40_41');
 assert(y.transliterationRu.includes('атайтани'));assert(!y.transliterationRu.includes('атай-тани'));
 assert(i.translationRu.includes('[некоторых] моих потомков'));
 const prefix='const tajikDuaMeanings = Object.freeze(',start=app.indexOf(prefix)+prefix.length,end=app.indexOf('\n});',start);
 const tg=JSON.parse(app.slice(start,end+2));
 assert(tg.q_2_127_128.meaning.includes('фармонбардори Ту'));
 assert(tg.q_14_40_41.meaning.includes('Эй Парвардигори мо! Дуои маро бипазир.'));
 for(const id of ['q_2_127_128','q_14_40_41']){
  const e=entries.find(x=>x.id===id);assert.equal(e.segments.map(s=>tg[id].segments[s.id].meaning).join(' '),tg[id].meaning);
 }
}
