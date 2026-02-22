#!/usr/bin/env node
/**
 * APIClaw Natt-Expansion: Bulk add APIs from APIs.guru
 * Adds ~2500+ OpenAPI-documented APIs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.join(__dirname, '../src/registry/apis.json');

// Read existing registry
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
const existingIds = new Set(registry.apis.map(a => a.id.toLowerCase()));
const existingNames = new Set(registry.apis.map(a => a.name.toLowerCase()));

// APIs.guru data (fetched earlier)
const apisguru = JSON.parse(fs.readFileSync(path.join(__dirname, 'apisguru-data.json'), 'utf-8'));

let added = 0;
let skipped = 0;

// Category mapping from APIs.guru categories
const categoryMap = {
  'financial': 'Finance',
  'payment': 'Finance',
  'security': 'Security',
  'cloud': 'Cloud',
  'developer_tools': 'Development',
  'location': 'Geocoding',
  'iot': 'IoT',
  'marketing': 'Marketing',
  'social': 'Social',
  'open_data': 'Open Data',
  'messaging': 'Communication',
  'analytics': 'Analytics',
  'media': 'Media',
  'search': 'Search',
  'ecommerce': 'Business',
  'transportation': 'Transportation',
  'energy': 'Environment',
  'telecom': 'Communication',
  'machine_learning': 'Machine Learning'
};

for (const [key, api] of Object.entries(apisguru)) {
  const preferred = api.preferred;
  const version = api.versions[preferred];
  if (!version || !version.info) continue;

  const info = version.info;
  const name = info.title || key;
  const id = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Skip if already exists
  if (existingIds.has(id) || existingNames.has(name.toLowerCase())) {
    skipped++;
    continue;
  }

  // Extract category
  let category = 'Uncategorized';
  const cats = info['x-apisguru-categories'] || [];
  for (const c of cats) {
    if (categoryMap[c]) {
      category = categoryMap[c];
      break;
    }
  }

  // Extract auth type
  let auth = 'None';
  if (info.securityDefinitions || version.openapiVer?.startsWith('3')) {
    // Most APIs.guru APIs require some auth
    auth = 'apiKey';
  }

  // Build keywords
  const keywords = [];
  if (info.description) {
    const desc = info.description.toLowerCase();
    if (desc.includes('rest')) keywords.push('rest');
    if (desc.includes('json')) keywords.push('json');
    if (desc.includes('real-time') || desc.includes('realtime')) keywords.push('realtime');
    if (desc.includes('free')) keywords.push('free');
    if (desc.includes('open source') || desc.includes('opensource')) keywords.push('opensource');
  }
  keywords.push(category.toLowerCase());

  const newApi = {
    id,
    name,
    description: (info.description || 'No description').substring(0, 500).split('\n')[0],
    category,
    auth,
    https: version.swaggerUrl?.startsWith('https') ?? true,
    cors: 'unknown',
    link: version.externalDocs?.url || version.swaggerUrl || `https://api.apis.guru/v2/specs/${key}/${preferred}.json`,
    pricing: 'unknown',
    keywords,
    source: 'apis.guru',
    openapiSpec: version.swaggerUrl
  };

  registry.apis.push(newApi);
  existingIds.add(id);
  added++;
}

// Update metadata
registry.count = registry.apis.length;
registry.lastUpdated = new Date().toISOString().split('T')[0];

// Write back
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

console.log(`✅ APIClaw Natt-Expansion Complete`);
console.log(`   Added: ${added} new APIs`);
console.log(`   Skipped: ${skipped} (already exist)`);
console.log(`   Total: ${registry.count} APIs`);
