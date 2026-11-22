'use strict';
// Source-context regression for Quran 2:236–237 on divorce before consummation.
// This checks the site's editorial boundaries and links, not judicial fiqh,
// specialist Quran interpretation or religious authentication.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('family-mahr.html','utf8');
const first=html.match(/<section class="card" id="section-1">([\s\S]*?)<\/section>/);
assert(first,'Mahr source section missing');
const source=first[1];
for(const url of ['https://quran.com/4/4','https://quran.com/4/20',
 'https://quran.com/2/236','https://quran.com/2/237']){
 assert(source.includes('href="'+url+'"'),'Mahr Quran source missing '+url);
}
assert(/Когда размер махра уже был установлен[\s\S]*?https:\/\/quran\.com\/2\/237/.test(source),
 'Quran 2:237 must be attached to PRE-SET mahr');
assert(/Когда размер махра ещё не был установлен[\s\S]*?https:\/\/quran\.com\/2\/236/.test(source),
 'Quran 2:236 must be attached to UNSPECIFIED mahr');
assert(source.includes('до супружеской близости'),
 'Both distinctions are specifically about divorce before consummation');
assert(source.includes('половине назначенного дара'),
 'Quran 2:237 fixed half-dowry rule needs an accurate description');
assert(source.includes('возможности добровольного прощения или уступки'),
 'Quran 2:237 exception cannot be silently omitted');
assert(source.includes('соразмерного дара в соответствии с возможностями'),
 'Quran 2:236 should not be misrepresented as a fixed half-dowry obligation');
assert(source.includes('Нельзя переносить правило о половине назначенного махра на любой развод'),
 'Must warn readers against generalizing to every unconsummated divorce');
assert(source.includes('не полная фетва'),
 'Educational summary must not purport to determine an individual ruling');
assert(source.includes('правовой школы'),
 'Different concrete jurisprudential implementations need qualification');
assert(!/Особые случаи, например развод до близости, рассматриваются отдельно в/.test(source),
 'Do not regress to ambiguously citing only 2:237');
const quiz=html.match(/<section class="card" id="section-4">([\s\S]*?)<\/section>/);
assert(quiz,'Mahr learning check missing');
assert(quiz[1].includes('К любому ли разводу до близости'),
 'Students must explicitly check the applicability of the rule');
assert(quiz[1].includes('https://quran.com/2/236')&&
 quiz[1].includes('https://quran.com/2/237'),
 'Self-check must link to both relevant verses');
assert(html.includes('https://sunnah.com/bukhari:5150'),
 'Contextual Bukhari reference must be preserved');
assert(!html.includes('Урок 2 из 4'),'Outdated curriculum numbering must not recur');
console.log('PASS: Quran 2:236 (unspecified mahr), 2:237 (fixed mahr) and self-check editorial boundaries');
console.log('NOT CERTIFIED: independent madhhab-specific legal review or application to a real divorce');
