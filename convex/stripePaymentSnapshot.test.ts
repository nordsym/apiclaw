import assert from 'node:assert/strict';
import {readCustomerPaymentMethod} from './stripePaymentSnapshot';
async function main() {
 let preferred:string|null='pm_new';
 let methods:any[]=[{id:'pm_link',type:'link',customer:'cus_test'}];
 let owner='cus_test';
 const stripe={customers:{retrieve:async()=>({invoice_settings:{default_payment_method:preferred}})},paymentMethods:{retrieve:async(id:string)=>({id,customer:owner,type:'card',card:{brand:'visa',last4:'4242'}}),list:async()=>({data:methods})}};
 assert.equal((await readCustomerPaymentMethod(stripe,'cus_test')).id,'pm_new');
 preferred='pm_changed';assert.equal((await readCustomerPaymentMethod(stripe,'cus_test')).id,'pm_changed');
 preferred=null;assert.equal((await readCustomerPaymentMethod(stripe,'cus_test')).type,'link');
 methods=[];assert.equal(await readCustomerPaymentMethod(stripe,'cus_test'),null);
 preferred='pm_wrong';owner='cus_other';await assert.rejects(readCustomerPaymentMethod(stripe,'cus_test'),/mismatch/);
 console.log('Stripe payment snapshot: current default changes, Link fallback, removal and owner boundary passed');
}
void main();
