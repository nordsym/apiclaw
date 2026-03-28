#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  { action: 'exchange_rates', params: {base: 'USD', symbols: 'EUR'} },
  { action: 'aviation', params: {flight_iata: 'AA100'} },
  { action: 'pdf_generate', params: {document_url: 'https://example.com'} },
  { action: 'screenshot', params: {url: 'https://example.com'} },
  { action: 'verify_email', params: {email: 'test@example.com'} },
  { action: 'verify_number', params: {number: '14158586273'} },
  { action: 'vat_check', params: {vat_number: 'SE556703748501'} },
  { action: 'world_news', params: {url: 'https://example.com'} },
  { action: 'finance_news', params: {tickers: 'AAPL', limit: 3} },
  { action: 'scrape', params: {url: 'https://example.com'} },
  { action: 'image_crop', params: {url: 'https://via.placeholder.com/500'} },
  { action: 'skills', params: {q: 'javascript'} },
  { action: 'form_submit', params: {endpoint: 'test', data: 'test'} },
  { action: 'market_data', params: {symbols: 'AAPL'} }
];

async function testAction(action, params) {
  return new Promise((resolve) => {
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'call_api',
        arguments: {
          provider: 'apilayer',
          action,
          params
        }
      }
    });

    const proc = spawn('node', ['dist/index.js'], {
      cwd: path.join(__dirname),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    proc.stdout.on('data', (data) => output += data.toString());
    proc.stderr.on('data', (data) => output += data.toString());

    proc.on('close', () => {
      try {
        const match = output.match(/\{"result":\{.*\},"jsonrpc":"2\.0","id":1\}/);
        if (match) {
          const json = JSON.parse(match[0]);
          const text = json.result?.content?.[0]?.text;
          if (text) {
            const result = JSON.parse(text);
            resolve(result.status === 'success');
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    });

    proc.stdin.write(request + '\n');
    proc.stdin.end();
    
    // Timeout after 10s
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 10000);
  });
}

async function runAll() {
  console.log('Testing all 14 APILayer actions...\n');
  
  const results = [];
  
  for (const test of tests) {
    const success = await testAction(test.action, test.params);
    results.push({ action: test.action, success });
    console.log(`${success ? '✅' : '❌'} ${test.action}`);
  }
  
  const working = results.filter(r => r.success);
  console.log(`\n📊 FINAL: ${working.length}/14 working`);
  console.log('\n✅ Working:');
  working.forEach(r => console.log(`  • ${r.action}`));
}

runAll();
