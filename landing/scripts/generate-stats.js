// Generate stats at build time from apis.json
const fs = require('fs');
const path = require('path');

// Category mapping (consolidate similar ones)
const categoryMap = {
  'AI': 'AI & ML',
  'AI & ML': 'AI & ML',
  'AI/ML': 'AI & ML',
  'Machine Learning': 'AI & ML',
  'Authentication': 'Auth & Security',
  'Auth': 'Auth & Security',
  'Security': 'Auth & Security',
  'Payment': 'Payments',
  'Payments': 'Payments',
  'Finance': 'Finance',
  'Cryptocurrency': 'Finance',
  'Currency': 'Finance',
  'Health': 'Health & Fitness',
  'Health & Fitness': 'Health & Fitness',
  'Healthcare': 'Health & Fitness',
  'Fitness': 'Health & Fitness',
  'Social': 'Social & Communication',
  'Social Media': 'Social & Communication',
  'Communication': 'Social & Communication',
  'Messaging': 'Social & Communication',
  'Data': 'Data & Analytics',
  'Data & Analytics': 'Data & Analytics',
  'Analytics': 'Data & Analytics',
  'Big Data': 'Data & Analytics',
  'Cloud': 'Cloud & Infrastructure',
  'Cloud Storage': 'Cloud & Infrastructure',
  'Infrastructure': 'Cloud & Infrastructure',
  'DevOps': 'Development',
  'Development': 'Development',
  'Development Tools': 'Development',
  'Testing': 'Development',
  'E-commerce': 'Commerce',
  'Commerce': 'Commerce',
  'Shopping': 'Commerce',
  'Games': 'Entertainment',
  'Gaming': 'Entertainment',
  'Entertainment': 'Entertainment',
  'Music': 'Entertainment',
  'Video': 'Media',
  'Media': 'Media',
  'Photography': 'Media',
  'News': 'News & Media',
  'News & information': 'News & Media',
  'Geo': 'Location & Maps',
  'Geocoding': 'Location & Maps',
  'Geolocation': 'Location & Maps',
  'Maps': 'Location & Maps',
  'Location': 'Location & Maps',
  'Spatial': 'Location & Maps',
  'Transportation': 'Travel & Transport',
  'Travel': 'Travel & Transport',
  'Logistics': 'Travel & Transport',
  'Delivery-Tracking': 'Travel & Transport',
  'Carsharing': 'Travel & Transport',
  'Document': 'Documents & Files',
  'Documents': 'Documents & Files',
  'File Storage and Manipulation': 'Documents & Files',
  'Web Scraping': 'Search & Scraping',
  'Search': 'Search & Scraping',
  'Text Analysis': 'Language & Text',
  'Language': 'Language & Text',
  'Dictionary': 'Language & Text',
  'Vision Analysis': 'AI & ML',
  'Art & Design': 'Design',
  'Design': 'Design',
};

// Try local copy first (for Vercel), then parent directory (for local dev)
const localRegistryPath = path.join(__dirname, '../src/lib/apis.json');
const parentRegistryPath = path.join(__dirname, '../../src/registry/apis.json');
const registryPath = fs.existsSync(localRegistryPath) ? localRegistryPath : parentRegistryPath;
const outputPath = path.join(__dirname, '../src/lib/stats.json');

try {
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  
  // Consolidate categories using the mapping and count them
  const categoryBreakdown = {};
  registry.apis.forEach(api => {
    const cat = categoryMap[api.category] || api.category || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });
  const uniqueCategories = Object.keys(categoryBreakdown);
  
  // Count open APIs (no auth required) - case insensitive
  const openApiCount = registry.apis.filter(api => 
    !api.auth || api.auth === '' || api.auth.toLowerCase() === 'none'
  ).length;
  
  // Direct Call providers: Groq, Deepgram, Mistral, Cohere, Together, Stability, 
  // AssemblyAI, Serper, OpenAI, Anthropic, ElevenLabs, Replicate, Brave, Resend, 
  // Twilio, 46elks, Stripe, SendGrid, GitHub
  const directCallCount = 19;
  
  // npm downloads (static for now, can migrate to real-time when cashflow)
  const npmDownloads = 4232;
  
  const stats = {
    apiCount: registry.count,
    openApiCount: openApiCount,
    directCallCount: directCallCount,
    npmDownloads: npmDownloads,
    categoryCount: uniqueCategories.length,
    generatedAt: new Date().toISOString(),
    categoryBreakdown: categoryBreakdown
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
    apiCount: 22392,
    openApiCount: 996,
    directCallCount: 19,
    npmDownloads: 4232,
    categoryCount: 14,
    generatedAt: new Date().toISOString(),
    categoryBreakdown: {}
  };
  fs.writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
  console.log('✓ Fallback stats written');
}
