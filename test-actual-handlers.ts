import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { executeAPICall } from './src/execute.js';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
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

const tests: Array<{ name: string; action: string; params: Record<string, unknown> }> = [
  { name: 'ExchangeRate API', action: 'exchange_rates', params: {} },
  { name: 'AviationStack API', action: 'aviation', params: {} },
  { name: 'ScreenshotLayer API', action: 'screenshot', params: { url: 'https://example.com' } },
  { name: 'Number Verification API', action: 'verify_number', params: { number: '+46701234567' } },
  { name: 'Email Verification API', action: 'verify_email', params: { email: 'test@example.com' } },
  { name: 'Marketstack API', action: 'market_data', params: { symbols: 'AAPL' } },
  { name: 'VAT Layer API', action: 'vat_check', params: { vat_number: 'SE556012345601' } },
  { name: 'Finance News API', action: 'finance_news', params: { tickers: 'AAPL' } },
  { name: 'Image Crop API', action: 'image_crop', params: { url: 'https://example.com/image.jpg' } },
  { name: 'Advanced Scraper API', action: 'scrape', params: { url: 'https://example.com' } },
  { name: 'PDF Generate API', action: 'pdf_generate', params: { document_url: 'https://example.com' } },
  { name: 'World News API', action: 'world_news', params: { url: 'https://example.com' } },
  { name: 'Skills API', action: 'skills', params: { q: 'machine learning' } },
  { name: 'Form API', action: 'form_submit', params: { endpoint: 'test' } },
];

async function runTests() {
  console.log('🧪 Testing all 14 APILayer handlers via executeAPICall()\n');

  const results: TestResult[] = [];
  let working = 0;

  for (const test of tests) {
    try {
      const result = await executeAPICall('apilayer', test.action, test.params);
      const success = result.success === true;

      if (success) {
        working++;
        console.log(`✅ ${test.name}`);
      } else {
        console.log(`❌ ${test.name}: ${result.error || 'unknown error'}`);
      }

      results.push({
        name: test.name,
        success,
        error: result.error,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ${test.name}: ${errorMsg}`);
      results.push({
        name: test.name,
        success: false,
        error: errorMsg,
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
    failed.forEach(r => console.log(`  • ${r.name}: ${r.error}`));
  }
}

runTests().catch(console.error);
