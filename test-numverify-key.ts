import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

function loadEnv(): Record<string, string> {
  const envPath = path.join(homedir(), '.secrets', 'apilayer.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) vars[match[1].trim()] = match[2].trim();
  }
  return vars;
}

async function test() {
  const env = loadEnv();
  const key = env.APILAYER_NUMVERIFY_KEY;
  console.log('Testing Number Verification with key:', key.substring(0, 8) + '...');

  const url = new URL('https://api.apilayer.com/number_verification/validate');
  url.searchParams.set('number', '+46701234567');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'apikey': key },
  });

  console.log('Status:', response.status);
  if (response.status === 200) {
    console.log('✅ Number Verification NOW WORKING');
    const data = await response.json();
    console.log('Response:', JSON.stringify(data).substring(0, 200));
  } else {
    const data = await response.json();
    console.log('❌ Still failing');
    console.log('Error:', data);
  }
}

test().catch(console.error);
