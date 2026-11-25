'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),db=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const start=app.indexOf('const tajikLibraryProfiles = '),end=app.indexOf('const title = (x, kind)',start);
assert(start>=0&&end>start);
const ctx=vm.createContext({isTajik:()=>true});
vm.runInContext(app.slice(start,end)+'\nthis.resolve=tajikLibraryProfile;this.localize=localizedLibrary;',ctx);
const prophets=db.library.items.filter(p=>p.kind==='prophet');
assert.equal(prophets.length,25);assert.equal(prophets.filter(ctx.resolve).length,12);
for(const id of ["prophet_adam","prophet_idris","prophet_nuh","prophet_hud","prophet_salih","prophet_ibrahim","prophet_lut","prophet_ismail","prophet_ishaq","prophet_yaqub","prophet_yusuf","prophet_ayyub"]){const p=prophets.find(x=>x.id===id),t=ctx.resolve(p);assert(t);assert.equal(t.sections.length,p.sections.length);for(const [i,s] of p.sections.entries()){assert.equal(t.sections[i].id,s.id);assert(t.sections[i].title&&t.sections[i].text);}for(const mutate of [p=>p.summaryRu+='x',p=>p.sections[0].sourceRefs[0].url+='x',p=>p.sections.reverse(),p=>p.duaEntryIds.push('changed')]){const clone=JSON.parse(JSON.stringify(p));mutate(clone);assert.equal(ctx.resolve(clone),null);}}
assert(ctx.resolve(prophets.find(x=>x.id==='prophet_nuh')).sections[3].text.includes('ба давомнокии умумии муайяншудаи умр'));
ctx.isTajik=()=>false;assert.equal(ctx.localize(prophets[0]),null);
assert(app.includes('data-tg-prophet-progress'));assert(app.includes('data-tg-library-profile'));
console.log('PASS: twelve guarded prophet biographies; original source references and order retained');

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
