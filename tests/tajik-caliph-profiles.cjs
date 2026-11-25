'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),db=JSON.parse(fs.readFileSync('data/caliph_history.json','utf8'));
const start=app.indexOf('const tajikCaliphProfiles = '),end=app.indexOf('const title = (x, kind)',start);
assert(start>=0&&end>start);
const ctx=vm.createContext({isTajik:()=>true});
vm.runInContext(app.slice(start,end)+'\nthis.resolve=tajikCaliphProfile;this.localized=localizedCaliph;',ctx);
const original=db.profiles.find(x=>x.id==='person_abu_bakr'),t=ctx.resolve(original);
assert(t);assert.equal(t.sections.length,12);assert.equal(t.sections.flatMap(s=>s.views||[]).length,6);
for(const [i,s] of original.sections.entries()){assert.equal(t.sections[i].id,s.id);assert.equal(Boolean(t.sections[i].uncertainty),Boolean(s.uncertaintyRu));assert.equal((t.sections[i].views||[]).length,(s.views||[]).length);}
for(const mutate of [x=>x.summaryRu+='x',x=>x.sections[0].sourceIds.push('unknown'),x=>x.sections[5].views[0].tradition='unknown',x=>x.sections[6].views[0].textRu+='x',x=>x.sections.reverse()]){
 const changed=JSON.parse(JSON.stringify(original));mutate(changed);assert.equal(ctx.resolve(changed),null);
}
assert.equal(db.profiles.filter(ctx.resolve).length,5);ctx.isTajik=()=>false;assert.equal(ctx.localized(original),null);
assert(app.includes('inlineSources(v.sourceIds)'));assert(app.includes('inlineSources(s.sourceIds)'));assert(app.includes('data-tg-caliph-profile'));
console.log('PASS: five complete guarded Tajik biographies, section and attributed-view parity');

ctx.isTajik=()=>true;
const umar=db.profiles.find(x=>x.id==='person_umar'),ut=ctx.resolve(umar);
assert(ut);assert.equal(ut.sections.length,14);assert.equal(ut.sections.flatMap(s=>s.views||[]).length,3);
for(const [i,s] of umar.sections.entries()){assert.equal(ut.sections[i].id,s.id);assert.equal(Boolean(ut.sections[i].uncertainty),Boolean(s.uncertaintyRu));assert.equal((ut.sections[i].views||[]).length,s.views.length);}
for(const mutate of [x=>x.reignRu+='x',x=>x.sections[5].textRu+='x',x=>x.sections[7].views[2].sourceIds.reverse(),x=>x.sections[13].uncertaintyRu+='x']){const changed=JSON.parse(JSON.stringify(umar));mutate(changed);assert.equal(ctx.resolve(changed),null);}
assert(ut.sections[5].text.includes('Мазмуни санади навиштанашуда маълум нест'));
assert(ut.sections[12].uncertainty.includes('Гуноҳ ба гурӯҳҳои қавмӣ'));
console.log('PASS: Umar biography, uncertainty and attributed-view parity');

const uthman=db.profiles.find(x=>x.id==='person_uthman'),utman=ctx.resolve(uthman);
assert(utman);assert.equal(utman.sections.length,12);assert.equal(utman.sections.flatMap(s=>s.views||[]).length,6);
for(const [i,s] of uthman.sections.entries()){assert.equal(utman.sections[i].id,s.id);assert.equal(Boolean(utman.sections[i].uncertainty),Boolean(s.uncertaintyRu));assert.equal((utman.sections[i].views||[]).length,s.views.length);}
for(const mutate of [x=>x.sections[7].textRu+='x',x=>x.sections[7].views[1].sourceIds.push('unknown'),x=>x.sections[9].uncertaintyRu+='x',x=>x.relatedEventIds.reverse()]){const changed=JSON.parse(JSON.stringify(uthman));mutate(changed);assert.equal(ctx.resolve(changed),null);}
assert(utman.sections[7].text.includes('Усмон ҳамчун офарандаи ваҳйи нав муаррифӣ нашудааст'));
assert(utman.sections[9].uncertainty.includes('муаллифи номаи баҳснок'));
console.log('PASS: Uthman biography, uncertainty and attributed-view parity');

const ali=db.profiles.find(x=>x.id==='person_ali'),at=ctx.resolve(ali);
assert(at);assert.equal(at.sections.length,14);assert.equal(at.sections.flatMap(s=>s.views||[]).length,5);
for(const [i,s] of ali.sections.entries()){assert.equal(at.sections[i].id,s.id);assert.equal(Boolean(at.sections[i].uncertainty),Boolean(s.uncertaintyRu));assert.equal((at.sections[i].views||[]).length,s.views.length);}
for(const mutate of [x=>x.sections[4].textRu+='x',x=>x.sections[4].views[2].sourceIds.push('unknown'),x=>x.sections[9].uncertaintyRu+='x',x=>x.relatedEventIds.reverse()]){const changed=JSON.parse(JSON.stringify(ali));mutate(changed);assert.equal(ctx.resolve(changed),null);}
assert(at.sections[4].uncertainty.includes('Муслим 2408a'));
assert(at.sections[13].text.includes('довудии буҳра'));
console.log('PASS: Ali biography, uncertainty, Ghadir attribution and imamate numbering');

const hasan=db.profiles.find(x=>x.id==='person_hasan'),ht=ctx.resolve(hasan);
assert(ht);assert.equal(ht.sections.length,14);assert.equal(ht.sections.flatMap(s=>s.views||[]).length,3);
assert(ht.hasanStatusNote.includes('баъзан халифаи панҷуми рошид'));
assert(ht.sections[7].text.includes('Абӯбакра дар ин ҷо саҳобии дигар аст'));
assert(ht.sections[10].views[1].title.includes('низорӣ'));
assert(ht.sections[10].views[2].title.includes('довудии буҳра'));
for(const mutate of [x=>x.hasanStatusNoteRu+='x',x=>x.hasanStatusSourceIds.reverse(),x=>x.sections[10].views[2].sourceIds.push('unknown'),x=>x.sections[11].uncertaintyRu+='x']){const changed=JSON.parse(JSON.stringify(hasan));mutate(changed);assert.equal(ctx.resolve(changed),null);}
for(const p of db.profiles){const t=ctx.resolve(p);assert(t,p.id);assert.equal(t.sections.length,p.sections.length);assert.equal(Boolean(t.hasanStatusNote),Boolean(p.hasanStatusNoteRu));for(const [i,s] of p.sections.entries()){assert.equal(t.sections[i].id,s.id);assert.equal(Boolean(t.sections[i].uncertainty),Boolean(s.uncertaintyRu));assert.equal((t.sections[i].views||[]).length,s.views.length);}for(const id of [...(p.hasanStatusSourceIds||[]),...p.sections.flatMap(s=>[...s.sourceIds,...s.views.flatMap(v=>v.sourceIds)])])assert(db.sources.some(s=>s.id===id),id);}
console.log('PASS: all five biographies, source references, section and attributed-view parity');
