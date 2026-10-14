import assert from 'node:assert/strict';
import { authorizeManagedCall, finalizeManagedCall } from './managedUsage';
const workspaceId='workspace_test';
let workspace:any={_id:workspaceId,tier:'free',status:'active',usageCount:0,managedUsageCount:0};
const ledger=new Map<string,any>();
const ctx:any={db:{get:async(id:string)=>id===workspaceId?workspace:ledger.get(id),query:()=>({withIndex:()=>({unique:async()=>null})}),patch:async(id:string,p:any)=>{if(id===workspaceId)Object.assign(workspace,p);else Object.assign(ledger.get(id),p)},insert:async(table:string,row:any)=>{const id='ledger_'+ledger.size;ledger.set(id,{_id:id,...row});return id}}};
const args={workspaceId,requestId:'request_1',requestFingerprint:'fingerprint',provider:'openrouter',action:'chat',model:'openai/gpt-5.4-nano',path:'/v1/execute',estimatedProviderCostUsd:0.01,billingGradeCost:true};
const run=(x:any)=>(authorizeManagedCall as any)._handler(ctx,x);
assert.equal((await run(args)).reason,'payment_required');assert.equal(ledger.size,0);
workspace.hasPaymentMethod=true;assert.equal((await run(args)).reason,'payment_required');assert.equal(ledger.size,0,'a saved card cannot authorize billing without subscription reconciliation');
Object.assign(workspace,{tier:'usage_based',billingPlan:'usage_based',stripeCustomerId:'cus_test',stripeSubscriptionId:'sub_test',stripeSubscriptionStatus:'active',paygMeterReadyAt:1,paygMeterPriceId:'price_test',paygMeterId:'mtr_test',paygMeterEventName:'micro_test'});
const paid=await run(args);assert.equal(paid.allowed,true);assert.equal(ledger.get(paid.ledgerId).stripeCustomerIdSnapshot,'cus_test');assert.equal(ledger.get(paid.ledgerId).billingClass,'payg');
const before=ledger.size;
for(const provider of ['brave_search','apilayer','cohere','e2b','elevenlabs','openai']){
 assert.equal((await run({...args,requestId:'rejected_'+provider,provider})).allowed,false);
}
assert.equal((await run({...args,model:'anthropic/claude-sonnet-4-6',requestId:'wrong_model'})).reason,'managed_billing_unavailable');assert.equal(ledger.size,before,'unapproved paid providers and models cannot create billable usage');
workspace={_id:workspaceId,tier:'free',status:'active',usageCount:0};
const free=await run({...args,provider:'nasa',action:'apod',model:undefined,estimatedProviderCostUsd:0,requestId:'first_free'});assert.equal(free.allowed,true);assert.equal(ledger.get(free.ledgerId).billingClass,'activation');assert.equal(ledger.get(free.ledgerId).stripeCustomerIdSnapshot,undefined);
console.log('New workspace free call, payment-required upgrade, card-only denial, active billing snapshots and commercial provider guards passed');
