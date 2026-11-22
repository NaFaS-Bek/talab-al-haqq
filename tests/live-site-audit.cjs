'use strict';
// Manual LIVE verification, deliberately separate from local smoke/performance.
// Requires explicit HTTPS URL: TALAB_SITE_URL=https://public.example/ node tests/live-site-audit.cjs
// Not a vulnerability scanner, content certification, or third-party link crawler.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const net=require('node:net');
const {createHash}=require('node:crypto');
const {performance}=require('node:perf_hooks');
const cryptoHash=b=>createHash('sha256').update(b).digest('hex');

if(process.argv.includes('--help')){
 console.log('Usage: TALAB_SITE_URL=https://public-site.example/ node tests/live-site-audit.cjs');
 process.exit(0);
}
const provided=(process.env.TALAB_SITE_URL||'').trim();
if(!provided)throw Error('Public site URL has not been configured. No live deployment can be verified.');
let base;
try{base=new URL(provided)}catch{throw Error('Invalid public site URL')}
if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||
 base.port||!base.pathname.endsWith('/')){
 throw Error('URL must be public HTTPS, without credentials/query/hash, and end with /');
}
const host=base.hostname.replace(/^\[|\]$/g,'').toLowerCase();
if(net.isIP(host)||host==='localhost'||host.endsWith('.localhost')||
 host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.test')||
 host.endsWith('.invalid')||host.endsWith('.example')||!host.includes('.'))
 throw Error('Use a public DNS hostname, not IP, localhost, or internal test domain');
async function pull(path){
 const target=new URL(path,base);
 const started=performance.now();
 let u=target;
 for(let hop=0;hop<4;hop++){
  const res=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(30000),
   headers:{'User-Agent':'TalabAlHaqq-Manual-ReleaseAudit/1.0','Accept':'*/*'}});
  if(res.status>=300&&res.status<400&&res.headers.get('location')){
   const next=new URL(res.headers.get('location'),u);
   assert.equal(next.origin,base.origin,'Cross-origin redirect refused for '+path);
   u=next;await res.arrayBuffer();continue;
  }
  const bytes=Buffer.from(await res.arrayBuffer());
  return {
   path,status:res.status,finalUrl:u.href,elapsedMs:Math.round(performance.now()-started),
   bytes,contentType:res.headers.get('content-type')||'',
   contentEncoding:res.headers.get('content-encoding')||'',
   headers:{
    csp:res.headers.get('content-security-policy')||'',
    hsts:res.headers.get('strict-transport-security')||'',
    xContentTypeOptions:res.headers.get('x-content-type-options')||'',
    referrerPolicy:res.headers.get('referrer-policy')||''
   }
  };
 }
 throw Error('More than three redirects for '+path);
}
(async()=>{
 const paths=['','family-rights.html','family-difficult-passages.html',
  'five-pillars.html','arabic-reading-signs.html','app.js','style.css',
  'data/content.json','manifest.webmanifest','sw.js'];
 const fetched=await Promise.all(paths.map(async p=>{
  try{return await pull(p)}catch(e){return {path:p,error:String(e)}}
 }));
 const issues=[],warnings=[];
 const output=[];
 for(const r of fetched){
  if(r.error){issues.push(r.path+': '+r.error);output.push({path:r.path,error:r.error});continue}
  if(r.status!==200)issues.push(r.path+': HTTP '+r.status);
  const item={path:r.path,status:r.status,elapsedMs:r.elapsedMs,
   uncompressedBytes:r.bytes.length,contentType:r.contentType,
   contentEncoding:r.contentEncoding};
  if(r.status===200){
   if(r.path===''||r.path.endsWith('.html')){
    const html=r.bytes.toString('utf8');
    if(!/<title>[^<]*(Талаб аль-Хакк|Talab)/.test(html))
     issues.push(r.path+': expected Talab al-Haqq HTML title missing');
   }
   if(['app.js','style.css','data/content.json','sw.js'].includes(r.path)){
    const local=fs.readFileSync(r.path);
    const matches=cryptoHash(r.bytes)===cryptoHash(local);
    item.matchesCheckedOutCommit=matches;
    item.liveSha256=cryptoHash(r.bytes);
    item.localSha256=cryptoHash(local);
    if(!matches)issues.push(r.path+': deployed bytes differ from checked-out main');
   }
   if(r.path==='data/content.json'){
    try{const json=JSON.parse(r.bytes.toString('utf8'));
     if(!json.catalog?.entries)issues.push('Live JSON lacks catalog.entries');
    }catch{issues.push('Live catalog JSON is invalid')}
   }
   if(r.path==='sw.js'&&/^const RELEASE\s*=\s*null;\s*$/m.test(r.bytes.toString('utf8')))
    warnings.push('Production sw.js is an unprepared source worker: offline readiness NOT confirmed');
   if(r.path===''){
    const h=r.headers;
    const expectedHeaders=fs.existsSync('_headers');
    const observed=[
      ['HSTS',h.hsts],
      ['CSP',h.csp],
      ['X-Content-Type-Options: nosniff',
        h.xContentTypeOptions.toLowerCase()==='nosniff'?'nosniff':''],
      ['Referrer-Policy',h.referrerPolicy]
    ];
    for(const [name,value] of observed)if(!value){
      const message=name+' missing on homepage';
      (expectedHeaders?issues:warnings).push(message+
       (expectedHeaders?' after _headers was committed':' (no _headers baseline)'));
    }
   }
  }
  output.push(item);
 }
 const report={
  checkedAtUtc:new Date().toISOString(),publicBaseUrl:base.href,
  comparedWith:'current checked-out repository commit (run only from main for production)',
  productionReachable:!fetched.some(r=>r.error||r.status!==200),
  exactSourceAssetsMatch:['app.js','style.css','data/content.json','sw.js']
    .every(path=>output.some(r=>r.path===path&&r.status===200&&r.matchesCheckedOutCommit===true)),
  issues,warnings,requests:output
 };
 fs.writeFileSync('live-site-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(issues.length)process.exitCode=1;
 else console.log('PASS: specified live site accessible with matching checked-out static source assets');
 console.log('NOT CERTIFIED: source review, full external links, Core Web Vitals field data or service-worker offline lifecycle');
})().catch(e=>{console.error(e);process.exitCode=1});
