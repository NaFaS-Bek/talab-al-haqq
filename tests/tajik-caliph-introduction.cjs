'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('app.js','utf8'),db=JSON.parse(fs.readFileSync('data/caliph_history.json','utf8'));
const start=app.indexOf('const tajikCaliphIntroduction = '),end=app.indexOf('function caliphPage()',start);
assert(start>=0&&end>start);
const ctx=vm.createContext({isTajik:()=>true});
vm.runInContext(app.slice(start,end)+'\nthis.resolve=caliphIntroTajik;',ctx);
const i=db.introduction,t=ctx.resolve(i);
assert(t);assert.equal(t.terms.length,3);assert(t.text.includes('632–661'));assert(t.text.includes('Ин таснифоти мавриди иттифоқи ҳамаи мусалмонон нест'));
assert(t.terms[1].text.includes('Ҳасанро панҷум ном намебарад'));
assert(t.terms[2].text.includes('дувоздаҳимомӣ ва исмоилӣ'));
for(const mutate of [v=>v.textRu+='x',v=>v.sourceIds.push('unknown'),v=>v.terms[0].textRu+='x',v=>v.terms[1].sourceIds.reverse()]){
 const changed=JSON.parse(JSON.stringify(i));mutate(changed);assert.equal(ctx.resolve(changed),null);
}
ctx.isTajik=()=>false;assert.equal(ctx.resolve(i),null);
assert(app.includes('data-tg-caliph-progress'));assert(app.includes('data-tg-card-pending'));assert(app.includes('data-tg-untranslated'));
assert(app.includes('inlineSources(t.sourceIds)'));assert(app.includes('sourceInfo(i)'));
console.log('PASS: guarded Tajik historical introduction, source attribution and untranslated fallback');
console.log('NOT CERTIFIED: historical, religious or independent linguistic review');
