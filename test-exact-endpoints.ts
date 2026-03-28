import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

function loadEnv(): Record<string, string> {
  const envPath = path.join(homedir(), '.secrets', 'apilayer.env');
  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim().replace(/^['\"]|[\"']$/g, '');
    }
  }
  return vars;
}

const env = loadEnv();

const tests = [
  {
    name: 'ExchangeRate API',
    url: (key: string) => `https://api.apilayer.com/exchangerate?apikey=${key}`,
    key: env.APILAYER_EXCHANGERATE_KEY,
    method: 'GET'
  },
  {
    name: 'AviationStack API',
    url: (key: string) => `https://api.apilayer.com/aviationstack?access_key=${key}`,
    key: env.APILAYER_AVIATIONSTACK_KEY,
    method: 'GET'
  },
  {
    name: 'ScreenshotLayer API',
    url: (key: string) => `https://api.apilayer.com/screenshot?url=https://example.com&access_key=${key}`,
    key: env.APILAYER_SCREENSHOTLAYER_KEY,
    method: 'GET'
  },
  {
    name: 'Number Verification API',
    url: (key: string) => `https://api.apilayer.com/validate?number=1234567890&access_key=${key}`,
    key: env.APILAYER_NUMVERIFY_KEY,
    method: 'GET'
  },
  {
    name: 'Email Verification API',
    url: (key: string) => `https://api.apilayer.com/check?email=test@example.com&access_key=${key}`,
    key: env.APILAYER_EMAILVERIFY_KEY,
    method: 'GET'
  },
  {
    name: 'Marketstack API',
    url: (key: string) => `https://api.apilayer.com/eod?symbols=AAPL&access_key=${key}`,
    key: env.APILAYER_MARKETSTACK_KEY,
    method: 'GET'
  },
  {
    name: 'VAT Layer API',
    url: (key: string) => `https://api.apilayer.com/validate?country_code=SE&access_key=${key}`,
    key: env.APILAYER_VATLAYER_KEY,
    method: 'GET'
  },
  {
    name: 'Finance News API',
    url: (key: string) => `https://api.apilayer.com/financelayer/news?limit=5&apikey=${key}`,
    key: env.APILAYER_FINANCENEWS_KEY,
    method: 'GET'
  },
  {
    name: 'Image Crop API',
    url: (key: string) => `https://api.apilayer.com/smart_crop/url?apikey=${key}`,
    key: env.APILAYER_IMAGECROP_KEY,
    method: 'GET'
  },
  {
    name: 'Advanced Scraper API',
    url: (key: string) => `https://api.apilayer.com/adv_scraper/scraper?url=https://example.com&apikey=${key}`,
    key: env.APILAYER_SCRAPER_KEY,
    method: 'GET'
  },
  {
    name: 'PDF Layer API',
    url: (key: string) => `https://api.pdflayer.com/api`,
    key: env.APILAYER_PDFLAYER_KEY,
    method: 'POST'
  },
  {
    name: 'World News API',
    url: (key: string) => `https://api.apilayer.com/world_news/extract-news?url=https://example.com&apikey=${key}`,
    key: env.APILAYER_WORLDNEWS_KEY,
    method: 'GET'
  },
  {
    name: 'Skills API',
    url: (key: string) => `https://api.apilayer.com/skills?q=test&apikey=${key}`,
    key: env.APILAYER_SKILLAPI_KEY,
    method: 'GET'
  },
  {
    name: 'Form API',
    url: (key: string) => `https://api.apilayer.com/form_api/test?apikey=${key}`,
    key: env.APILAYER_FORMAPI_KEY,
    method: 'POST'
  },
];

async function runTests() {
  console.log('🧪 Testing exact endpoints from execute.ts\n');

  let working = 0;
  const failed: string[] = [];

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const url = test.url(test.key);
      const options: RequestInit = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };

      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        working++;
        console.log(`✅ ${test.name}: ${response.status} (${responseTime}ms)`);
      } else {
        console.log(`❌ ${test.name}: ${response.status} (${responseTime}ms)`);
        failed.push(`${test.name}: ${response.status}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${test.name}: ${errorMsg}`);
      failed.push(`${test.name}: ${errorMsg}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ WORKING: ${working}/14`);
  console.log(`❌ NOT WORKING: ${14 - working}/14\n`);
}

runTests().catch(console.error);
