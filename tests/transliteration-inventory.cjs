'use strict';
// Read-only inventory for manual Arabic/transliteration audit.
// Usage: node tests/transliteration-inventory.cjs > transliteration-inventory.json
// It deliberately makes no changes and never labels religious text "verified".
const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync('data/content.json', 'utf8'));
const entries = [
  ...(data.catalog?.entries || []),
  ...(data.catalog_additions?.entries || []),
];
const canonical = value => String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
const issues = [];
const seen = new Set();
const records = entries.map(entry => {
  const id = entry.id || '(missing-id)';
  const flags = [];
  if (seen.has(id)) flags.push('duplicate-id');
  seen.add(id);
  for (const key of ['arabicText', 'transliterationRu', 'translationRu']) {
    if (!canonical(entry[key])) flags.push('missing-' + key);
  }
  const segments = Array.isArray(entry.segments) ? entry.segments : [];
  for (const [index, segment] of segments.entries()) {
    for (const key of ['arabicText', 'transliterationRu', 'translationRu']) {
      if (!canonical(segment[key])) flags.push('segment-' + index + '-missing-' + key);
    }
  }
  // Only a one-segment card can be compared directly with the parent without
  // guessing about punctuation, phonetic conventions or segment boundaries.
  if (segments.length === 1) {
    for (const key of ['arabicText', 'transliterationRu', 'translationRu']) {
      if (canonical(segments[0][key]) !== canonical(entry[key])) {
        flags.push('single-segment-differs-' + key);
      }
    }
  }
  if (!Array.isArray(entry.sourceRefs) || !entry.sourceRefs.length) flags.push('missing-source');
  if (entry.reviewStatus !== 'expert_checked') flags.push('not-expert-checked');
  const record = {
    id, reviewStatus: entry.reviewStatus || null,
    sourceUrls: (entry.sourceRefs || []).map(ref => ref.url).filter(Boolean),
    arabicText: entry.arabicText || '',
    transliterationRu: entry.transliterationRu || '',
    translationRu: entry.translationRu || '',
    noteRu: entry.transliterationNoteRu || '',
    segments: segments.map(segment => ({
      id: segment.id || null,
      arabicText: segment.arabicText || '',
      transliterationRu: segment.transliterationRu || '',
      translationRu: segment.translationRu || '',
    })),
    flags,
  };
  if (flags.length) issues.push({ id, flags });
  return record;
});
const output = {
  explanation: 'Inventory and heuristics only. Compare every phrase with its cited narration and qualified reviewer. Differences are not automatic errors.',
  totalEntries: records.length,
  totalFlagged: issues.length,
  issues,
  records,
};
process.stdout.write(JSON.stringify(output, null, 2) + '\n');
