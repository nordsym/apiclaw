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
  { name: 'ExchangeRate API', key: 'APILAYER_EXCHANGERATE_KEY', url: 'https://api.apilayer.com/exchangerates_data/latest?base=USD' },
  { name: 'AviationStack API', key: 'APILAYER_AVIATIONSTACK_KEY', url: 'http://api.aviationstack.com/v1/flights' },
  { name: 'ScreenshotLayer API', key: 'APILAYER_SCREENSHOTLAYER_KEY', url: 'https://api.screenshotlayer.com/api/capture?url=https://example.com' },
  { name: 'Number Verification API', key: 'APILAYER_NUMVERIFY_KEY', url: 'https://api.apilayer.com/number_verification/validate?number=+1234567890' },
  { name: 'Email Verification API', key: 'APILAYER_EMAILVERIFY_KEY', url: 'https://api.apilayer.com/email_verification/check?email=test@example.com' },
  { name: 'Marketstack API', key: 'APILAYER_MARKETSTACK_KEY', url: 'http://api.marketstack.com/v1/eod?symbols=AAPL' },
  { name: 'VAT Layer API', key: 'APILAYER_VATLAYER_KEY', url: 'https://apilayer.net/api/validate?country_code=SE' },
  { name: 'Finance News API', key: 'APILAYER_FINANCENEWS_KEY', url: 'https://api.apilayer.com/financelayer/news' },
  { name: 'Image Crop API', key: 'APILAYER_IMAGECROP_KEY', url: 'https://api.apilayer.com/smart_crop/url' },
  { name: 'Advanced Scraper API', key: 'APILAYER_SCRAPER_KEY', url: 'https://api.apilayer.com/adv_scraper/scraper?url=https://example.com' },
  { name: 'PDF Layer API', key: 'APILAYER_PDFLAYER_KEY', url: 'https://api.pdflayer.com/api', method: 'POST' },
  { name: 'World News API', key: 'APILAYER_WORLDNEWS_KEY', url: 'https://api.apilayer.com/world_news/extract-news?url=https://example.com' },
  { name: 'Skills API', key: 'APILAYER_SKILLAPI_KEY', url: 'https://api.apilayer.com/skills?q=test' },
  { name: 'Form API', key: 'APILAYER_FORMAPI_KEY', url: 'https://api.apilayer.com/form_api/test', method: 'POST' },
];

async function runTests() {
  console.log('🧪 Testing all 14 APILayer services\n');

  let working = 0;
  const failed: string[] = [];

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const key = env[test.key as keyof typeof env];
      if (!key) {
        console.log(`❌ ${test.name}: NO KEY`);
        failed.push(`${test.name}: NO KEY`);
        continue;
      }

      const sep = test.url.includes('?') ? '&' : '?';
      const keyParam = test.key.includes('MARKETSTACK') || test.key.includes('AVIATIONSTACK') ? 'access_key' : 'apikey';
      const fullUrl = `${test.url}${sep}${keyParam}=${key}`;

      const options: RequestInit = {
        method: test.method || 'GET',
      };

      const response = await fetch(fullUrl, options);
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
