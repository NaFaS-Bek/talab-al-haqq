'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('stories-tg.html','utf8');
const ru=fs.readFileSync('stories.html','utf8');
const original=[...ru.matchAll(/<article class="story" id="([^"]+)" data-story="([^"]+)"/g)].map(x=>x[1]);
const blocks=[...source.matchAll(/<article class="story" id="([^"]+)"[\s\S]*?<\/article>/g)];
assert.equal(original.length,18);
assert.deepEqual(blocks.map(b=>b[1]),['story-yusuf','story-musa','story-ibrahim','story-maryam','story-luqman','story-nuh'],'Tajik batch must map to six original stories');
assert.match(source,/<html lang="tg">/);
assert.match(source,/<h1>Қиссаҳои ибратомӯз<\/h1>/);
assert.match(source,/бозгӯии мустақили маънои оятҳо/);
assert.match(source,/ташхиси мустақили коршиносон анҷом наёфтааст/);
assert.match(source,/12 қиссаи дигар/);
assert(source.includes('href="stories.html"'),'Tajik readers must be told how to reach remaining Russian originals');
const sources={
 'story-yusuf':['12/89','12/90','12/91','12/92'],
 'story-musa':['28/7','28/8','28/9','28/10','28/11','28/12','28/13'],
 'story-ibrahim':['2/125','2/127','2/128','2/129'],
 'story-maryam':["3/35","3/36","3/37"],
 'story-luqman':["31/12","31/13","31/14","31/15","31/16","31/17","31/18","31/19"],
 'story-nuh':["11/42","11/43","11/45","11/46","11/47"]
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
console.log('PASS: six original Tajik Quran story retellings, same verse references and transparency');
console.log('NOT CERTIFIED: independent literary Tajik and theological proofreading');
