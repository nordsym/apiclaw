// Generate stats at build time from apis.json
const fs = require('fs');
const path = require('path');

// Try local copy first (for Vercel), then parent directory (for local dev)
const localRegistryPath = path.join(__dirname, '../src/lib/apis.json');
const parentRegistryPath = path.join(__dirname, '../../src/registry/apis.json');
const registryPath = fs.existsSync(localRegistryPath) ? localRegistryPath : parentRegistryPath;
const outputPath = path.join(__dirname, '../src/lib/stats.json');

try {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  
  const categories = [...new Set(registry.apis.map(api => api.category))];
  
  const stats = {
    apiCount: registry.count,
    categoryCount: categories.length,
    lastUpdated: registry.lastUpdated || new Date().toISOString().split('T')[0],
    generatedAt: new Date().toISOString()
  };
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
  console.log('✓ Stats generated:', stats);
} catch (err) {
  console.error('Failed to generate stats:', err);
  // Write fallback stats
  const fallback = {
    apiCount: 4518,
    categoryCount: 93,
    lastUpdated: new Date().toISOString().split('T')[0],
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
  console.log('✓ Fallback stats written');
}
