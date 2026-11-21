'use strict';
// Source-grounded regression checks for selected adhkar.
// These assertions protect known text/context facts; they are NOT an expert
// religious, phonetic or translation certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const entries = [...data.catalog.entries, ...data.catalog_additions.entries];
const byId = new Map(entries.map(entry => [entry.id, entry]));
const get = id => {
  const item = byId.get(id);
  assert.ok(item, `Missing source-audited entry: ${id}`);
  return item;
};
const sourceIs = (entry, ref) => {
  assert.ok(entry.sourceRefs.some(s => String(s.url || '').includes(ref)),
    `${entry.id}: source URL must point to ${ref}`);
};
const hasWords = (entry, words) => {
  // Ignore Arabic tashkeel and spacing variation only. Not a substitute for
  // verifying the full vocalized Arabic text against the exact narration.
  const normalize = str => str
    .normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  assert.ok(normalize(entry.arabicText).includes(normalize(words)),
    `${entry.id}: missing Arabic source phrase: ${words}`);
};

// Sahih Muslim 2692: "Subhan Allah wa bihamdihi", 100 morning and evening.
// https://sunnah.com/muslim:2692
const praise = get('h_muslim_2692');
sourceIs(praise, 'muslim:2692');
hasWords(praise, 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ');
assert.match(praise.transliterationRu, /би-хамдихи/i,
  'Continuous reading should display the final vowel (hi)');
assert.match(praise.transliterationNoteRu || '', /остановк/i,
  'Explain the pausal alternative rather than erasing the final vowel');

// Sunan Abi Dawud 5088: morning and evening, three repetitions.
// https://sunnah.com/abudawud:5088
const protection = get('h_abudawud_5088');
sourceIs(protection, 'abudawud:5088');
hasWords(protection, 'بِسْمِ اللَّهِ الَّذِي');
hasWords(protection, 'وَهُوَ السَّمِيعُ الْعَلِيمُ');
assert.ok(protection.repetitionRule,
  'Source states three repetitions; a repetition rule is required');
assert.ok(JSON.stringify(protection.repetitionRule).includes('3'),
  'Repetition rule should contain three; manually verify its scope');

// Jami at-Tirmidhi 3391: the morning and evening endings are NOT interchangeable.
// https://sunnah.com/tirmidhi:3391
const morning = get('h_tirmidhi_3391_morning');
const evening = get('h_tirmidhi_3391_evening');
sourceIs(morning, 'tirmidhi:3391');
sourceIs(evening, 'tirmidhi:3391');
hasWords(morning, 'وَإِلَيْكَ الْمَصِيرُ');
hasWords(evening, 'وَإِلَيْكَ النُّشُورُ');
assert.ok(!morning.arabicText.includes('النُّشُورُ'),
  'Morning text accidentally contains the evening ending');
assert.ok(!evening.arabicText.includes('الْمَصِيرُ'),
  'Evening text accidentally contains the morning ending');

// Sahih al-Bukhari 6306: Sayyid al-Istighfar. Source mentions daytime/nighttime
// with conviction; do not invent an exact hour or mandated repeat count.
// https://sunnah.com/bukhari:6306
const istighfar = get('h_bukhari_6306');
sourceIs(istighfar, 'bukhari:6306');
hasWords(istighfar, 'اللَّهُمَّ أَنْتَ رَبِّي');

console.log('PASS selected adhkar source regression checks');
console.log('NOTE full vocalization, transliteration and translation still need expert review');
