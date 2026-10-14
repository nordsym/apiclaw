import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { getFunctionName } from 'convex/server';
import { createCheckoutSession, handleStripeWebhook } from './stripeActions';
const originalEnv={...process.env};
Object.assign(process.env,{STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_WEBHOOK_SECRET:'whsec_synthetic',STRIPE_METER_VALUE_UNIT:'micro_usd',STRIPE_METER_EVENT_NAME_MICRO_USD:'usage_micro',STRIPE_METER_ID_MICRO_USD:'mtr_test',STRIPE_PRICE_ID_MICRO_USD:'price_test',APICLAW_BILLING_ENVIRONMENT:'test',APICLAW_BILLING_RETURN_ORIGIN:'https://preview.example.com'});
const stripe=new Stripe('sk_test_synthetic');
const patches:Array<()=>void>=[];
function mock(resource:any,method:string,fn:any){const p=Object.getPrototypeOf(resource),old=p[method];p[method]=fn;patches.push(()=>{p[method]=old});}
const price={id:'price_test',active:true,currency:'usd',billing_scheme:'per_unit',transform_quantity:null,unit_amount_decimal:'0.0001',recurring:{usage_type:'metered',meter:'mtr_test'},product:'prod_test'};
const subscription={id:'sub_test',customer:'cus_test',status:'active',items:{data:[{price}]}};
mock(stripe.prices,'retrieve',async()=>price);
mock(stripe.billing.meters,'retrieve',async()=>({id:'mtr_test',status:'active',event_name:'usage_micro',default_aggregation:{formula:'sum'},customer_mapping:{event_payload_key:'stripe_customer_id'},value_settings:{event_payload_key:'value'}}));
mock(stripe.subscriptions,'retrieve',async()=>subscription);
mock(stripe.customers,'retrieve',async()=>({id:'cus_test',invoice_settings:{default_payment_method:'pm_test'}}));
mock(stripe.paymentMethods,'retrieve',async()=>({id:'pm_test',customer:'cus_test',type:'card',card:{brand:'visa',last4:'4242'}}));
const sessions:any[]=[];
mock(stripe.checkout.sessions,'create',async(p:any)=>{sessions.push(p);return{id:'cs_test',url:'https://checkout.stripe.com/test'}});
const calls:Array<{name:string,args:any}>=[];
let workspace={_id:'workspace_test',tier:'free',stripeCustomerId:'cus_test'};
const ctx={runQuery:async()=>workspace,runMutation:async(f:any,args:any)=>{const name=getFunctionName(f);calls.push({name,args});if(name==='workspaces:verifySession')return{workspaceId:'workspace_test'};if(name==='stripeWebhookEvents:claim')return{claimed:true,attempt:1,processingStartedAt:1};return{success:true,applied:true,completed:true,claimed:true}}};
function req(body:any){return new Request('https://gateway.example/api/billing/checkout',{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}})}
async function webhook(payment_status:string,metadataId='workspace_test',type='checkout.session.completed'){
 const event={id:'evt_test_'+payment_status+metadataId+type,type,data:{object:{id:'cs_test',mode:'subscription',customer:'cus_test',subscription:'sub_test',payment_status,metadata:{workspaceId:metadataId}}}};
 const payload=JSON.stringify(event);const signature=stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_synthetic'});
 return (handleStripeWebhook as any)._handler(ctx,new Request('https://gateway.example/api/webhooks/stripe',{method:'POST',body:payload,headers:{'stripe-signature':signature}}));
}
try{
 const checkout=await(createCheckoutSession as any)._handler(ctx,req({token:'owner',returnUrl:'https://preview.example.com/workspace'}));assert.equal(checkout.status,200);assert.equal(sessions[0].mode,'subscription');assert.deepEqual(sessions[0].line_items,[{price:'price_test'}]);assert.equal(sessions[0].payment_method_types,undefined);assert.match(sessions[0].success_url,/preview.example.com/);
 assert.equal((await(createCheckoutSession as any)._handler(ctx,req({}))).status,401);
 assert.equal((await(createCheckoutSession as any)._handler({...ctx,runMutation:async()=>null},req({token:'expired'}))).status,401);
 process.env.STRIPE_SECRET_KEY='sk_live_synthetic';assert.equal((await(createCheckoutSession as any)._handler(ctx,req({token:'owner'}))).status,503);process.env.STRIPE_SECRET_KEY='sk_test_synthetic';
 calls.length=0;assert.equal((await webhook('unpaid')).status,200);assert.equal(calls.some(c=>c.name==='billing:updateSubscription'||c.name==='billing:completePaygActivation'),false);
 calls.length=0;assert.equal((await webhook('paid')).status,200);assert.equal(calls.find(c=>c.name==='billing:completePaygActivation')?.args.stripeSubscriptionStatus,'active');assert.equal(calls.find(c=>c.name==='billing:updatePaymentMethodInfo')?.args.hasPaymentMethod,true);
 calls.length=0;assert.equal((await webhook('paid','workspace_test','checkout.session.async_payment_succeeded')).status,200);assert.equal(calls.some(c=>c.name==='billing:completePaygActivation'),true);
 calls.length=0;assert.equal((await webhook('paid','another_workspace')).status,500);assert.equal(calls.some(c=>c.name==='billing:updateSubscription'||c.name==='billing:completePaygActivation'),false);
 assert.equal((await(handleStripeWebhook as any)._handler(ctx,new Request('https://gateway.example/api/webhooks/stripe',{method:'POST',body:'{}'}))).status,400);
 console.log('Customer subscription Checkout, mode isolation, authentication and signed webhook activation passed');
}finally{patches.reverse().forEach(f=>f());for(const k of Object.keys(process.env)){if(!(k in originalEnv))delete process.env[k]}Object.assign(process.env,originalEnv);}
