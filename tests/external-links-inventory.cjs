'use strict';
// Deterministic inventory, not an HTTP availability or authenticity certification.
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html')).sort();
const jsonFiles = ['data/content.json', 'data/caliph_history.json'];
const records = new Map();
const malformed = [];
let occurrences = 0;

function classify(hostname) {
  if (hostname === 'quran.com' || hostname.endsWith('.quran.com')) return 'quran';
  if (hostname === 'sunnah.com' || hostname.endsWith('.sunnah.com')) return 'hadith';
  return 'other';
}

function add(raw, origin) {
  const value = raw.trim().replace(/&amp;/gi, '&').replace(/&#38;/g, '&');
  if (!/^https?:\/\//i.test(value)) return;
  occurrences++;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      malformed.push({url: value, origin, reason: 'unsupported URL'});
      return;
    }
    const key = url.href;
    let entry = records.get(key);
    if (!entry) {
      entry = {
        url: key, hostname: url.hostname.toLowerCase(),
        category: classify(url.hostname.toLowerCase()), https: url.protocol === 'https:',
        occurrences: 0, examples: []
      };
      records.set(key, entry);
    }
    entry.occurrences++;
    if (entry.examples.length < 5 && !entry.examples.includes(origin)) entry.examples.push(origin);
  } catch {
    malformed.push({url: value, origin, reason: 'unparseable URL'});
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const re = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(re)) add(match[1] ?? match[2] ?? '', file + ':href');
}

function scan(value, origin) {
  if (typeof value === 'string') { add(value, origin); return; }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) scan(value[i], origin + '[' + i + ']');
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) scan(nested, origin + '.' + key);
  }
}
for (const file of jsonFiles) scan(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')), file);

const urls = [...records.values()].sort((a, b) => a.url.localeCompare(b.url, 'en'));
const hosts = {};
for (const entry of urls) hosts[entry.hostname] = (hosts[entry.hostname] || 0) + 1;
const report = {
  scope: 'Quoted href attributes in root HTML plus absolute HTTP(S) string fields in the two content JSON files',
  limitation: 'Offline inventory only; no HTTP status, redirects, target verse/hadith or theological accuracy verified',
  htmlFiles: htmlFiles.length, jsonFiles, occurrences,
  uniqueUrls: urls.length, nonHttpsUrls: urls.filter(x => !x.https).length,
  malformed: malformed.length, uniqueHosts: Object.keys(hosts).length,
  hosts: Object.fromEntries(Object.entries(hosts).sort((a, b) => a[0].localeCompare(b[0], 'en'))),
  malformedDetails: malformed, urls
};
fs.mkdirSync(path.join(root, 'build'), {recursive: true});
const dest = path.join(root, 'build/external-links-inventory.json');
fs.writeFileSync(dest, JSON.stringify(report, null, 2) + '\n');
console.log('External links inventory:', JSON.stringify({
  htmlFiles: report.htmlFiles, occurrences: report.occurrences,
  uniqueUrls: report.uniqueUrls, uniqueHosts: report.uniqueHosts,
  nonHttpsUrls: report.nonHttpsUrls, malformed: report.malformed,
  output: 'build/external-links-inventory.json'
}));
if (htmlFiles.length < 20) throw new Error('Unexpectedly few HTML pages in link inventory');
if (urls.length === 0) throw new Error('No external links discovered; check inventory parser');
