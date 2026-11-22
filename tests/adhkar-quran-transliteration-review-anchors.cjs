'use strict';
// Human-review anchors for all 15 Quranic dua cards, NOT a pronunciation test.
// Each pair points to a real Arabic phrase and the corresponding Russian
// approximation. A changed phrase must be revisited by an editor before CI passes.
const assert = require('node:assert/strict');
const fs = require('node:fs');

const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const entries = [...data.catalog.entries, ...data.catalog_additions.entries];
const quranDuas = entries.filter(x => x.originKind === 'quran' && x.contentKind === 'dua');
const byId = new Map(quranDuas.map(x => [x.id, x]));

const anchors = [
  ['q_17_24', 'ٱخْفِضْ', 'Вахфид', 'ض; onset and connected reading'],
  ['q_2_250', 'قَالُوا۟', 'калю', 'ق; long vowel and plural ending'],
  ['q_27_19', 'أَوْزِعْنِىٓ', 'аузи‘ни', 'ع; vowel length'],
  ['q_7_23', 'قَالَا', 'Каля', 'ق; dual ending versus simple Cyrillic approximation'],
  ['q_71_28', 'ٱلظَّٰلِمِينَ', 'з-залимина', 'ظ; long vowels and assimilation'],
  ['q_14_40_41', 'ٱلصَّلَوٰةِ', 'с-саляти', 'ص; long vowel and pause'],
  ['q_2_127_128', 'ٱلسَّمِيعُ', 'с-сами‘у', 'ع; long vowel and final vowel'],
  ['q_26_169', 'نَجِّنِى', 'наджжини', 'shadda and long ending'],
  ['q_12_101', 'ٱلْأَحَادِيثِ', 'ахадис', 'ح, ث; contrast and long vowels'],
  ['q_21_83', 'ٱلضُّرُّ', 'д-дурру', 'ض; shadda and article assimilation'],
  ['q_7_89', 'رَبَّنَا ٱفْتَحْ', 'Раббана-ф-тах', 'ح; connected reading across word boundary'],
  ['q_20_25_28', 'ٱشْرَحْ', 'Рабби-шрах', 'ح; hamzat al-wasl and connected reading'],
  ['q_21_87', 'ٱلظُّلُمَٰتِ', 'з-зулюмати', 'ظ; article assimilation and long vowel'],
  ['q_21_89', 'ٱلْوَٰرِثِينَ', 'варисин', 'ث; vowel length'],
  ['q_5_114', 'ٱرْزُقْنَا', 'варзукна', 'ق; connected reading']
];

assert.equal(quranDuas.length, 15, 'Expected 15 Quranic dua cards for human phonetic review');
assert.equal(anchors.length, 15, 'Every Quranic dua needs an identified review anchor');
assert.equal(new Set(anchors.map(x => x[0])).size, anchors.length, 'Duplicate review anchor');
assert.deepEqual(new Set(anchors.map(x => x[0])), new Set(quranDuas.map(x => x.id)),
  'Human-review anchor coverage changed; update this checklist deliberately');

for (const [id, arabic, russian, focus] of anchors) {
  const card = byId.get(id);
  assert.ok(card, id + ': card missing');
  assert.ok(focus.length > 4, id + ': no reason for manual phonetics review');
  assert.ok(card.arabicText.includes(arabic),
    id + ': Arabic review anchor changed; recheck against the publisher source');
  assert.ok(card.transliterationRu.includes(russian),
    id + ': Russian review anchor changed; do not auto-approve new pronunciation');
  assert.ok(card.segments?.some(s =>
    s.arabicText.includes(arabic) && s.transliterationRu.includes(russian)),
    id + ': Arabic/Russian review anchor no longer belongs to the same segment');
  assert.ok(card.sourceRefs?.some(s => /^https:\/\/quran\.com\/\d+\/\d+$/.test(s.url || '')),
    id + ': exact Quran passage URL missing');
  assert.notEqual(card.reviewStatus, 'expert_checked',
    id + ': mechanical checks are not independent teacher verification');
}

console.log('PASS: 15/15 Quranic dua cards have anchored Arabic/Russian review locations.');
console.log('PENDING: all 15 require qualified human recitation/phonetic review;');
console.log('this test does not certify tajwid, makharij, pause rules or transcription accuracy.');
