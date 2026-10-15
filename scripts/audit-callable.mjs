#!/usr/bin/env node
/** Keyless read-only sweep. No credentials, redirects, paid requests or writes upstream. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const read = p => JSON.parse(readFileSync(resolve(root,p),'utf8'));
const candidates = read('src/workspace-public-api-candidates.json');
const registry = read('src/registry/apis.json').apis;
const generated = existsSync(resolve(root,'src/registry/generated-providers.json')) ? read('src/registry/generated-providers.json').providers : [];
const previous = existsSync(resolve(root,'docs/ops/callable-audit.json')) ? read('docs/ops/callable-audit.json').results : [];
const byName = new Map(registry.map(a => [a.name.toLowerCase(),a]));
const paths = {anapioficeandfire:'/api/books/1',colorapi:'/id?hex=0047AB',jsonplaceholder:'/todos/1',homebrew:'/formula/git.json',mlbdataapi:'/api/v1/sports',officialjokeapi:'/random_joke',countryis:'/json',terraformregistry:'/v1/providers?limit=1',lobstersapi:'/newest.json',yr:'/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75',frankfurter:'/latest',frankfurterapi:'/latest',adviceslipapi:'/advice',catfactsapi:'/fact',studioghibliapi:'/films',dogceo:'/api/breeds/image/random',dogapi:'/api/breeds/image/random',agify:'/','agifyio':'/',genderize:'/',nationalize:'/',ipify:'/?format=json',ipapi:'/?format=json',openbrewerydb:'/v1/breweries?per_page=1',restcountries:'/v3.1/all?fields=name',pokeapi:'/api/v2/pokemon/1',pokmon:'/api/v2/pokemon/1',universitieslist:'/search?country=Sweden',numbersapi:'/random/trivia?json',randomuser:'/api/',randomusergenerator:'/api/',bored:'/api/activity',boredapi:'/api/activity',kroki:'/health',chucknorris:'/jokes/random',chucknorrisjokes:'/jokes/random',exchangerateapi:'/v6/latest/USD'};
function probePath(api) {
 if(paths[api.id]) return paths[api.id];
 const prior = previous.find(r=>r.id===api.id); if(prior?.smokePath) return prior.smokePath;
 const provider = generated.find(p => p.name?.toLowerCase() === api.name.toLowerCase() && p.baseUrl?.replace(/\/$/,'') === api.baseUrl.replace(/\/$/,''));
 const action = provider && Object.values(provider.actions).find(a => a.method==='GET' && !a.requiresAuth && !a.pathTemplate.includes('{') && !(a.params||[]).some(p=>p.required));
 return action?.pathTemplate || '/';
}
const results = new Array(candidates.length);
const only = process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const locks = new Map(); let next=0;
async function probe(api) {
 const row=byName.get(api.name.toLowerCase());
 const smokePath=probePath(api);
 const base=api.baseUrl.endsWith('/')?api.baseUrl:api.baseUrl+'/';
 const url=new URL(smokePath.slice(1),base);
 if(url.origin!==api.origin || url.protocol!=='https:' || url.username || url.password || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)|\.(local|internal)$/.test(url.hostname)) throw Error('Unpinned probe');
 const start=Date.now(); let status=0, outcome='network_error';
 try {
 const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{Accept:'application/json','User-Agent':'APIClaw-Callable-Audit/1.0 (+https://apiclaw.cloud)'}});
 status=res.status;
 const reader=res.body?.getReader(); let text='', bytes=0;
 while(reader) { const {done,value}=await reader.read(); if(done)break;bytes+=value.length;if(bytes>262144){await reader.cancel();break;}text+=new TextDecoder().decode(value); }
 if(!res.ok) outcome=status===429?'rate_limited':status===401||status===403?'auth_required':'http_error';
 else { try { const data=JSON.parse(text); outcome=data && typeof data==='object' && !data.error && data.success!==false ? 'ok_json':'invalid_response'; } catch {outcome='not_json';} }
 } catch(e){outcome=e.name==='TimeoutError'?'timeout':'network_error';}
 const knownFree=String(row?.pricing).toLowerCase()==='free';
 return {...api,checkedAt:new Date().toISOString(),smokePath,pricing:row?.pricing??'unknown',status,outcome,latencyMs:Date.now()-start,verified:outcome==='ok_json'&&knownFree};
}
async function worker(){while(next<candidates.length){const index=next++;const api=candidates[index];if(only&&!only.includes(api.id)){results[index]=previous.find(r=>r.id===api.id);if(!results[index])throw Error('Missing previous result');continue;}const prior=locks.get(api.origin)||Promise.resolve();let release; const lock=new Promise(r=>release=r);locks.set(api.origin,lock);await prior;try {results[index]=await probe(api);}finally{await new Promise(r=>setTimeout(r,150));release();}if((index+1)%100===0)console.log(`Checked ${index+1}/${candidates.length}`);}}
await Promise.all(Array.from({length:8},worker));
for(const row of results) if(row.id==='frankfurterapi'){row.verified=false;row.outcome='duplicate_frankfurter';}
const report={checkedAt:new Date().toISOString(),policy:'HTTPS GET; origin pinned; no auth; no redirects; valid JSON; explicit free pricing required',candidateCount:results.length,verifiedCount:results.filter(r=>r.verified).length,results};
mkdirSync(resolve(root,'docs/ops'),{recursive:true});
writeFileSync(resolve(root,'docs/ops/callable-audit.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(root,'docs/ops/callable-audit.md'),`# Callable API audit\n\nChecked: ${report.checkedAt}.\n\n${report.verifiedCount} of ${report.candidateCount} public candidates passed. Managed providers are reported separately. A website returning HTML is not a successful API call. Unknown pricing, authentication errors and unverified responses remain discovery only. This sweep makes no requests using provider credentials.\n\nPolicy: ${report.policy}. Eight concurrent requests maximum, serialized per origin with a 150 ms delay, eight-second timeout, bounded response reads.\n\nRe-run: \`node scripts/audit-callable.mjs\`. Each row records the exact tested path. Results reflect this runner and time; preview gateway calls are verified separately in the PR.\n\n| API | Probe | HTTP | Result | Pricing | Latency ms | Callable |\n|---|---|---:|---|---|---:|---|\n`+results.map(r=>`| ${r.name.replaceAll('|','/')} | [GET](${new URL(r.smokePath.slice(1),r.baseUrl.replace(/\/?$/,'/'))}) | ${r.status} | ${r.outcome} | ${r.pricing} | ${r.latencyMs} | ${r.verified?'yes':'discovery'} |`).join('\n')+'\n');
console.log(JSON.stringify({checked:report.candidateCount,verified:report.verifiedCount}));
