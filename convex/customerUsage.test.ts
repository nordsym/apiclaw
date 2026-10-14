import assert from 'node:assert/strict';
import { authorizeManagedCall, finalizeManagedCall } from './managedUsage';
import { attachCost } from './logs';
const originalEnv={...process.env};
Object.assign(process.env,{STRIPE_SECRET_KEY:'sk_test_synthetic',APICLAW_BILLING_ENVIRONMENT:'test',STRIPE_METER_VALUE_UNIT:'micro_usd',STRIPE_METER_EVENT_NAME_MICRO_USD:'micro_test',STRIPE_METER_ID_MICRO_USD:'mtr_test',STRIPE_PRICE_ID_MICRO_USD:'price_test'});
const workspaceId='workspace_test';
let workspace:any={_id:workspaceId,tier:'free',status:'active',usageCount:0,managedUsageCount:0};
const ledger=new Map<string,any>();
const ctx:any={db:{get:async(id:string)=>id===workspaceId?workspace:ledger.get(id),query:()=>({withIndex:()=>({unique:async()=>null})}),patch:async(id:string,p:any)=>{if(id===workspaceId)Object.assign(workspace,p);else Object.assign(ledger.get(id),p)},insert:async(table:string,row:any)=>{const id='ledger_'+ledger.size;ledger.set(id,{_id:id,...row});return id}}};
const args={workspaceId,requestId:'request_1',requestFingerprint:'fingerprint',provider:'openrouter',action:'chat',model:'openai/gpt-5.4-nano',path:'/v1/execute',estimatedProviderCostUsd:0.01,billingGradeCost:true};
const run=(x:any)=>(authorizeManagedCall as any)._handler(ctx,x);
const trial=await run({...args,requestId:'trial_1'});assert.equal(trial.allowed,true);assert.equal(ledger.get(trial.ledgerId).billingClass,'activation');workspace.activationManagedCallCount=25;const afterTrial=ledger.size;assert.equal((await run(args)).reason,'payment_required');assert.equal(ledger.size,afterTrial);
workspace.hasPaymentMethod=true;assert.equal((await run(args)).reason,'payment_required');assert.equal(ledger.size,afterTrial,'a saved card cannot authorize billing without subscription reconciliation');
Object.assign(workspace,{tier:'usage_based',billingPlan:'usage_based',stripeCustomerId:'cus_test',stripeSubscriptionId:'sub_test',stripeSubscriptionStatus:'active',paygMeterReadyAt:1,paygMeterPriceId:'price_test',paygMeterId:'mtr_test',paygMeterEventName:'micro_test'});
const paid=await run(args);assert.equal(paid.allowed,true);assert.equal(ledger.get(paid.ledgerId).stripeCustomerIdSnapshot,'cus_test');assert.equal(ledger.get(paid.ledgerId).billingClass,'payg');
const before=ledger.size;
for(const provider of ['brave_search','apilayer','cohere','e2b','elevenlabs','openai']){
 assert.equal((await run({...args,requestId:'rejected_'+provider,provider})).allowed,false);
}
assert.equal((await run({...args,model:'anthropic/claude-sonnet-4-6',requestId:'wrong_model'})).reason,'managed_billing_unavailable');assert.equal(ledger.size,before,'unapproved paid providers and models cannot create billable usage');
workspace={_id:workspaceId,tier:'free',status:'active',usageCount:0};
const free=await run({...args,provider:'nasa',action:'apod',model:undefined,estimatedProviderCostUsd:0,requestId:'first_free'});assert.equal(free.allowed,true);assert.equal(ledger.get(free.ledgerId).billingClass,'activation');assert.equal(ledger.get(free.ledgerId).stripeCustomerIdSnapshot,undefined);
let log:any={_id:'log_test',workspaceId,requestId:args.requestId,status:'success'};
const patched:any[]=[];
const logCtx:any={db:{query:()=>({withIndex:()=>({first:async()=>log})}),patch:async(id:string,p:any)=>{patched.push({id,p});Object.assign(log,p)}}};
await (attachCost as any)._handler(logCtx,{requestId:args.requestId,workspaceId,costCents:0,status:'error',latencyMs:12});
assert.equal(log.status,'error');assert.equal(log.costCents,0);assert.equal(log.latencyMs,12);
log={_id:'foreign_log',workspaceId:'another_workspace',status:'success'};
assert.equal((await (attachCost as any)._handler(logCtx,{requestId:args.requestId,workspaceId,costCents:0,status:'error'})).patched,false);
assert.equal(log.status,'success','analytics updates cannot cross the workspace boundary');
console.log('New workspace free call, payment-required upgrade, card-only denial, active billing snapshots and commercial provider guards passed');

for(const k of Object.keys(process.env)){if(!(k in originalEnv))delete process.env[k]}Object.assign(process.env,originalEnv);
