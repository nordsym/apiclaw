import assert from 'node:assert/strict';
import { friendlyManagedFailure, normalizeManagedChatParams } from './managedUserExperience';
import { managedPaidCallReady, managedPaidProviderReady } from '../src/managed-commercial-policy';
for (const provider of ['brave_search', 'cohere', 'e2b', 'apilayer', 'firecrawl', 'genprd', 'deepinfra', 'elevenlabs']) {
  assert.equal(managedPaidProviderReady(provider), false);
}
assert.equal(managedPaidProviderReady('openrouter'), true);
assert.equal(managedPaidCallReady('openrouter','openai/gpt-5.4-nano'),true);
assert.equal(managedPaidCallReady('openrouter','anthropic/claude-sonnet-4-6'),false);
assert.equal(managedPaidCallReady('openrouter','unknown/model'),false);
assert.deepEqual(normalizeManagedChatParams('openai', 'gpt-5.4-nano', {max_tokens:16, messages:[]}), {max_completion_tokens:16, messages:[]});
assert.deepEqual(normalizeManagedChatParams('openai', 'gpt-5.4-nano', {max_tokens:16,max_completion_tokens:24}), {max_completion_tokens:24});
assert.deepEqual(normalizeManagedChatParams('openrouter', 'openai/gpt-5.4-nano', {max_tokens:16}), {max_tokens:16});
const limited = friendlyManagedFailure({success:false,data:{error:{message:'private diagnostic'}}},429);
assert.equal((limited.error as any).code,'provider_rate_limited');
assert.equal(JSON.stringify(limited).includes('private diagnostic'),false);
const funding = friendlyManagedFailure({success:false,data:{error:{message:'Your credit balance is too low'}}},400);
assert.equal((funding.error as any).code,'provider_unavailable');
assert.equal((friendlyManagedFailure({success:false},502).error as any).code,'provider_temporarily_unavailable');
assert.deepEqual(friendlyManagedFailure({success:true,data:{ok:true}},200),{success:true,data:{ok:true}});
console.log('Managed commercial boundary and friendly failures passed');
