'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
execFileSync(process.execPath,['--check','app.js']);
const app = fs.readFileSync('app.js','utf8');
const data = JSON.parse(fs.readFileSync('data/content.json','utf8'));
const caliphs = JSON.parse(fs.readFileSync('data/caliph_history.json','utf8'));
const library = data.library.items;
const events = data.history.events;
const dua = [...new Map([...data.catalog.entries,...data.catalog_additions.entries].map(x=>[x.id,x])).values()];
const kinds = ['basics','prayer','surah','prophet','family'];
for (const kind of kinds) {
  assert(library.some(x=>x.kind===kind), 'Empty knowledge category: '+kind);
  assert(app.includes("id:'"+kind+"'"), 'Missing knowledge navigation: '+kind);
}
assert(library.every(x=>kinds.includes(x.kind)), 'Uncategorized library material');
assert(events.length>0 && app.includes("?'events':x.kind"),'History events must have own category');
assert(caliphs.profiles.length>0, 'Missing caliph profiles');
const categories = [...data.catalog.categories,...data.catalog_additions.categories];
for (const category of categories) {
  assert(dua.some(x=>(x.categoryIds||[]).includes(category.id)), 'Empty dua category: '+category.id);
}
assert(app.includes('data-home-knowledge'), 'Missing homepage knowledge shortcuts');
assert(app.includes('data-back'), 'Missing category back navigation');
console.log('PASS: JS syntax, '+library.length+' library items, '+events.length+' events, '+dua.length+' dua, '+categories.length+' dua categories');
