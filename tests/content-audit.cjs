'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('data/content.json','utf8'));
const entries=[...data.catalog.entries,...data.catalog_additions.entries];
const failures=[],warnings=[];
const ids=new Set();
for(const e of entries){
 const label=e.id||'(missing id)';
 if(!e.id||ids.has(e.id)) failures.push(label+': missing or duplicate ID');
 ids.add(e.id);
 for(const field of ['arabicText','transliterationRu','translationRu','transliterationScheme','translationAttribution','reviewStatus']){
   if(typeof e[field]!=='string'||!e[field].trim()) failures.push(label+': missing '+field);
 }
 if(!Array.isArray(e.sourceRefs)||!e.sourceRefs.length) failures.push(label+': missing sourceRefs');
 else for(const ref of e.sourceRefs){
  if(!ref.collection||!ref.number||!/^https:\/\//.test(ref.url||'')) failures.push(label+': incomplete source reference');
 }
 if(!['draft','source_checked','expert_checked'].includes(e.reviewStatus)) warnings.push(label+': unrecognized review status '+e.reviewStatus);
 if(e.reviewStatus==='source_checked'&&!e.reviewRecords?.some(r=>r.role==='source_reference_check')) failures.push(label+': source_checked without documented check');
 if(e.reviewStatus!=='expert_checked') warnings.push(label+': Arabic/transliteration/translation not independently expert verified');
 if(Array.isArray(e.segments)) for(const s of e.segments){
  for(const field of ['arabicText','transliterationRu','translationRu']) if(!s[field]) failures.push(label+': segment '+s.id+' missing '+field);
 }
}
const praise=entries.find(e=>e.id==='h_muslim_2692');
assert.equal(praise.transliterationRu,'Субханаллахи ва би-хамдихи.');
assert.equal(praise.segments[0].transliterationRu,praise.transliterationRu);
assert.match(praise.transliterationNoteRu,/остановке/);
const bedtime=entries.find(e=>e.id==='h_muslim_2727a');
assert.deepEqual(bedtime.repetitionRule.stages.map(s=>[s.id,s.count]),[['takbir',34],['tasbih',33],['tahmid',33]]);
const counts=entries.reduce((acc,e)=>(acc[e.reviewStatus]=(acc[e.reviewStatus]||0)+1,acc),{});
console.log(JSON.stringify({entries:entries.length,statuses:counts,structuralFailures:failures,expertReviewWarnings:warnings.length},null,2));
assert.deepEqual(failures,[],'Content metadata integrity checks failed');
console.log('PASS structural audit (not a religious authenticity certification)');
