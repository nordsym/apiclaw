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

const tests = [
  {
    name: 'ExchangeRate API',
    build: () => {
      const url = new URL('https://api.apilayer.com/exchangerates_data/latest');
      url.searchParams.set('base', 'USD');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_EXCHANGERATE_KEY } }
      };
    }
  },
  {
    name: 'AviationStack API',
    build: () => {
      const url = new URL('http://api.aviationstack.com/v1/flights');
      url.searchParams.set('access_key', env.APILAYER_AVIATIONSTACK_KEY);
      return { url: url.toString(), options: { method: 'GET' } };
    }
  },
  {
    name: 'ScreenshotLayer API',
    build: () => {
      const url = new URL('https://api.screenshotlayer.com/api/capture');
      url.searchParams.set('url', 'https://example.com');
      url.searchParams.set('access_key', env.APILAYER_SCREENSHOTLAYER_KEY);
      return { url: url.toString(), options: { method: 'GET' } };
    }
  },
  {
    name: 'Number Verification API',
    build: () => {
      const url = new URL('https://api.apilayer.com/number_verification/validate');
      url.searchParams.set('number', '+1234567890');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_NUMVERIFY_KEY } }
      };
    }
  },
  {
    name: 'Email Verification API',
    build: () => {
      const url = new URL('https://api.apilayer.com/email_verification/check');
      url.searchParams.set('email', 'test@example.com');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_EMAILVERIFY_KEY } }
      };
    }
  },
  {
    name: 'Marketstack API',
    build: () => {
      const url = new URL('http://api.marketstack.com/v1/eod');
      url.searchParams.set('access_key', env.APILAYER_MARKETSTACK_KEY);
      url.searchParams.set('symbols', 'AAPL');
      url.searchParams.set('limit', '10');
      return { url: url.toString(), options: { method: 'GET' } };
    }
  },
  {
    name: 'VAT Layer API',
    build: () => {
      const url = new URL('https://apilayer.net/api/validate');
      url.searchParams.set('access_key', env.APILAYER_VATLAYER_KEY);
      url.searchParams.set('country_code', 'SE');
      return { url: url.toString(), options: { method: 'GET' } };
    }
  },
  {
    name: 'Finance News API',
    build: () => {
      const url = new URL('https://api.apilayer.com/financelayer/news');
      url.searchParams.set('limit', '5');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_FINANCENEWS_KEY } }
      };
    }
  },
  {
    name: 'Image Crop API',
    build: () => {
      const url = new URL('https://api.apilayer.com/smart_crop/url');
      url.searchParams.set('url', 'https://example.com/image.jpg');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_IMAGECROP_KEY } }
      };
    }
  },
  {
    name: 'Advanced Scraper API',
    build: () => {
      const url = new URL('https://api.apilayer.com/adv_scraper/scraper');
      url.searchParams.set('url', 'https://example.com');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_SCRAPER_KEY } }
      };
    }
  },
  {
    name: 'PDF Layer API',
    build: () => {
      const url = new URL('https://api.pdflayer.com/api');
      return {
        url: url.toString(),
        options: {
          method: 'POST',
          headers: { 'apikey': env.APILAYER_PDFLAYER_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_url: 'https://example.com' })
        }
      };
    }
  },
  {
    name: 'World News API',
    build: () => {
      const url = new URL('https://api.apilayer.com/world_news/extract-news');
      url.searchParams.set('url', 'https://example.com');
      url.searchParams.set('analyze', 'true');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_WORLDNEWS_KEY } }
      };
    }
  },
  {
    name: 'Skills API',
    build: () => {
      const url = new URL('https://api.apilayer.com/skills');
      url.searchParams.set('q', 'machine learning');
      return {
        url: url.toString(),
        options: { method: 'GET', headers: { 'apikey': env.APILAYER_SKILLAPI_KEY } }
      };
    }
  },
  {
    name: 'Form API',
    build: () => {
      const url = new URL('https://api.apilayer.com/form_api/test');
      return {
        url: url.toString(),
        options: {
          method: 'POST',
          headers: { 'apikey': env.APILAYER_FORMAPI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      };
    }
  },
];

async function runTests() {
  console.log('🧪 Testing all 14 APILayer endpoints (with correct auth)\n');

  let working = 0;
  const failed: string[] = [];

  for (const test of tests) {
    try {
      const startTime = Date.now();
      const { url, options } = test.build();
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      const success = response.ok;
      if (success) {
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
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ WORKING: ${working}/14`);
  console.log(`❌ NOT WORKING: ${14 - working}/14\n`);

  if (failed.length > 0) {
    console.log('Failed services:');
    failed.forEach(f => console.log(`  • ${f}`));
  }
}

runTests().catch(console.error);
