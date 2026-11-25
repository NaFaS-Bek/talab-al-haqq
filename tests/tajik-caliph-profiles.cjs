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
assert.equal(db.profiles.filter(ctx.resolve).length,1);ctx.isTajik=()=>false;assert.equal(ctx.localized(original),null);
assert(app.includes('inlineSources(v.sourceIds)'));assert(app.includes('inlineSources(s.sourceIds)'));assert(app.includes('data-tg-caliph-profile'));
console.log('PASS: one complete guarded Tajik biography, section and attributed-view parity');
