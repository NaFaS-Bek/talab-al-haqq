'use strict';
// Audit local site structure and links, NOT theology, external HTTP reachability,
// full browser accessibility compliance, security pentesting or production deploy.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const pages=fs.readdirSync(root).filter(n=>/\.html$/i.test(n)).sort();
assert(pages.includes('index.html'),'Entry point index.html missing');
assert(pages.includes('about.html'),'About page for Russian-speaking Muslim learners missing');
const about=fs.readFileSync('about.html','utf8');
const appNavigation=fs.readFileSync('app.js','utf8');
const entry=fs.readFileSync('index.html','utf8');
for(const fragment of ['Для кого этот сайт','Как мы работаем с источниками','Важные ограничения','Независимая богословская экспертиза','не являются фетвами','из разных стран']){
 assert(about.includes(fragment),'About page must honestly explain '+fragment);
}
assert(appNavigation.includes('href="about.html"'),'Home or review navigation should link to About page');
assert(entry.includes('href="about.html"'),'No-JavaScript homepage should link to About page');

assert(pages.length>=22,'Unexpected decrease in static page inventory');
const paths=new Set();
function visit(dir=''){
 for(const ent of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
   const p=path.posix.join(dir,ent.name);
   if(ent.isDirectory())visit(p);
   else if(ent.isFile())paths.add(p);
 }
}
visit();
const issues=[], stats={pages:pages.length,localLinks:0,externalLinks:0,anchorLinks:0,images:0,buttons:0};
const htmls=new Map(pages.map(p=>[p,fs.readFileSync(p,'utf8')]));
const cleanHtml=new Map(pages.map(p=>[p,htmls.get(p)
 .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi,'$1$2')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')]));
const anchorMap=new Map(pages.map(p=>[p,new Set(
 [...cleanHtml.get(p).matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1])
)]));
function issue(location,msg){issues.push(location+': '+msg)}
function checkLocal(value,base,kind){
 if(!value||value==='#')return;
 if(/^(?:mailto:|tel:|sms:|data:|blob:)/i.test(value))return;
 if(/^(?:javascript:|vbscript:)/i.test(value)){issue(base,'dangerous URL '+value);return;}
 let url;
 try{url=new URL(value,'https://audit.invalid/'+base)}
 catch{issue(base,'malformed '+kind+' URL '+value);return}
 if(url.origin!=='https://audit.invalid'){stats.externalLinks++;return}
 let target=decodeURIComponent(url.pathname).replace(/^\//,'');
 if(!target||target.endsWith('/'))target+='index.html';
 target=path.posix.normalize(target);
 if(target.startsWith('../')){issue(base,'link escapes repository '+value);return}
 stats.localLinks++;
 if(!paths.has(target)){issue(base,'missing '+kind+' target '+value+' -> '+target);return}
 if(url.hash && target.endsWith('.html')){
   stats.anchorLinks++;
   const id=decodeURIComponent(url.hash.slice(1));
   if(!anchorMap.get(target)?.has(id))issue(base,'missing fragment '+value+' -> #'+id);
 }
}
for(const p of pages){
 const html=cleanHtml.get(p);
 if(!/<html\b[^>]*\blang=["']ru["']/i.test(html))issue(p,'missing lang=ru');
 if(!/<meta\s+charset=["']?utf-8/i.test(html))issue(p,'missing utf-8 meta');
 if(!/<meta\b[^>]*name=["']viewport["']/i.test(html))issue(p,'missing viewport meta');
 const title=html.match(/<title>([^<]*)<\/title>/i)?.[1]||'';
 if(!title.trim())issue(p,'missing title');
 const h1Count=(html.match(/<h1\b/gi)||[]).length;
 if(p==='index.html'){
   if(h1Count!==0)issue(p,'the loading shell should not duplicate the dynamically rendered h1');
 }else if(h1Count!==1)issue(p,'expected one static h1; got '+h1Count);
 if(!/<main\b/i.test(html))issue(p,'no main landmark');
 const allIds=[...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
 const seen=new Set();
 for(const id of allIds){if(seen.has(id))issue(p,'duplicate DOM id '+id);seen.add(id)}
 for(const tag of html.match(/<(?:a|img|link|script)\b[^>]*>/gi)||[]){
   const href=tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
   const src=tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
   if(href)checkLocal(href,p,'href');
   if(src)checkLocal(src,p,'src');
   if(/^<a\b/i.test(tag)&&/^https?:/i.test(href||'')){
     const target=tag.match(/\btarget=["']([^"']+)["']/i)?.[1];
     const rel=tag.match(/\brel=["']([^"']+)["']/i)?.[1]||'';
     if(target==='_blank'&&!/\bnoopener\b/.test(rel))issue(p,'external link without noopener: '+href);
     if(target==='_blank'&&!/\bnoreferrer\b/.test(rel))issue(p,'external link without noreferrer: '+href);
     if(/^http:/.test(href))issue(p,'insecure outbound http link: '+href);
   }
   if(/^<img\b/i.test(tag)){
     stats.images++;
     if(!/\balt\s*=/.test(tag))issue(p,'img lacks alt text or decorative alt');
   }
 }
 for(const tag of html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi)||[]){
   stats.buttons++;
   const text=tag.replace(/<[^>]+>/g,'').trim();
   if(!text&&!/\baria-label\s*=/.test(tag))issue(p,'unlabeled button');
 }
}
for(const css of ['style.css','pillars-common.css']){
 const s=fs.readFileSync(css,'utf8');
 for(const m of s.matchAll(/url\(\s*["']?([^"'\)]+)["']?\s*\)/gi)){
   const url=m[1].trim();
   if(url.startsWith('data:'))continue;
   checkLocal(url,css,'css url');
 }
}
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
assert.equal(manifest.lang,'ru');
for(const f of ['start_url','scope'])checkLocal(manifest[f],'manifest.webmanifest',f);
for(const icon of manifest.icons||[])checkLocal(icon.src,'manifest.webmanifest','manifest icon');
for(const asset of ['app.js','sw.js','style.css','data/content.json','data/caliph_history.json','icon.svg','manifest.webmanifest']){
 if(!paths.has(asset))issue('site','missing essential asset '+asset);
}
// Static Workers security rules are source-controlled and must not silently disappear.
const workerHeaders=fs.readFileSync('_headers','utf8');
assert(workerHeaders.includes('/*\n'),'Cloudflare header rules must cover site paths');
for(const required of [
 'X-Content-Type-Options: nosniff',
 'Referrer-Policy: no-referrer',
 'X-Frame-Options: DENY',
 "Content-Security-Policy: base-uri 'none'; object-src 'none'; frame-ancestors 'none'",
 'Strict-Transport-Security: max-age=31536000'
])assert(workerHeaders.includes(required),'Missing Workers security rule '+required);
assert(!/script-src\s+[^\n]*'none'/.test(workerHeaders),
 'Unexpected strict CSP: existing educational pages include inline JavaScript');
const app=fs.readFileSync('app.js','utf8');
for(const m of app.matchAll(/href=["']([^"'<>]+\.html(?:#[^"'<>]*)?)["']/g)){
 if(!m[1].includes('${'))checkLocal(m[1],'index.html','app template link');
}
// The checked-in SW explicitly contains RELEASE=null: no PWA claim is allowed.
const sw=fs.readFileSync('sw.js','utf8');
if(/^const RELEASE\s*=\s*null;\s*$/m.test(sw)){
 if(!app.includes("Онлайн-версия: офлайн-режим доступен только в подготовленной PWA-сборке."))
   issue('app.js','unprepared offline build must be disclosed');
 if(!app.includes("fetch('./sw.js',{cache:'no-store'})"))
   issue('app.js','must preflight the unprepared SW before attempting registration');
}
if(!fs.existsSync('tool/prepare_website.py')&&fs.readFileSync('README.txt','utf8').includes('python tool/prepare_website.py'))
 issue('README.txt','refers to nonexistent PWA release packager');
console.log(JSON.stringify({...stats,missingOrInvalid:issues.length,issues},null,2));
assert.deepEqual(issues,[],'Site-wide local page, asset, link and landmark integrity failed');
console.log('PASS site-wide static integrity; NOT CERTIFIED: external URLs, runtime behavior, PWA offline readiness or accessibility compliance');
