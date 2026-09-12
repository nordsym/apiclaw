import React from 'react';
import {createRoot, Root} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import ChainsPage from '../../src/app/workspace/chains/page';
import WorkspacePage from '../../src/app/workspace/page';
import {AgentCardGrid} from '../../src/app/workspace/views/AgentCards';
import {BillingTab} from '../../src/app/workspace/views/Billing';
import {SettingsTab} from '../../src/app/workspace/views/Settings';
import {ActivityTab} from '../../src/app/workspace/views/Activity';
import {ProviderConsoleTab} from '../../src/app/workspace/views/Provider';
import {OnboardingWizard} from '../../src/components/OnboardingWizard';
import {invalidateWorkspace} from '../../src/lib/workspace-data';
import {recoverWorkspaceSessionToken} from '../../src/lib/workspace-session';
import {navigate} from './navigation';
import * as fx from '../../src/app/dev-ws/fixtures';

const filter = new URLSearchParams(location.search).get('case');
let totalRequests = 0;
const fixture = document.getElementById('fixture')!;
const output = document.getElementById('results')!;
const results: string[] = [];
let root:Root|null = null;
let serial=0;
let account={...fx.workspace,tier:'founder',workspaceName:'Matrix company',usageCount:25};
let overrides: Record<string,()=>unknown|Promise<unknown>> = {};
let issued='';
const response=(value:unknown)=>new Response(JSON.stringify({status:'success',value}));
window.fetch=async (input,init)=>{
 if (++totalRequests > 500) throw new Error("Fixture request loop detected");
 const url=String(input);
 if(url==='/api/workspace-auth/session') {issued=`synthetic_browser_${++serial}_abcdefghijklmnopqrstuvwxyz`;return new Response(JSON.stringify({browserToken:issued,browserExpiresAt:Date.now()+900000}));}
 if(url.endsWith('/api/query')||url.endsWith('/api/mutation')) {
  const {path,args}=JSON.parse(String(init?.body));
  try {
   if(overrides[path]) return response(await overrides[path]());
   if(path==='workspaces:getWorkspaceDashboard') return response({workspace:account});
   if(path==='providers:getWorkspaceProviderConsole') return response({provider:{id:'provider_matrix',name:'Matrix provider'},apis:[]});
   if(path==='workspaces:getUsageBreakdown') return response({});
   if(path==='onboarding:getState') return response({completedAt:1,firstCallAt:1,dismissedAt:null});
   const item=(fx.convex as Record<string,unknown>)[path];
   if(item===undefined) throw new Error(`Unmocked path ${path}`);
   return response(typeof item==='function'?item(args):item);
  } catch(error) { return new Response(JSON.stringify({status:'error',errorMessage:String(error)})); }
 }
 if(url==='/api/models') return new Response(JSON.stringify({models:[]}));
 throw new Error(`Network blocked in matrix: ${url}`);
};
const text=()=>fixture.textContent||'';
const assert=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
const settle=async()=>{await act(async()=>{await new Promise(r=>setTimeout(r,35));});};
async function wait(check:()=>boolean) {for(let i=0;i<100;i++){await settle();if(check())return;}throw new Error('Timed out: '+text().slice(0,350));}
async function mount(node:React.ReactNode){if(root)await act(async()=>root!.unmount());fixture.innerHTML='';root=createRoot(fixture);await act(async()=>root!.render(node));await settle();}
async function input(element:HTMLInputElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));});}
async function click(label:string){const button=Array.from(fixture.querySelectorAll('button')).find(b=>b.textContent?.trim()===label);assert(button,'Missing button '+label);await act(async()=>button!.click());await settle();}
async function test(name:string,run:()=>Promise<void>){if(filter && !name.includes(filter))return;output.textContent=results.join("\n")+"\nRUNNING "+name;overrides={};try{await run();results.push('PASS '+name);}catch(e){results.push('FAIL '+name+': '+String(e));}output.textContent=results.join('\n');}
async function main(){
await test('Bootstrap read failure never fabricates Free or zero plan',async()=>{overrides['workspaces:getWorkspaceDashboard']=()=>{throw Error('Unavailable');};navigate('/?tab=billing');await mount(<WorkspacePage/>);await wait(()=>text().includes('Something went wrong'));assert(!text().includes('Current plan'),'unverified plan visible');});
await test('Reload/remount reads verified Founder account',async()=>{navigate('/?tab=billing');await mount(<WorkspacePage/>);await wait(()=>text().includes('Founder'));assert(text().includes('Matrix company'),'identity missing');});
await test('Healthy-token focus refreshes shared account',async()=>{account={...account,workspaceName:'Updated by other tab'};await act(async()=>window.dispatchEvent(new Event('focus')));await wait(()=>text().includes('Updated by other tab'));});
await test('External return pageshow refreshes account',async()=>{account={...account,usageCount:73};await act(async()=>window.dispatchEvent(new Event('pageshow')));await wait(()=>text().includes('73'));});
await test('Session renewal refetches parent account',async()=>{account={...account,workspaceName:'Renewed identity'};await act(async()=>{await recoverWorkspaceSessionToken(issued);});await wait(()=>text().includes('Renewed identity'));});
await test('Stripe portal return renders verified plan and payment',async()=>{navigate('/?tab=billing&portal=success');await mount(<WorkspacePage/>);await wait(()=>text().includes('Founder'));assert(!text().includes('Continue billing setup'),'founder routed to setup');});
await test('Unsaved workspace name survives background refresh',async()=>{await mount(<SettingsTab workspace={account} sessionToken={issued} onWorkspaceUpdate={()=>{}}/>);await wait(()=>!!fixture.querySelector('input'));const field=fixture.querySelector('input')!;await input(field,'Unsaved company');await act(async()=>{root!.render(<SettingsTab workspace={{...account,workspaceName:'Server changed'}} sessionToken={issued} onWorkspaceUpdate={()=>{}}/>);invalidateWorkspace();});await settle();assert((fixture.querySelector('input') as HTMLInputElement).value==='Unsaved company','draft overwritten');});
await test('Routing draft survives session refresh',async()=>{await wait(()=>text().includes('Preferred providers'));const fields=Array.from(fixture.querySelectorAll('input'));const field=fields.find(e=>e.value==='groq, mistral')!;assert(field,'routing input missing');await input(field,'draft-provider');await act(async()=>invalidateWorkspace());await settle();assert(Array.from(fixture.querySelectorAll('input')).some(e=>e.value==='draft-provider'),'routing draft overwritten');});
await test('Failed settings save never reports Saved',async()=>{overrides['workspaceSettings:upsert']=()=>{throw Error('Save failed');};await click('Save routing');assert(text().includes('Could not save'),'failure not shown');assert(!text().includes('Saved'),'false saved claim');});
await test('Key read error recovers without remount',async()=>{overrides['apiKeys:listKeys']=()=>{throw Error('Keys unavailable');};await act(async()=>invalidateWorkspace());await wait(()=>text().includes('Keys unavailable'));overrides={};await act(async()=>invalidateWorkspace());await wait(()=>!text().includes('Keys unavailable'));});
await test('Usage failure does not become no usage',async()=>{overrides['logs:getLogStats']=()=>{throw Error('Unavailable');};await mount(<ActivityTab workspace={account} agents={[]} usage={null} activeSubtab="overview" setActiveSubtab={()=>{}} sessionToken={issued}/>);await wait(()=>text().includes('Could not load usage'));assert(!text().includes('No usage in'),'false empty usage');});
await test('Provider loading does not render zero totals',async()=>{overrides['logs:getProviderAnalytics']=()=>new Promise(()=>{});navigate('/?sub=analytics');await mount(<ProviderConsoleTab apis={[]} workspace={account} usage={null} sessionToken={issued} providerId="provider_matrix" showAddApi={false} setShowAddApi={()=>{}}/>);await wait(()=>text().includes('Loading inbound traffic'));assert(!text().includes('Unique callers'),'totals visible before verification');});
await test('Unknown onboarding does not open setup modal',async()=>{overrides['onboarding:getState']=()=>{throw Error('Unavailable');};await mount(<OnboardingWizard sessionToken={issued}/>);await wait(()=>text().includes('Could not verify setup status'));assert(!document.querySelector('[role=dialog]'),'unknown became incomplete');});
await test('Late dashboard response cannot replace newer identity',async()=>{
 let resolveOld:(v:unknown)=>void=()=>{};
 overrides['workspaces:getWorkspaceDashboard']=()=>new Promise(resolve=>{resolveOld=resolve;});
 navigate('/?tab=agents');await mount(<WorkspacePage/>);
 overrides={}; account={...account,workspaceName:'Newest identity'};
 await act(async()=>invalidateWorkspace());await wait(()=>text().includes('Newest identity'));
 await act(async()=>resolveOld({workspace:{...account,workspaceName:'Obsolete identity'}}));await settle();
 assert(!text().includes('Obsolete identity'),'late response replaced account');
});
await test('Agent authentication error is not no agents',async()=>{
 overrides['agents:getWorkspaceAgents']=()=>{throw Error('Invalid or expired session');};
 await mount(<AgentCardGrid sessionToken={issued} onEmpty={<p>No agents connected</p>}/>);
 await wait(()=>text().includes('Invalid or expired session'));assert(!text().includes('No agents connected'),'auth failure became empty');
 overrides={};await act(async()=>invalidateWorkspace());await wait(()=>!text().includes('Invalid or expired session'));
});
await test('Agent reconnect is reflected on shared refresh',async()=>{
 const agents=structuredClone((fx.convex as any)['agents:getWorkspaceAgents']);
 overrides['agents:getWorkspaceAgents']=()=>agents.map((a:any)=>({...a,displayName:'Reconnected agent'}));
 await act(async()=>invalidateWorkspace());await wait(()=>text().includes('Reconnected agent'));
});
await test('Search failure is marked incomplete',async()=>{
 overrides['searchLogs:getRecent']=()=>{throw Error('Unavailable');};
 await mount(<ActivityTab workspace={account} agents={[]} usage={null} activeSubtab="logs" setActiveSubtab={()=>{}} sessionToken={issued}/>);
 await wait(()=>text().includes('Results are incomplete'));
});
await test('Failed onboarding dismissal keeps dialog and error',async()=>{
 overrides['onboarding:getState']=()=>({completedAt:null,firstCallAt:null,dismissedAt:null});
 overrides['onboarding:dismiss']=()=>{throw Error('Save unavailable');};
 await mount(<OnboardingWizard sessionToken={issued}/>);
 await wait(()=>!!document.querySelector('[role=dialog]'));
 const later=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Later');
 await act(async()=>later!.click());await settle();
 assert(!!document.querySelector('[role=dialog]'),'failed save dismissed dialog');
 assert(document.body.textContent?.includes('Could not save setup status'),'missing save error');
});
await test('Free account with saved payment method is not prompted to set up again',async()=>{
 overrides['billing:getBillingInfo']=()=>({...fx.billingInfo,paymentMethod:{type:'link',brand:null,last4:null}});
 await mount(<BillingTab workspace={{...account,tier:'free',stripeCustomerId:'cus_matrix'}} sessionToken={issued}/>);
 await wait(()=>text().includes('Manage payment method'));
 assert(!text().includes('Continue billing setup'),'unnecessary setup prompt');
});
await test('Billing retrieval failure exposes neither connected state nor financial zeroes',async()=>{
 overrides['billing:getBillingInfo']=()=>{throw Error('Unavailable');};
 await mount(<BillingTab workspace={account} sessionToken={issued}/>);
 await wait(()=>text().includes('Could not load payment details'));
 assert(!text().includes('Payment method connected'),'false connected claim');
 assert(!text().includes('This month'),'unverified financial totals');
});
await test('Checkout success refreshes shared state without inventing a paid plan',async()=>{
 account={...account,tier:'free'};
 overrides['billing:getBillingInfo']=()=>({...fx.billingInfo,paymentMethod:{type:'link',brand:null,last4:null}});
 navigate('/?tab=billing&billing=success');await mount(<WorkspacePage/>);
 await wait(()=>text().includes('Payment method connected. Your plan is shown in Billing.'));
 assert(!location.search.includes('billing=success'),'return parameter not cleared');
});
await test('Checkout cancellation refreshes verified account',async()=>{
 account={...account,workspaceName:'After cancellation'};
 navigate('/?tab=billing&billing=cancel');await mount(<WorkspacePage/>);
 await wait(()=>text().includes('After cancellation'));
 assert(text().includes('Checkout cancelled'),'cancel state missing');
});
await test('Pending name save locks submitted draft and failed save preserves it',async()=>{
 let rejectSave:(reason:unknown)=>void=()=>{};
 overrides['workspaces:updateWorkspaceName']=()=>new Promise((_,reject)=>{rejectSave=reject;});
 await mount(<SettingsTab workspace={account} sessionToken={issued} onWorkspaceUpdate={()=>{}}/>);
 const field=fixture.querySelector('input')!;await input(field,'Retained draft');
 await click('Save name');
 assert(field.disabled,'pending save leaves draft editable');
 await act(async()=>rejectSave(Error('Storage unavailable')));await settle();
 assert(field.value==='Retained draft'&&!field.disabled,'failed save lost draft');
 assert(text().includes('Could not save'),'missing failure status');
});
await test('Standalone chain failure is not an empty execution history',async()=>{
 overrides['chains:getChainExecutions']=()=>{throw Error('Read unavailable');};
 overrides['chains:getChainStatsAuth']=()=>{throw Error('Read unavailable');};
 await mount(<ChainsPage/>);await wait(()=>text().includes('Could not load chain'));
 assert(!text().includes('No chains yet'),'failed chain read became empty');
 assert(!text().includes('Success rate'),'failed totals shown');
 overrides={};await act(async()=>invalidateWorkspace());await wait(()=>text().includes('Success rate'));
 assert(!text().includes('Could not load chain'),'recovered chain failure persisted');
});
if(root)await act(async()=>root!.unmount());
output.textContent=results.join('\n')+`\n\n${results.filter(x=>x.startsWith('PASS')).length}/${results.length} passed. No external requests allowed.`;
}
void main();
