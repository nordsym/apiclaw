import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

interface TestResult {
  name: string;
  endpoint: string;
  status: number | string;
  success: boolean;
  error?: string;
  responseTime: number;
}

const results: TestResult[] = [];

// Load credentials
function loadEnvFile(): Record<string, string> {
  const envPath = path.join(homedir(), '.secrets', 'apilayer.env');
  if (!fs.existsSync(envPath)) {
    console.error(`❌ No credentials file at ${envPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim().replace(/^['""]|["'"]$/g, '');
    }
  }
  return vars;
}

const env = loadEnvFile();

// Test configurations - ALL 14 APIs
const tests = [
  {
    name: 'ExchangeRate API',
    url: (key: string) => `https://api.apilayer.com/exchangerate?apikey=${key}`,
    key: env.APILAYER_EXCHANGERATE_KEY,
    method: 'GET',
    authType: 'query'
  },
  {
    name: 'AviationStack API',
    url: (key: string) => `https://api.apilayer.com/aviationstack?access_key=${key}`,
    key: env.APILAYER_AVIATIONSTACK_KEY,
    method: 'GET',
    authType: 'query'
  },
  {
    name: 'PDF Layer API',
    url: (key: string) => `https://api.apilayer.com/pdf?url=https://example.com`,
    key: env.APILAYER_PDFLAYER_KEY,
    method: 'GET',
    authType: 'header'
  },
  {
    name: 'Screenshot Layer API',
    url: (key: string) => `https://api.apilayer.com/screenshot?url=https://example.com&access_key=${key}`,
    key: env.APILAYER_SCREENSHOTLAYER_KEY,
    method: 'GET',
    authType: 'query'
  },
  {
    name: 'SkillAPI',
    url: (key: string) => `https://api.promptapi.com/skills?q=test`,
    key: env.APILAYER_SKILLAPI_KEY,
    method: 'GET',
    authType: 'header',
    domain: 'promptapi.com'
  },
  {
    name: 'Image Crop API',
    url: (key: string) => `https://api.apilayer.com/crop?url=https://example.com/image.jpg`,
    key: env.APILAYER_IMAGECROP_KEY,
    method: 'GET',
    authType: 'header'
  },
  {
    name: 'Form API',
    url: (key: string) => `https://api.apilayer.com/form`,
    key: env.APILAYER_FORMAPI_KEY,
    method: 'POST',
    authType: 'header',
    body: 'Test Form'
  },
  {
    name: 'Number Verification API',
    url: (key: string) => `https://api.apilayer.com/validate?number=1234567890&access_key=${key}`,
    key: env.APILAYER_NUMVERIFY_KEY,
    method: 'GET',
    authType: 'query'
  },
  {
    name: 'Email Verification API',
    url: (key: string) => `https://api.apilayer.com/check?email=test@example.com&access_key=${key}`,
    key: env.APILAYER_EMAILVERIFY_KEY,
    method: 'GET',
    authType: 'query'
  },
  {
    name: 'Marketstack API',
    url: (key: string) => `https://api.apilayer.com/eod?symbols=AAPL&access_key=${key}`,
    key: env.APILAYER_MARKETSTACK_KEY,
    method: 'GET',
    authType: 'query'
  },
  {
    name: 'World News API',
    url: (key: string) => `https://api.apilayer.com/worldnews?keywords=test`,
    key: env.APILAYER_WORLDNEWS_KEY,
    method: 'GET',
    authType: 'header'
  },
  {
    name: 'Advanced Scraper API',
    url: (key: string) => `https://api.apilayer.com/scraper?url=https://example.com`,
    key: env.APILAYER_SCRAPER_KEY,
    method: 'GET',
    authType: 'header'
  },
  {
    name: 'Finance News API',
    url: (key: string) => `https://api.apilayer.com/news?limit=5`,
    key: env.APILAYER_FINANCENEWS_KEY,
    method: 'GET',
    authType: 'header'
  },
  {
    name: 'VAT Layer API',
    url: (key: string) => `https://api.apilayer.com/validate?country_code=SE&access_key=${key}`,
    key: env.APILAYER_VATLAYER_KEY,
    method: 'GET',
    authType: 'query'
  }
];

async function runTests() {
  console.log('🧪 Testing all 14 APILayer services...\n');

  for (const test of tests) {
    if (!test.key) {
      results.push({
        name: test.name,
        endpoint: 'N/A',
        status: 'NO KEY',
        success: false,
        responseTime: 0
      });
      console.log(`❌ ${test.name}: NO API KEY FOUND`);
      continue;
    }

    try {
      const startTime = Date.now();
      const url = test.url(test.key);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add API key as header if needed
      if (test.authType === 'header') {
        headers['apikey'] = test.key;
      }

      const options: RequestInit = {
        method: test.method,
        headers
      };

      if (test.body) {
        options.body = test.body;
      }

      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      let success = false;
      let error: string | undefined;

      if (response.ok) {
        success = true;
        console.log(`✅ ${test.name}: ${response.status} (${responseTime}ms)`);
      } else {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          if (body.message) {
            errorMsg += ` - ${body.message}`;
          }
        } catch {
          // body not JSON
        }
        error = errorMsg;
        console.log(`❌ ${test.name}: ${errorMsg} (${responseTime}ms)`);
      }

      results.push({
        name: test.name,
        endpoint: url.split('?')[0],
        status: response.status,
        success,
        error,
        responseTime
      });

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${test.name}: ${errorMsg}`);

      results.push({
        name: test.name,
        endpoint: 'N/A',
        status: 'ERROR',
        success: false,
        error: errorMsg,
        responseTime: 0
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Working (${working.length}):`);
  working.forEach(r => {
    console.log(`  • ${r.name}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(r => {
      console.log(`  • ${r.name}: ${r.error}`);
    });
  }

  console.log(`\n📈 Success rate: ${working.length}/${results.length} (${Math.round(working.length / results.length * 100)}%)`);
}

runTests().catch(console.error);
