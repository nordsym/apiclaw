// Discovery engine for APIvault
// MVP: Keyword matching. Future: Embeddings + semantic search

import { APIProvider, SearchResult, APIDetailsResponse } from './types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getConnectedProviders } from './execute.js';
import { openAPIs, isOpenAPI } from './open-apis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apisData = JSON.parse(
  readFileSync(join(__dirname, 'registry', 'apis.json'), 'utf-8')
);
const apis: APIProvider[] = apisData.apis;

// Direct Call provider specs (hardcoded handlers with params)
// Ordered: AI-first (models, LLM routing, audio), then infrastructure (code, web, search, email, SMS)
const DIRECT_CALL_SPECS: Record<string, {
  description: string;
  auth: string;
  docs: string;
  actions: Record<string, { params: { name: string; required: boolean; desc: string }[]; desc: string }>;
}> = {
  openrouter: {
    description: 'LLM routing (100+ models)',
    auth: 'bearer',
    docs: 'https://openrouter.ai/docs',
    actions: {
      chat: {
        desc: 'Chat completion',
        params: [
          { name: 'messages', required: true, desc: 'Array of {role, content}' },
          { name: 'model', required: false, desc: 'Model ID (default: claude-3-haiku)' },
          { name: 'max_tokens', required: false, desc: 'Max response tokens (default: 1000)' },
        ],
      },
    },
  },
  replicate: {
    description: 'Run any AI model (images, video, audio)',
    auth: 'bearer',
    docs: 'https://replicate.com/docs',
    actions: {
      run: {
        desc: 'Run a model',
        params: [
          { name: 'model', required: true, desc: 'Model ID (e.g., stability-ai/sdxl:...)' },
          { name: 'input', required: true, desc: 'Model input parameters' },
        ],
      },
      list_models: {
        desc: 'List available models',
        params: [],
      },
    },
  },
  elevenlabs: {
    description: 'Text-to-speech',
    auth: 'api_key',
    docs: 'https://elevenlabs.io/docs',
    actions: {
      text_to_speech: {
        desc: 'Generate audio from text',
        params: [
          { name: 'text', required: true, desc: 'Text to speak' },
          { name: 'voice_id', required: false, desc: 'Voice ID (default: Rachel)' },
          { name: 'model_id', required: false, desc: 'Model ID' },
        ],
      },
    },
  },
  e2b: {
    description: 'Code sandbox for AI agents',
    auth: 'api_key',
    docs: 'https://e2b.dev/docs',
    actions: {
      run_code: {
        desc: 'Execute code in sandbox',
        params: [
          { name: 'code', required: true, desc: 'Code to run' },
          { name: 'language', required: false, desc: 'Language (default: python)' },
        ],
      },
      run_shell: {
        desc: 'Execute shell command',
        params: [
          { name: 'command', required: true, desc: 'Shell command' },
        ],
      },
    },
  },
  firecrawl: {
    description: 'Web scraping and crawling',
    auth: 'bearer',
    docs: 'https://firecrawl.dev/docs',
    actions: {
      scrape: {
        desc: 'Scrape a URL',
        params: [
          { name: 'url', required: true, desc: 'URL to scrape' },
          { name: 'formats', required: false, desc: 'Output formats (default: ["markdown"])' },
        ],
      },
      crawl: {
        desc: 'Start a crawl job',
        params: [
          { name: 'url', required: true, desc: 'Starting URL' },
          { name: 'limit', required: false, desc: 'Max pages (default: 10)' },
        ],
      },
      map: {
        desc: 'Map site structure',
        params: [
          { name: 'url', required: true, desc: 'URL to map' },
        ],
      },
    },
  },
  github: {
    description: 'Code repos and developer data',
    auth: 'bearer',
    docs: 'https://docs.github.com/rest',
    actions: {
      search_repos: {
        desc: 'Search repositories',
        params: [
          { name: 'query', required: true, desc: 'Search query' },
          { name: 'sort', required: false, desc: 'Sort by (default: stars)' },
          { name: 'limit', required: false, desc: 'Max results (default: 10)' },
        ],
      },
      get_repo: {
        desc: 'Get repo details',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
        ],
      },
      list_issues: {
        desc: 'List issues',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
          { name: 'state', required: false, desc: 'State filter (default: open)' },
        ],
      },
      create_issue: {
        desc: 'Create issue',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
          { name: 'title', required: true, desc: 'Issue title' },
          { name: 'body', required: false, desc: 'Issue body' },
        ],
      },
      get_file: {
        desc: 'Get file contents',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
          { name: 'path', required: true, desc: 'File path' },
        ],
      },
    },
  },
  brave_search: {
    description: 'Web search API',
    auth: 'api_key',
    docs: 'https://api.search.brave.com/docs',
    actions: {
      search: {
        desc: 'Search the web',
        params: [
          { name: 'query', required: true, desc: 'Search query' },
          { name: 'count', required: false, desc: 'Number of results (default: 5)' },
        ],
      },
    },
  },
  resend: {
    description: 'Email API',
    auth: 'bearer',
    docs: 'https://resend.com/docs',
    actions: {
      send_email: {
        desc: 'Send email',
        params: [
          { name: 'to', required: true, desc: 'Recipient email' },
          { name: 'subject', required: true, desc: 'Email subject' },
          { name: 'html', required: false, desc: 'HTML body' },
          { name: 'text', required: false, desc: 'Plain text body' },
          { name: 'from', required: false, desc: 'Sender (default: noreply@apiclaw.cloud)' },
        ],
      },
    },
  },
  '46elks': {
    description: 'Swedish SMS and voice API',
    auth: 'basic',
    docs: 'https://46elks.com/docs',
    actions: {
      send_sms: {
        desc: 'Send SMS message',
        params: [
          { name: 'to', required: true, desc: 'Phone number (+46...)' },
          { name: 'message', required: true, desc: 'SMS text (max 160 chars for 1 segment)' },
          { name: 'from', required: false, desc: 'Sender ID (default: APIClaw)' },
        ],
      },
    },
  },
  twilio: {
    description: 'Global SMS and voice API',
    auth: 'basic',
    docs: 'https://www.twilio.com/docs',
    actions: {
      send_sms: {
        desc: 'Send SMS message',
        params: [
          { name: 'to', required: true, desc: 'Phone number (E.164 format)' },
          { name: 'message', required: true, desc: 'SMS text' },
          { name: 'from', required: false, desc: 'Sender phone number' },
        ],
      },
    },
  },
  apilayer: {
    description: 'APILayer marketplace — currency, news, scraping, PDFs, verification & more',
    auth: 'api_key',
    docs: 'https://apilayer.com',
    actions: {
      exchange_rates: {
        desc: 'Get live or historical currency exchange rates',
        params: [
          { name: 'base', required: false, desc: 'Base currency (default: USD)' },
          { name: 'symbols', required: false, desc: 'Comma-separated target currencies' },
          { name: 'date', required: false, desc: 'Historical date YYYY-MM-DD (omit for live)' },
        ],
      },
      market_data: {
        desc: 'End-of-day stock market data',
        params: [
          { name: 'symbols', required: true, desc: 'Stock ticker(s), comma-separated e.g. AAPL,MSFT' },
          { name: 'date_from', required: false, desc: 'Start date YYYY-MM-DD' },
          { name: 'date_to', required: false, desc: 'End date YYYY-MM-DD' },
        ],
      },
      aviation: {
        desc: 'Real-time flight data and tracking',
        params: [
          { name: 'flight_iata', required: false, desc: 'IATA flight number e.g. AA100' },
          { name: 'dep_iata', required: false, desc: 'Departure airport IATA code' },
          { name: 'arr_iata', required: false, desc: 'Arrival airport IATA code' },
        ],
      },
      pdf_generate: {
        desc: 'Generate PDF from URL or HTML',
        params: [
          { name: 'document_url', required: false, desc: 'URL to convert to PDF' },
          { name: 'document_html', required: false, desc: 'HTML string to convert (alternative to URL)' },
          { name: 'page_size', required: false, desc: 'Page size: A4, Letter, etc (default: A4)' },
        ],
      },
      screenshot: {
        desc: 'Capture full-page screenshot of any URL',
        params: [
          { name: 'url', required: true, desc: 'URL to screenshot' },
          { name: 'viewport', required: false, desc: 'Viewport size e.g. 1440x900 (default)' },
          { name: 'fullpage', required: false, desc: '1 for full page, 0 for viewport only (default: 0)' },
        ],
      },
      verify_email: {
        desc: 'Validate email address format and deliverability',
        params: [
          { name: 'email', required: true, desc: 'Email address to verify' },
        ],
      },
      verify_number: {
        desc: 'Validate and lookup phone number details',
        params: [
          { name: 'number', required: true, desc: 'Phone number in E.164 format e.g. +46701234567' },
        ],
      },
      vat_check: {
        desc: 'Validate EU VAT number',
        params: [
          { name: 'vat_number', required: true, desc: 'EU VAT number e.g. SE556012345601' },
        ],
      },
      world_news: {
        desc: 'Extract and analyze news articles from a URL',
        params: [
          { name: 'url', required: true, desc: 'URL of the news article to analyze' },
          { name: 'analyze', required: false, desc: 'Whether to analyze the news (default: true)' },
        ],
      },
      finance_news: {
        desc: 'Latest financial and stock market news',
        params: [
          { name: 'tickers', required: false, desc: 'Stock tickers comma-separated e.g. AAPL,TSLA' },
          { name: 'text', required: false, desc: 'Keyword filter' },
          { name: 'number', required: false, desc: 'Number of results (default: 5)' },
        ],
      },
      scrape: {
        desc: 'Advanced web scraper — returns clean page content',
        params: [
          { name: 'url', required: true, desc: 'URL to scrape' },
        ],
      },
      image_crop: {
        desc: 'Smart crop an image to specified dimensions',
        params: [
          { name: 'url', required: true, desc: 'Image URL to crop' },
          { name: 'width', required: false, desc: 'Target width in pixels' },
          { name: 'height', required: false, desc: 'Target height in pixels' },
        ],
      },
      skills: {
        desc: 'Search 7000+ professional skills database',
        params: [
          { name: 'q', required: true, desc: 'Skill search query e.g. "machine learning"' },
          { name: 'count', required: false, desc: 'Number of results (default: 10)' },
        ],
      },
      form_submit: {
        desc: 'Submit form data to a FormAPI endpoint',
        params: [
          { name: 'endpoint', required: true, desc: 'FormAPI endpoint path' },
          { name: 'data', required: false, desc: 'Form data object to submit' },
        ],
      },
    },
  },
};

/**
 * Discover APIs based on a natural language query
 * MVP uses keyword matching; production would use embeddings
 */
export function discoverAPIs(
  query: string,
  options: {
    category?: string;
    maxResults?: number;
    maxPrice?: number;
    region?: string;
  } = {}
): SearchResult[] {
  const { category, maxResults = 5, maxPrice, region } = options;
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const results: SearchResult[] = [];
  
  for (const api of apis) {
    // Category filter
    if (category && api.category !== category) continue;
    
    // Region filter
    if (region && api.regions && !api.regions.includes(region) && !api.regions.includes('global')) continue;
    
    // Calculate relevance score
    let score = 0;
    const matchReasons: string[] = [];
    
    // Check keywords
    for (const word of queryWords) {
      // Direct keyword match
      if (api.keywords?.some(k => k.includes(word))) {
        score += 10;
        matchReasons.push(`keyword: ${word}`);
      }
      
      // Capability match
      if (api.capabilities?.some(c => c.includes(word))) {
        score += 15;
        matchReasons.push(`capability: ${word}`);
      }
      
      // Name match
      if (api.name.toLowerCase().includes(word)) {
        score += 20;
        matchReasons.push(`name: ${word}`);
      }
      
      // Description match
      if (api.description.toLowerCase().includes(word)) {
        score += 5;
        matchReasons.push(`description: ${word}`);
      }
      
      // Feature match
      if (api.features?.some(f => f.toLowerCase().includes(word))) {
        score += 8;
        matchReasons.push(`feature: ${word}`);
      }
    }
    
    // Boost for high success rate (default to 0.8 if not set)
    score += (api.agent_success_rate ?? 0.8) * 10;
    
    // Boost for low latency (default to 500ms if not set)
    score += Math.max(0, (1000 - (api.avg_latency_ms ?? 500)) / 100);
    
    // Boost for free tier
    if (api.pricing?.free_tier) {
      score += 5;
      matchReasons.push('has free tier');
    }
    
    if (score > 0) {
      results.push({
        provider: api,
        relevance_score: Math.round(score * 100) / 100,
        match_reasons: [...new Set(matchReasons)]
      });
    }
  }
  
  // Sort by relevance
  results.sort((a, b) => b.relevance_score - a.relevance_score);
  
  return results.slice(0, maxResults);
}

/**
 * Get detailed information about a specific API
 * @param apiId - The API provider ID
 * @param options.compact - If true, returns minified spec (saves ~60% tokens)
 */
export function getAPIDetails(
  apiId: string, 
  options: { compact?: boolean } = {}
): APIDetailsResponse | null {
  const { compact = false } = options;
  
  // Check if it's a Direct Call provider (hardcoded handlers)
  const directSpec = DIRECT_CALL_SPECS[apiId];
  if (directSpec) {
    if (compact) {
      // Minified format: ~60% smaller
      return {
        id: apiId,
        type: 'direct_call',
        desc: directSpec.description,
        auth: directSpec.auth,
        actions: Object.fromEntries(
          Object.entries(directSpec.actions).map(([action, info]) => [
            action,
            {
              params: info.params.map(p => 
                p.required ? p.name : `${p.name}?`
              ),
            },
          ])
        ),
      } as APIDetailsResponse;
    }
    
    return {
      id: apiId,
      type: 'direct_call',
      name: apiId,
      description: directSpec.description,
      auth_type: directSpec.auth,
      docs_url: directSpec.docs,
      direct_call: true,
      actions: Object.fromEntries(
        Object.entries(directSpec.actions).map(([action, info]) => [
          action,
          {
            description: info.desc,
            params: info.params,
          },
        ])
      ),
    } as APIDetailsResponse;
  }
  
  // Check if it's an Open API (free, no auth)
  if (isOpenAPI(apiId)) {
    const openApi = openAPIs[apiId];
    const actions = Object.keys(openApi.actions);
    
    if (compact) {
      return {
        id: apiId,
        type: 'open',
        desc: openApi.description,
        auth: 'none',
        actions: Object.fromEntries(
          actions.map(a => [a, { params: [] }])
        ),
      } as APIDetailsResponse;
    }
    
    return {
      id: apiId,
      type: 'open',
      name: openApi.name,
      description: openApi.description,
      auth_type: 'none',
      free: true,
      actions: Object.fromEntries(
        actions.map(a => [a, { description: `Execute ${a}`, params: [] }])
      ),
    } as APIDetailsResponse;
  }
  
  // Fall back to registry (19,000+ APIs - basic info only)
  const registryApi = apis.find(api => 
    api.id === apiId || 
    api.name?.toLowerCase() === apiId.toLowerCase()
  );
  
  if (!registryApi) {
    return null;
  }
  
  if (compact) {
    return {
      id: registryApi.id || registryApi.name,
      type: 'registry',
      desc: registryApi.description?.slice(0, 80),
      auth: registryApi.auth_type || (registryApi as any).auth || 'unknown',
      url: registryApi.base_url || (registryApi as any).baseUrl,
    } as APIDetailsResponse;
  }
  
  return {
    id: registryApi.id || registryApi.name,
    type: 'registry',
    name: registryApi.name,
    description: registryApi.description,
    category: registryApi.category,
    auth_type: registryApi.auth_type || (registryApi as any).auth,
    base_url: registryApi.base_url || (registryApi as any).baseUrl,
    docs_url: registryApi.docs_url || (registryApi as any).docsUrl,
    pricing: registryApi.pricing || (registryApi as any).pricing,
    note: 'Registry API - use call_api with customer_key or check docs for integration',
  } as APIDetailsResponse;
}

/**
 * List all APIs in a category
 */
export function listByCategory(category: string): APIProvider[] {
  return apis.filter(api => api.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  return [...new Set(apis.map(api => api.category))];
}

/**
 * Get all APIs
 */
export function getAllAPIs(): APIProvider[] {
  return apis;
}
