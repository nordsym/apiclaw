import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const api={id:'fixture',canonicalId:'fixture',name:'Fixture',verified:true,baseUrl:'https://fixture.org',origin:'https://fixture.org',smokePath:'/metadata'};
function compileFixture(results,expectedError){
 const root=mkdtempSync(join(tmpdir(),'apiclaw-compile-'));
 try{
  mkdirSync(join(root,'scripts'));mkdirSync(join(root,'docs/ops'),{recursive:true});mkdirSync(join(root,'src'));
  copyFileSync(resolve('scripts/refresh-callable.mjs'),join(root,'scripts/refresh-callable.mjs'));
  writeFileSync(join(root,'docs/ops/callable-audit.json'),JSON.stringify({checkedAt:'2026-10-16T00:00:00Z',results}));
  const r=spawnSync(process.execPath,[join(root,'scripts/refresh-callable.mjs')],{encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,expectedError);
  assert.equal(existsSync(join(root,'src/workspace-public-apis.json')),false,'invalid proof or scope must fail before writing the runtime manifest');
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('upstream-only and failed customer evidence cannot publish a callable manifest',()=>{
 compileFixture([api],/customer gateway proof/);
 compileFixture([{...api,gatewayVerification:{success:false}}],/customer gateway proof/);
});
test('normalized ID aliases and unreviewed default paths fail before publication',()=>{
 const verified={...api,gatewayVerification:{success:true}};
 compileFixture([{...verified,id:'foo-bar',canonicalId:'foo-bar'},{...verified,id:'foobar',canonicalId:'foobar',name:'Other'}],/normalized runtime IDs/);
 compileFixture([{...verified,allowedPaths:['/different']}],/Invalid reviewed metadata paths/);
 compileFixture([{...verified,allowedPaths:[]}],/Invalid reviewed metadata paths/);
});
