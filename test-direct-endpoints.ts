import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: number | string;
  success: boolean;
  responseTime: number;
}

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

const tests = [
  {
    name: 'ExchangeRate API',
    url: `https://api.apilayer.com/exchangerates_data?apikey=${env.APILAYER_EXCHANGERATE_KEY}`,
    method: 'GET',
  },
  {
    name: 'AviationStack API',
    url: `https://api.apilayer.com/aviationstack?access_key=${env.APILAYER_AVIATIONSTACK_KEY}`,
    method: 'GET',
  },
  {
    name: 'ScreenshotLayer API',
    url: `https://api.screenshotlayer.com/api?url=https://example.com&access_key=${env.APILAYER_SCREENSHOTLAYER_KEY}`,
    method: 'GET',
  },
  {
    name: 'Number Verification API',
    url: `https://api.apilayer.com/validate?number=1234567890&access_key=${env.APILAYER_NUMVERIFY_KEY}`,
    method: 'GET',
  },
  {
    name: 'Email Verification API',
    url: `https://api.apilayer.com/check?email=test@example.com&access_key=${env.APILAYER_EMAILVERIFY_KEY}`,
    method: 'GET',
  },
  {
    name: 'Marketstack API',
    url: `https://api.marketstack.com/v1/eod?symbols=AAPL&access_key=${env.APILAYER_MARKETSTACK_KEY}`,
    method: 'GET',
  },
  {
    name: 'VAT Layer API',
    url: `https://apilayer.net/api/validate?country_code=SE&access_key=${env.APILAYER_VATLAYER_KEY}`,
    method: 'GET',
  },
  {
    name: 'Finance News API',
    url: `https://api.apilayer.com/financelayer/news?apikey=${env.APILAYER_FINANCENEWS_KEY}`,
    method: 'GET',
  },
  {
    name: 'Image Crop API',
    url: `https://api.apilayer.com/smart_crop/url?apikey=${env.APILAYER_IMAGECROP_KEY}`,
    method: 'GET',
  },
  {
    name: 'Advanced Scraper API',
    url: `https://api.apilayer.com/adv_scraper/scraper?url=https://example.com&apikey=${env.APILAYER_SCRAPER_KEY}`,
    method: 'GET',
  },
  {
    name: 'PDF Layer API',
    url: `https://api.pdflayer.com/api`,
    method: 'POST',
    headers: { 'apikey': env.APILAYER_PDFLAYER_KEY },
    body: JSON.stringify({ document_url: 'https://example.com' }),
  },
  {
    name: 'World News API',
    url: `https://api.apilayer.com/world_news/extract-news?url=https://example.com&apikey=${env.APILAYER_WORLDNEWS_KEY}`,
    method: 'GET',
  },
  {
    name: 'Skills API',
    url: `https://api.apilayer.com/skills?q=machine%20learning&apikey=${env.APILAYER_SKILLAPI_KEY}`,
    method: 'GET',
  },
  {
    name: 'Form API',
    url: `https://api.apilayer.com/form_api/test`,
    method: 'POST',
    headers: { 'apikey': env.APILAYER_FORMAPI_KEY },
    body: JSON.stringify({}),
  },
];

async function runTests() {
  console.log('🧪 Testing all 14 APILayer endpoints\n');

  const results: TestResult[] = [];
  let working = 0;

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          ...(test.headers || {}),
        },
      };

      if ((test as any).body) {
        options.body = (test as any).body;
      }

      const response = await fetch((test as any).url, options);
      const responseTime = Date.now() - startTime;

      const success = response.ok;
      if (success) {
        working++;
        console.log(`✅ ${test.name}: ${response.status} (${responseTime}ms)`);
      } else {
        console.log(`❌ ${test.name}: ${response.status} (${responseTime}ms)`);
      }

      results.push({
        name: test.name,
        endpoint: (test as any).url.split('?')[0],
        method: test.method,
        status: response.status,
        success,
        responseTime,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${test.name}: ${errorMsg}`);
      results.push({
        name: test.name,
        endpoint: 'ERROR',
        method: test.method,
        status: 'ERROR',
        success: false,
        responseTime: 0,
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ WORKING: ${working}/14`);
  console.log(`❌ NOT WORKING: ${14 - working}/14\n`);

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('Failed services:');
    failed.forEach(r => console.log(`  • ${r.name}: ${r.status}`));
  }
}

runTests().catch(console.error);
