'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),db=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const start=app.indexOf('const tajikLibraryProfiles = '),end=app.indexOf('const title = (x, kind)',start);
assert(start>=0&&end>start);
const ctx=vm.createContext({isTajik:()=>true});
vm.runInContext(app.slice(start,end)+'\nthis.resolve=tajikLibraryProfile;this.localize=localizedLibrary;',ctx);
const prophets=db.library.items.filter(p=>p.kind==='prophet');
assert.equal(prophets.length,25);assert.equal(prophets.filter(ctx.resolve).length,3);
for(const id of ["prophet_adam","prophet_idris","prophet_nuh"]){const p=prophets.find(x=>x.id===id),t=ctx.resolve(p);assert(t);assert.equal(t.sections.length,p.sections.length);for(const [i,s] of p.sections.entries()){assert.equal(t.sections[i].id,s.id);assert(t.sections[i].title&&t.sections[i].text);}for(const mutate of [p=>p.summaryRu+='x',p=>p.sections[0].sourceRefs[0].url+='x',p=>p.sections.reverse(),p=>p.duaEntryIds.push('changed')]){const clone=JSON.parse(JSON.stringify(p));mutate(clone);assert.equal(ctx.resolve(clone),null);}}
assert(ctx.resolve(prophets.find(x=>x.id==='prophet_nuh')).sections[3].text.includes('ба давомнокии умумии муайяншудаи умр'));
ctx.isTajik=()=>false;assert.equal(ctx.localize(prophets[0]),null);
assert(app.includes('data-tg-prophet-progress'));assert(app.includes('data-tg-library-profile'));
console.log('PASS: three guarded prophet biographies; original source references and order retained');
