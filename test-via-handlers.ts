import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

// Load credentials
function loadEnv(): Record<string, string> {
  const envPath = path.join(homedir(), '.secrets', 'apilayer.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim();
    }
  }
  return vars;
}

const env = loadEnv();

// Import handlers directly
const handlers: Record<string, Record<string, any>> = {
  apilayer: {
    exchange_rates: async (params: any) => {
      const key = env.APILAYER_EXCHANGERATE_KEY;
      const url = new URL('https://api.apilayer.com/exchangerates_data/latest');
      url.searchParams.set('base', 'USD');
      return fetch(url.toString(), { method: 'GET', headers: { 'apikey': key } });
    },
    verify_number: async (params: any) => {
      const key = env.APILAYER_NUMVERIFY_KEY;
      const url = new URL('https://api.apilayer.com/number_verification/validate');
      url.searchParams.set('number', '+46701234567');
      return fetch(url.toString(), { method: 'GET', headers: { 'apikey': key } });
    },
    image_crop: async (params: any) => {
      const key = env.APILAYER_IMAGECROP_KEY;
      const url = new URL('https://api.apilayer.com/smart_crop/url');
      url.searchParams.set('url', 'https://example.com/image.jpg');
      return fetch(url.toString(), { method: 'GET', headers: { 'apikey': key } });
    },
    world_news: async (params: any) => {
      const key = env.APILAYER_WORLDNEWS_KEY;
      const url = new URL('https://api.apilayer.com/world_news/extract-news');
      url.searchParams.set('url', 'https://example.com');
      url.searchParams.set('analyze', 'true');
      return fetch(url.toString(), { method: 'GET', headers: { 'apikey': key } });
    },
    skills: async (params: any) => {
      const key = env.APILAYER_SKILLAPI_KEY;
      const url = new URL('https://api.apilayer.com/skills');
      url.searchParams.set('q', 'machine learning');
      return fetch(url.toString(), { method: 'GET', headers: { 'apikey': key } });
    },
    form_submit: async (params: any) => {
      const key = env.APILAYER_FORMAPI_KEY;
      return fetch('https://api.apilayer.com/form_api/test', {
        method: 'POST',
        headers: { 'apikey': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    },
  },
};

async function testHandlers() {
  console.log('🧪 Testing handlers directly\n');

  const tests = [
    { name: 'Exchange Rates', action: 'exchange_rates' },
    { name: 'Verify Number', action: 'verify_number' },
    { name: 'Image Crop', action: 'image_crop' },
    { name: 'World News', action: 'world_news' },
    { name: 'Skills', action: 'skills' },
    { name: 'Form Submit', action: 'form_submit' },
  ];

  for (const test of tests) {
    try {
      const handler = handlers.apilayer[test.action];
      const startTime = Date.now();
      const response = await handler({});
      const responseTime = Date.now() - startTime;
      console.log(`${response.ok ? '✅' : '❌'} ${test.name}: ${response.status} (${responseTime}ms)`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${test.name}: ${errorMsg}`);
    }
  }
}

testHandlers().catch(console.error);
