import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

// Load credentials
function loadEnv(): Record<string, string> {
  const envPath = path.join(homedir(), '.secrets', 'apilayer.env');
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const vars: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        vars[match[1].trim()] = match[2].trim();
      }
    }
    return vars;
  } catch {
    console.error('Failed to load credentials');
    return {};
  }
}

const env = loadEnv();

// Manual test of the 5 failing services
async function testFailing() {
  console.log('Testing 5 problematic services:\n');

  const tests = [
    {
      name: 'Number Verification',
      url: 'https://api.apilayer.com/number_verification/validate',
      params: { number: '+46701234567' },
      key: env.APILAYER_NUMVERIFY_KEY,
    },
    {
      name: 'Image Crop',
      url: 'https://api.apilayer.com/smart_crop/url',
      params: { url: 'https://example.com/image.jpg' },
      key: env.APILAYER_IMAGECROP_KEY,
    },
    {
      name: 'World News',
      url: 'https://api.apilayer.com/world_news/extract-news',
      params: { url: 'https://example.com', analyze: 'true' },
      key: env.APILAYER_WORLDNEWS_KEY,
    },
    {
      name: 'Skills',
      url: 'https://api.apilayer.com/skills',
      params: { q: 'machine learning' },
      key: env.APILAYER_SKILLAPI_KEY,
    },
    {
      name: 'Form API',
      url: 'https://api.apilayer.com/form_api/test',
      params: {},
      key: env.APILAYER_FORMAPI_KEY,
    },
  ];

  for (const test of tests) {
    // Build URL with params
    const url = new URL(test.url);
    Object.entries(test.params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v));
    });

    try {
      const response = await fetch(url.toString(), {
        method: test.url.includes('form_api') ? 'POST' : 'GET',
        headers: {
          'apikey': test.key,
          'Content-Type': 'application/json',
        },
        ...(test.url.includes('form_api') && { body: JSON.stringify({}) }),
      });

      const status = response.status;
      const headers = response.headers;
      const contentType = headers.get('content-type');

      console.log(`${status === 200 ? '✅' : '❌'} ${test.name}: ${status}`);
      if (status !== 200) {
        try {
          const data = await response.json();
          console.log(`   Error: ${JSON.stringify(data).substring(0, 100)}`);
        } catch {
          const text = await response.text();
          console.log(`   Response: ${text.substring(0, 100)}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

testFailing().catch(console.error);
