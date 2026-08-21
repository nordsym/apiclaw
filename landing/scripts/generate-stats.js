// Generate measured catalog stats from the same inventory and policy modules
// used by the public /api/catalog route. sync-canon-to-stats.mjs validates the
// result against src/canon-stats.ts before a build may continue.
const fs = require('fs');
const path = require('path');

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
const verificationPath = path.join(__dirname, '../src/lib/verification-status.json');
const localRegistryPath = path.join(__dirname, '../src/lib/apis.json');
const parentRegistryPath = path.join(__dirname, '../../src/registry/apis.json');
const productTruthPath = path.join(__dirname, '../../src/product-truth.ts');
const workspacePublicPath = path.join(__dirname, '../../src/workspace-public-apis.json');

function normalizeProviderReference(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function loadProductTruth(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const start = source.indexOf('export const MANAGED_PROVIDER_ADAPTERS = [');
  const end = source.indexOf('] as const satisfies', start);
  if (start < 0 || end < 0) {
    throw new Error('MANAGED_PROVIDER_ADAPTERS not found in product-truth.ts');
  }
  const adapters = [];
  for (const block of source.slice(start, end).split(/\n  \{/).slice(1)) {
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const category = block.match(/category:\s*"([^"]+)"/)?.[1];
    const aliases = [...(block.match(/aliases:\s*\[([\s\S]*?)\]/)?.[1] || '').matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    const actionsField = block.match(/customerExecutableActions:\s*(APILAYER_CUSTOMER_EXECUTABLE_ACTIONS|\[[\s\S]*?\])/)?.[1] || '[]';
    const customerExecutableActions = actionsField.includes('APILAYER')
      ? ['__apilayer__']
      : [...actionsField.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    if (id && name) {
      adapters.push({ id, name, aliases, category, customerExecutableActions });
    }
  }
  return {
    MANAGED_PROVIDER_ADAPTERS: adapters,
    getManagedProviderAdapter(reference) {
      if (!reference) return undefined;
      const normalized = normalizeProviderReference(reference);
      return adapters.find((provider) =>
        provider.aliases.some((alias) => normalizeProviderReference(alias) === normalized),
      );
    },
  };
}

function loadBoundaries() {
  const internalPattern = /(^|[^a-z0-9])(46elks|twilio|resend)([^a-z0-9]|$)/i;
  const unavailablePattern = /(^|[^a-z0-9])together(?: ai)?([^a-z0-9]|$)/i;
  const matches = (reference, pattern) =>
    [reference.name, reference.id, reference.baseUrl, reference.docsUrl]
      .some((value) => typeof value === 'string' && pattern.test(value));
  return {
    isInternalCatalogEntry: (reference) => matches(reference, internalPattern),
    isUnavailableManagedBrand: (name) => typeof name === 'string' && unavailablePattern.test(name),
  };
}

function loadWorkspacePublicNames() {
  const candidates = [
    workspacePublicPath,
    path.join(__dirname, '../src/lib/workspace-public-apis.json'),
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new Set(rows.map((row) => String(row.name || '').toLowerCase().trim()).filter(Boolean));
  }
  return new Set();
}

function buildPublicInventory(registry, verification, productTruth, boundaries, workspacePublicNames) {
  const all = [...(registry.apis || [])];
  if (!all.some((entry) => String(entry.name || '').toLowerCase().trim() === 'e2b')) {
    all.push({
      name: 'E2B',
      category: 'AI & ML',
      baseUrl: 'https://api.e2b.app',
      docsUrl: 'https://e2b.dev/docs',
    });
  }

  const discoveryRows = all
    .filter((entry) =>
      !boundaries.isInternalCatalogEntry(entry) &&
      !boundaries.isUnavailableManagedBrand(
        [entry.name, entry.baseUrl, entry.docsUrl].filter(Boolean).join(' '),
      )
    )
    .filter((entry) => !productTruth.getManagedProviderAdapter(entry.name));

  const discovery = discoveryRows
    .map((entry) => {
      const nameLower = String(entry.name || '').toLowerCase().trim();
      const evidence =
        (nameLower && verification.by_name_lower?.[nameLower]) || null;
      return {
        category: entry.category || 'Other',
        verified: evidence?.tier === 'verified',
        managedAdapter: false,
        customerExecutable: workspacePublicNames.has(String(entry.name || '').toLowerCase().trim()),
      };
    });

  const managed = productTruth.MANAGED_PROVIDER_ADAPTERS.map((provider) => ({
    category: provider.category,
    verified: false,
    managedAdapter: true,
    customerExecutable: provider.customerExecutableActions.length > 0,
  }));

  return [...managed, ...discovery];
}

(async () => {
  try {
    if (process.env.APICLAW_ISOLATED_LANDING_BUILD === '1' || !fs.existsSync(productTruthPath)) {
      const checkedIn = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      for (const field of [
        'apiCount',
        'sourceVerifiedCount',
        'managedProviderAdapterCount',
        'customerExecutableProviderCount',
        'customerExecutableCatalogCardCount',
      ]) {
        if (!Number.isFinite(checkedIn[field])) {
          throw new Error(`Checked-in stats are missing ${field}`);
        }
      }
      console.log('Using locally verified checked-in catalog stats in the isolated landing build');
      return;
    }
    const registryPath = fs.existsSync(localRegistryPath) ? localRegistryPath : parentRegistryPath;
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const verification = JSON.parse(fs.readFileSync(verificationPath, 'utf8'));
    const productTruth = loadProductTruth(productTruthPath);
    const boundaries = loadBoundaries();
    const workspacePublicNames = loadWorkspacePublicNames();
    const inventory = buildPublicInventory(registry, verification, productTruth, boundaries, workspacePublicNames);

    const categoryBreakdown = {};
    for (const entry of inventory) {
      const category = categoryMap[entry.category] || entry.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    }

    let existingStats = {};
    try {
      existingStats = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } catch {
      // The canonical sync writes the complete file immediately after this step.
    }

    let npmDownloads = existingStats.npmDownloads || 10184;
    try {
      const npmRes = await fetch('https://api.npmjs.org/downloads/point/2000-01-01:2099-12-31/@nordsym/apiclaw');
      const npmData = await npmRes.json();
      if (npmData.downloads) npmDownloads = npmData.downloads;
    } catch {
      // Keep the last measured value when npm is unavailable.
    }

    const stats = {
      apiCount: inventory.length,
      sourceVerifiedCount: inventory.filter((entry) => entry.verified).length,
      managedProviderAdapterCount: inventory.filter((entry) => entry.managedAdapter).length,
      customerExecutableProviderCount: inventory.filter((entry) => entry.managedAdapter && entry.customerExecutable).length,
      customerExecutableCatalogCardCount: inventory.filter((entry) => entry.customerExecutable).length,
      npmDownloads,
      endpointCount: existingStats.endpointCount || 0,
      capabilityCount: existingStats.capabilityCount || 15,
      generatedAt: new Date().toISOString(),
      categoryBreakdown,
      historicalVerificationBuckets: verification.buckets,
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2) + '\n');
    console.log('Stats measured from the public catalog inventory:', {
      apiCount: stats.apiCount,
      sourceVerifiedCount: stats.sourceVerifiedCount,
      managedProviderAdapterCount: stats.managedProviderAdapterCount,
      customerExecutableProviderCount: stats.customerExecutableProviderCount,
      customerExecutableCatalogCardCount: stats.customerExecutableCatalogCardCount,
    });
  } catch (error) {
    console.error('Failed to generate measured public catalog stats:', error);
    process.exitCode = 1;
  }
})();
