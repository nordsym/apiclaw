#!/usr/bin/env node
/** Compile the measured callable snapshot into runtime, catalog and documentation. */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const report=JSON.parse(readFileSync(resolve(root,'docs/ops/callable-audit.json'),'utf8'));
if (!process.argv.includes('--preview-candidates') && report.results.some(row => row.verified && row.gatewayVerification?.success !== true)) {
  throw new Error('Publishing callable APIs requires successful customer gateway proof for every entry; --preview-candidates is only for isolated verification.');
}
const selected=report.results.filter(r=>r.verified).map(({id,canonicalId,name,baseUrl,origin,smokePath,docsUrl,responseKind,acceptEncoding,allowedPaths,redirectOrigins})=>({id:canonicalId??id,name,baseUrl,origin,smokePath,...(docsUrl?{docsUrl}:{}),...(responseKind?{responseKind}:{}),...(acceptEncoding?{acceptEncoding}:{}),...(allowedPaths?{allowedPaths}:{}),...(redirectOrigins?.length?{redirectOrigins}:{})}));
if (new Set(selected.map(row=>row.id)).size !== selected.length) throw new Error('Duplicate canonical runtime IDs in audit');
if (new Set(selected.map(row=>row.id.toLowerCase().replace(/[^a-z0-9]+/g,''))).size !== selected.length) throw new Error('Ambiguous normalized runtime IDs in audit');
if (new Set(selected.map(row=>row.name.toLowerCase().trim())).size !== selected.length) throw new Error('Duplicate callable catalog names in audit');
if (selected.some(row=>!row.baseUrl?.startsWith('https://')||!row.origin?.startsWith('https://'))) throw new Error('Callable snapshot contains a non-HTTPS endpoint');
for (const api of selected) {
  if (api.allowedPaths === undefined) continue;
  const target = new URL('./' + (api.smokePath ?? '/').slice(1), api.baseUrl.replace(/\/?$/, '/'));
  if (!Array.isArray(api.allowedPaths) || !api.allowedPaths.length ||
      api.allowedPaths.some(path => typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#') || new URL(path, api.origin).pathname !== path) ||
      !api.allowedPaths.includes(target.pathname)) throw new Error(`Invalid reviewed metadata paths: ${api.id}`);
}
const compact=JSON.stringify(selected);
writeFileSync(resolve(root,'src/workspace-public-apis.json'),compact+'\n');
writeFileSync(resolve(root,'src/workspace-public-apis.data.ts'),`/** Generated from docs/ops/callable-audit.json by scripts/refresh-callable.mjs. */\nexport const WORKSPACE_PUBLIC_APIS_JSON = ${JSON.stringify(compact)};\n`);
const oldSource=readFileSync(resolve(root,'src/canon-stats.ts'),'utf8');
const priorOpen=Number(oldSource.match(/workspace_public_executable:\s*([\d_]+)/)[1].replaceAll('_',''));
const priorTotal=Number(oldSource.match(/customer_executable_catalog_cards:\s*([\d_]+)/)[1].replaceAll('_',''));
const managedCount=Number(oldSource.match(/customer_executable_providers:\s*([\d_]+)/)[1].replaceAll('_',''));
const total=selected.length+managedCount;
writeFileSync(resolve(root,'src/canon-stats.ts'),oldSource.replace(/generated_at: '[^']+'/,`generated_at: '${report.checkedAt.slice(0,10)}'`).replace(/workspace_public_executable:\s*[\d_]+/,`workspace_public_executable: ${selected.length}`).replace(/customer_executable_catalog_cards:\s*[\d_]+/,`customer_executable_catalog_cards: ${total}`));
for(const p of ['README.md','apiclaw-README.md','landing/README.md','landing/public/SKILL.md','landing/public/llms.txt','landing/public/llms-full.txt','landing/public/agents.md','package.json']){
let s;try{s=readFileSync(resolve(root,p),'utf8')}catch{continue}
const fmt=n=>n.toLocaleString('en-US');
s=s.replaceAll(fmt(priorOpen)+' workspace-authenticated',fmt(selected.length)+' workspace-authenticated').replaceAll('origins: '+fmt(priorOpen),'origins: '+fmt(selected.length)).replaceAll(fmt(priorTotal)+' callable',fmt(total)+' callable').replaceAll(fmt(priorTotal)+' total callable',fmt(total)+' total callable').replace(/Live catalog \([\d-]+\)/,`Live catalog (${report.checkedAt.slice(0,10)})`).replaceAll('19 of the 22 built-in providers are customer-executable now','3 of the 22 built-in providers are customer-executable now');
writeFileSync(resolve(root,p),s);
}
execFileSync(process.execPath,['landing/scripts/sync-runtime-modules.mjs'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['landing/scripts/generate-stats.js'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['landing/scripts/sync-canon-to-stats.mjs'],{cwd:root,stdio:'inherit'});
console.log(`Compiled ${selected.length} measured free APIs and ${managedCount} managed providers`);
