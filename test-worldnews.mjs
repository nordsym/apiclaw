import { executeAPICall } from './dist/execute.js';

const realNewsUrls = [
  'https://www.bbc.com/news/technology-68621230',
  'https://techcrunch.com/2024/03/15/openai-gpt-4/',
  'https://www.reuters.com/technology/'
];

console.log('🔬 Testing World News API with REAL news URLs...\n');

for (const url of realNewsUrls) {
  console.log(`Testing: ${url.substring(0, 50)}...`);
  try {
    const result = await executeAPICall('apilayer', 'world_news', { url });
    
    if (result.success) {
      console.log(`✅ Working!`);
      console.log(`   Title: ${result.data?.title || 'N/A'}`);
      break; // One success is enough
    } else {
      console.log(`❌ ${result.error || 'Failed'}\n`);
    }
  } catch (e) {
    console.log(`❌ ${e.message}\n`);
  }
}
