'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('stories-tg.html','utf8');
const ru=fs.readFileSync('stories.html','utf8');
const original=[...ru.matchAll(/<article class="story" id="([^"]+)" data-story="([^"]+)"/g)].map(x=>x[1]);
const blocks=[...source.matchAll(/<article class="story" id="([^"]+)"[\s\S]*?<\/article>/g)];
assert.equal(original.length,18);
assert.deepEqual(blocks.map(b=>b[1]),['story-yusuf','story-musa','story-ibrahim','story-maryam','story-luqman','story-nuh','story-ayyub','story-yunus','story-zakariya','story-ibrahim-father','story-musa-well','story-sulayman-ant'],'Tajik batch must map to twelve original stories');
assert.match(source,/<html lang="tg">/);
assert.match(source,/<h1>Қиссаҳои ибратомӯз<\/h1>/);
assert.match(source,/бозгӯии мустақили маънои оятҳо/);
assert.match(source,/ташхиси мустақили коршиносон анҷом наёфтааст/);
assert.match(source,/6 қиссаи дигар/);
assert(source.includes('href="stories.html"'),'Tajik readers must be told how to reach remaining Russian originals');
const sources={
 'story-yusuf':['12/89','12/90','12/91','12/92'],
 'story-musa':['28/7','28/8','28/9','28/10','28/11','28/12','28/13'],
 'story-ibrahim':['2/125','2/127','2/128','2/129'],
 'story-maryam':["3/35","3/36","3/37"],
 'story-luqman':["31/12","31/13","31/14","31/15","31/16","31/17","31/18","31/19"],
 'story-nuh':["11/42","11/43","11/45","11/46","11/47"],
 'story-ayyub':["21/83","21/84"],
 'story-yunus':["37/139","37/142","21/87","21/88"],
 'story-zakariya':["19/2","19/3","19/4","19/5","19/6","19/7","19/8","19/9"],
 'story-ibrahim-father':["19/41","19/42","19/43","19/44","19/45","19/46","19/47","19/48"],
 'story-musa-well':["28/22","28/23","28/24","28/25","28/26","28/27","28/28"],
 'story-sulayman-ant':["27/17","27/18","27/19"]
};
for(const [html,id] of blocks){
 assert(html.includes('Хулосаҳои таҳрирӣ'),id+' missing editorial lessons');
 assert(html.includes('Мақом: бозгӯӣ дар сатҳи таҳрирӣ'),id+' missing status');
 const actual=[...new Set([...html.matchAll(/href="https:\/\/quran\.com\/(\d+\/\d+)"/g)].map(m=>m[1]))].sort();
 assert.deepEqual(actual,sources[id].slice().sort(),id+' Quran verses changed');
 const ruBlock=ru.match(new RegExp('<article class="story" id="'+id+'"[\\s\\S]*?</article>'))[0];
 const ruRefs=[...new Set([...ruBlock.matchAll(/href="https:\/\/quran\.com\/(\d+\/\d+)"/g)].map(m=>m[1]))].sort();
 assert.deepEqual(actual,ruRefs,id+' must preserve original Quran references');
 assert(source.includes('href="#'+id+'"'),id+' missing navigation');
 assert(!html.includes('https://sunnah.com/'),id+' Quran-only story must not import other narrations');
}
console.log('PASS: twelve original Tajik Quran story retellings, same verse references and transparency');
console.log('NOT CERTIFIED: independent literary Tajik and theological proofreading');
