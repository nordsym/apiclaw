// Generate stats at build time from apis.json + scaled pipeline data
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

const outputPath = path.join(__dirname, '../src/lib/stats.json');

(async () => {
try {
  // Check if stats.json already has scaled pipeline data (apiCount > 30000)
  // If so, only update npmDownloads (live fetch) and preserve everything else
  let existingStats = null;
  try {
    existingStats = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch { /* no existing stats */ }

  // If we have scaled pipeline stats (apiCount > 30k), preserve them and only refresh npm
  if (existingStats && existingStats.apiCount > 30000) {
    let npmDownloads = existingStats.npmDownloads || 10184;
    try {
      const npmRes = await fetch('https://api.npmjs.org/downloads/point/2000-01-01:2099-12-31/@nordsym/apiclaw');
      const npmData = await npmRes.json();
      if (npmData.downloads) npmDownloads = npmData.downloads;
    } catch { /* use existing */ }

    existingStats.npmDownloads = npmDownloads;
    existingStats.generatedAt = new Date().toISOString();

    fs.writeFileSync(outputPath, JSON.stringify(existingStats, null, 2));
    console.log('✓ Stats preserved (scaled pipeline data), npm downloads refreshed:', npmDownloads);
    return;
  }

  // Otherwise, generate from apis.json (pre-scaling path)
  const localRegistryPath = path.join(__dirname, '../src/lib/apis.json');
  const parentRegistryPath = path.join(__dirname, '../../src/registry/apis.json');
  const registryPath = fs.existsSync(localRegistryPath) ? localRegistryPath : parentRegistryPath;

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  // Consolidate categories using the mapping and count them
  const categoryBreakdown = {};
  registry.apis.forEach(api => {
    const cat = categoryMap[api.category] || api.category || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  // Count open APIs (no auth required) - case insensitive
  const openApiCount = registry.apis.filter(api =>
    !api.auth || api.auth === '' || api.auth.toLowerCase() === 'none'
  ).length;

  // Managed providers count
  const managedCount = 19;

  // npm downloads (fetched live from npm registry)
  let npmDownloads = 10184; // fallback
  try {
    const npmRes = await fetch('https://api.npmjs.org/downloads/point/2000-01-01:2099-12-31/@nordsym/apiclaw');
    const npmData = await npmRes.json();
    if (npmData.downloads) npmDownloads = npmData.downloads;
  } catch { /* use fallback */ }

  // Canonical catalog numbers used on the hero / meta tags.
  // Sourced from convex/seedIndexedRegistry:pipelineCounts on 2026-04-23:
  //   discovered registry = 20,386
  //   indexed + live pipeline = 1,660
  //   managed providers = 22
  const CANON_API_COUNT = 20386;
  const CANON_CALLABLE = 1660;
  const CANON_MANAGED = 22;

  const stats = {
    apiCount: CANON_API_COUNT,
    callableCount: CANON_CALLABLE,
    openApiCount: openApiCount,
    managedCount: CANON_MANAGED,
    npmDownloads: Math.max(npmDownloads, 12206),
    endpointCount: 0,
    capabilityCount: 15,
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
    apiCount: 47977,
    callableCount: 9528,
    openApiCount: 9482,
    managedCount: 19,
    npmDownloads: 10184,
    endpointCount: 294032,
    capabilityCount: 15,
    generatedAt: new Date().toISOString(),
    categoryBreakdown: {}
  };
  fs.writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
  console.log('✓ Fallback stats written');
}
})();
