import { executeAPICall } from './dist/execute.js';

const tests = [
  'exchange_rates', 'market_data', 'aviation', 'pdf_generate',
  'screenshot', 'verify_email', 'verify_number', 'vat_check',
  'world_news', 'finance_news', 'scrape', 'image_crop',
  'skills', 'form_submit'
];

const params = {
  exchange_rates: { base: 'USD', symbols: 'EUR' },
  market_data: { symbols: 'AAPL' },
  aviation: { flight_iata: 'AA100' },
  pdf_generate: { document_url: 'https://example.com' },
  screenshot: { url: 'https://example.com' },
  verify_email: { email: 'test@example.com' },
  verify_number: { number: '+14158586273' },
  vat_check: { vat_number: 'LU26375245' },
  world_news: { url: 'https://example.com/news' },
  finance_news: { tickers: 'AAPL' },
  scrape: { url: 'https://example.com' },
  image_crop: { url: 'https://example.com/img.jpg', width: '200' },
  skills: { q: 'javascript' },
  form_submit: { endpoint: 'test', data: {} }
};

let working = 0, blocked = 0;

console.log('🔬 Testing all 14 APILayer services...\n');

for (const action of tests) {
  try {
    const result = await executeAPICall('apilayer', action, params[action]);
    
    if (result.success) {
      console.log(`✅ ${action}`);
      working++;
    } else {
      const errMsg = result.error || result.message || 'Failed';
      console.log(`❌ ${action}: ${errMsg.substring(0, 60)}`);
      blocked++;
    }
  } catch (e) {
    console.log(`❌ ${action}: ${e.message.substring(0, 60)}`);
    blocked++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`📊 FAKTISKA SIFFROR: ${working}/14 working, ${blocked}/14 blocked`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
