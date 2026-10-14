import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {NextRequest}=require('../landing/node_modules/next/server');
const {POST}=require('../landing/src/app/api/billing/checkout/route.ts');
const old={...process.env},fetchOriginal=globalThis.fetch;
let sent:any;
try{
 process.env.NEXT_PUBLIC_CONVEX_SITE_URL='https://preview.convex.site';process.env.NEXT_PUBLIC_APP_URL='https://apiclaw.cloud';process.env.VERCEL_ENV='preview';process.env.VERCEL_URL='isolated-preview.vercel.app';
 globalThis.fetch=async(url:any,opts:any)=>{assert.equal(url,'https://preview.convex.site/api/billing/checkout');sent=JSON.parse(opts.body);return Response.json({checkoutUrl:'https://checkout.stripe.com/test',sessionId:'cs_test'})};
 const req=(body:any)=>new NextRequest('https://isolated-preview.vercel.app/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const result=await POST(req({token:'owner',workspaceId:'foreign_workspace',mode:'setup'}));assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');assert.deepEqual(sent,{token:'owner',returnUrl:'https://isolated-preview.vercel.app'});
 process.env.VERCEL_ENV='production';await POST(req({token:'owner'}));assert.equal(sent.returnUrl,'https://apiclaw.cloud');
 assert.equal((await POST(req({}))).status,400);
 globalThis.fetch=async()=>Response.json({error:'Invalid session'}, {status:401});assert.equal((await POST(req({token:'expired'}))).status,401);
 console.log('Landing Checkout keeps preview returns isolated, ignores forged workspace/mode and preserves authentication errors');
}finally{globalThis.fetch=fetchOriginal;for(const k of Object.keys(process.env))if(!(k in old))delete process.env[k];Object.assign(process.env,old);}
