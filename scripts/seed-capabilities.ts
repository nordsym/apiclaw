/**
 * Seed initial capabilities and provider mappings
 * Run with: npx ts-node scripts/seed-capabilities.ts
 */

const CONVEX_URL = 'https://adventurous-avocet-799.convex.cloud';

async function mutation(path: string, args: Record<string, unknown>) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mutation failed: ${err}`);
  }
  return res.json();
}

async function seed() {
  console.log('🦞 Seeding APIClaw capabilities...\n');

  // =====================
  // CAPABILITIES
  // =====================

  console.log('Creating capabilities...');

  // SMS
  await mutation('capabilities:create', {
    id: 'sms',
    name: 'SMS Messaging',
    description: 'Send SMS text messages',
    category: 'communication',
    standardParams: [
      { name: 'to', type: 'string', required: true, description: 'Phone number in E.164 format (+46...)' },
      { name: 'message', type: 'string', required: true, description: 'Message content (max 1600 chars)' },
      { name: 'from', type: 'string', required: false, description: 'Sender ID or number' },
    ],
  });
  console.log('  ✓ sms');

  // Email
  await mutation('capabilities:create', {
    id: 'email',
    name: 'Email',
    description: 'Send email messages',
    category: 'communication',
    standardParams: [
      { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
      { name: 'subject', type: 'string', required: true, description: 'Email subject line' },
      { name: 'message', type: 'string', required: true, description: 'Email body (text or HTML)' },
      { name: 'from', type: 'string', required: false, description: 'Sender email address' },
    ],
  });
  console.log('  ✓ email');

  // Search
  await mutation('capabilities:create', {
    id: 'search',
    name: 'Web Search',
    description: 'Search the web',
    category: 'data',
    standardParams: [
      { name: 'query', type: 'string', required: true, description: 'Search query' },
      { name: 'limit', type: 'number', required: false, description: 'Max results (default 10)' },
    ],
  });
  console.log('  ✓ search');

  // TTS
  await mutation('capabilities:create', {
    id: 'tts',
    name: 'Text to Speech',
    description: 'Convert text to spoken audio',
    category: 'ai',
    standardParams: [
      { name: 'text', type: 'string', required: true, description: 'Text to convert to speech' },
      { name: 'voice', type: 'string', required: false, description: 'Voice ID or name' },
    ],
  });
  console.log('  ✓ tts');

  // LLM
  await mutation('capabilities:create', {
    id: 'llm',
    name: 'Language Model',
    description: 'Chat with AI language models',
    category: 'ai',
    standardParams: [
      { name: 'messages', type: 'object', required: true, description: 'Array of chat messages' },
      { name: 'model', type: 'string', required: false, description: 'Model to use' },
    ],
  });
  console.log('  ✓ llm');

  // =====================
  // PROVIDER MAPPINGS
  // =====================

  console.log('\nMapping providers to capabilities...');

  // SMS providers
  await mutation('capabilities:addProvider', {
    providerId: '46elks',
    capabilityId: 'sms',
    priority: 1,
    regions: ['SE', 'NO', 'DK', 'FI'],
    pricePerUnit: 35, // 0.35 SEK in öre
    currency: 'SEK',
    avgLatencyMs: 200,
    paramMapping: { to: 'to', message: 'message', from: 'from' },
  });
  console.log('  ✓ 46elks → sms (priority 1, SE)');

  await mutation('capabilities:addProvider', {
    providerId: 'twilio',
    capabilityId: 'sms',
    priority: 2,
    regions: ['US', 'EU', 'GLOBAL'],
    pricePerUnit: 5, // $0.05 in cents
    currency: 'USD',
    avgLatencyMs: 300,
    paramMapping: { to: 'To', message: 'Body', from: 'From' },
  });
  console.log('  ✓ twilio → sms (priority 2, GLOBAL)');

  // Email providers
  await mutation('capabilities:addProvider', {
    providerId: 'resend',
    capabilityId: 'email',
    priority: 1,
    regions: ['GLOBAL'],
    pricePerUnit: 0, // Free tier
    currency: 'USD',
    avgLatencyMs: 150,
    paramMapping: { to: 'to', subject: 'subject', message: 'html', from: 'from' },
  });
  console.log('  ✓ resend → email (priority 1)');

  // Search providers
  await mutation('capabilities:addProvider', {
    providerId: 'brave_search',
    capabilityId: 'search',
    priority: 1,
    regions: ['GLOBAL'],
    pricePerUnit: 0,
    currency: 'USD',
    avgLatencyMs: 100,
    paramMapping: { query: 'query', limit: 'count' },
  });
  console.log('  ✓ brave_search → search (priority 1)');

  // TTS providers
  await mutation('capabilities:addProvider', {
    providerId: 'elevenlabs',
    capabilityId: 'tts',
    priority: 1,
    regions: ['GLOBAL'],
    pricePerUnit: 30, // per 1k chars
    currency: 'USD',
    avgLatencyMs: 500,
    paramMapping: { text: 'text', voice: 'voice_id' },
  });
  console.log('  ✓ elevenlabs → tts (priority 1)');

  // LLM providers
  await mutation('capabilities:addProvider', {
    providerId: 'openrouter',
    capabilityId: 'llm',
    priority: 1,
    regions: ['GLOBAL'],
    pricePerUnit: 0, // varies by model
    currency: 'USD',
    avgLatencyMs: 1000,
    paramMapping: { messages: 'messages', model: 'model' },
  });
  console.log('  ✓ openrouter → llm (priority 1)');

  console.log('\n✅ Seeding complete!');
  console.log('\nCapabilities ready:');
  console.log('  - sms (46elks, twilio)');
  console.log('  - email (resend)');
  console.log('  - search (brave_search)');
  console.log('  - tts (elevenlabs)');
  console.log('  - llm (openrouter)');
}

seed().catch(console.error);
