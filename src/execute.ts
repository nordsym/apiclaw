/**
 * APIClaw Direct Call - Execute API calls through connected providers
 */

import { getCredentials } from './credentials.js';
import { callProxy, PROXY_PROVIDERS } from './proxy.js';
import { executeDynamicAction, hasDynamicConfig, listDynamicActions } from './execute-dynamic.js';

// Re-export chain execution
export { executeChain } from './chainExecutor.js';
export type {
  ChainDefinition,
  ChainResult,
  ChainOptions,
  Credentials,
  StepTrace,
  ChainError,
} from './chainExecutor.js';
export {
  resolveReferences,
  validateReferences,
  extractReferences,
} from './chainResolver.js';
export type {
  ChainContext,
  ChainStep,
  ChainStepUnion,
  Reference,
  ValidationResult,
} from './chainResolver.js';

interface ExecuteResult {
  success: boolean;
  provider: string;
  action: string;
  data?: unknown;
  error?: string;
  code?: string;  // Structured error code (e.g., RATE_LIMITED, SERVICE_UNAVAILABLE)
  cost?: number;
  // Normalized top-level fields (extracted from data for convenience)
  url?: string;
  id?: string;
  content?: string;
  status?: string;
}

// Error codes for structured error responses
const ERROR_CODES = {
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',
  NO_CREDENTIALS: 'NO_CREDENTIALS',
  UNKNOWN_PROVIDER: 'UNKNOWN_PROVIDER',
  UNKNOWN_ACTION: 'UNKNOWN_ACTION',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
} as const;

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,  // Start with 1 second
  maxDelayMs: 30000,  // Cap at 30 seconds
  retryableStatusCodes: [429, 503, 502, 504],  // Rate limit + service unavailable variants
};

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Map HTTP status code to error code
 */
function statusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400: return ERROR_CODES.BAD_REQUEST;
    case 401: return ERROR_CODES.UNAUTHORIZED;
    case 403: return ERROR_CODES.FORBIDDEN;
    case 404: return ERROR_CODES.NOT_FOUND;
    case 429: return ERROR_CODES.RATE_LIMITED;
    case 502:
    case 503:
    case 504: return ERROR_CODES.SERVICE_UNAVAILABLE;
    default: return ERROR_CODES.PROVIDER_ERROR;
  }
}

/**
 * Check if a response status code is retryable
 */
function isRetryableStatus(status: number): boolean {
  return RETRY_CONFIG.retryableStatusCodes.includes(status);
}

/**
 * Fetch with automatic retry for transient failures (429, 503)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  context: { provider: string; action: string }
): Promise<Response> {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Check if we should retry
      if (isRetryableStatus(response.status) && attempt < RETRY_CONFIG.maxRetries) {
        lastResponse = response;
        const delay = calculateBackoff(attempt);
        
        // Check for Retry-After header
        const retryAfter = response.headers.get('Retry-After');
        const retryDelay = retryAfter 
          ? (parseInt(retryAfter) * 1000 || delay) 
          : delay;
        
        console.log(`[APIClaw] ${context.provider}/${context.action}: Got ${response.status}, retrying in ${Math.round(retryDelay)}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(Math.min(retryDelay, RETRY_CONFIG.maxDelayMs));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Retry on network errors
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = calculateBackoff(attempt);
        console.log(`[APIClaw] ${context.provider}/${context.action}: Network error, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        continue;
      }
    }
  }

  // If we have a response (even if error status), return it for proper error handling
  if (lastResponse) {
    return lastResponse;
  }

  // All retries exhausted with network errors
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Normalize response by extracting common fields to top-level
 * Makes it easier for agents to access key data without digging into provider-specific structures
 */
function normalizeResponse(result: ExecuteResult): ExecuteResult {
  if (!result.success || !result.data) return result;
  
  const data = result.data as Record<string, unknown>;
  const normalized: ExecuteResult = { ...result };
  
  // Extract URL (various field names across providers)
  const urlFields = ['url', 'audioUrl', 'audio_url', 'output_url', 'image_url', 'video_url', 'file_url', 'download_url'];
  for (const field of urlFields) {
    if (data[field] && typeof data[field] === 'string') {
      normalized.url = data[field] as string;
      break;
    }
  }
  // Handle array outputs (e.g., Replicate returns output: ["url1", "url2"])
  if (!normalized.url && Array.isArray(data.output) && data.output.length > 0 && typeof data.output[0] === 'string') {
    normalized.url = data.output[0];
  }
  
  // Extract ID
  const idFields = ['id', 'sid', 'message_id', 'prediction_id', 'job_id', 'request_id'];
  for (const field of idFields) {
    if (data[field] && (typeof data[field] === 'string' || typeof data[field] === 'number')) {
      normalized.id = String(data[field]);
      break;
    }
  }
  
  // Extract content (for LLM/text responses)
  const contentFields = ['content', 'text', 'message', 'response', 'output'];
  for (const field of contentFields) {
    if (data[field] && typeof data[field] === 'string') {
      normalized.content = data[field] as string;
      break;
    }
  }
  
  // Extract status
  const statusFields = ['status', 'state'];
  for (const field of statusFields) {
    if (data[field] && typeof data[field] === 'string') {
      normalized.status = data[field] as string;
      break;
    }
  }
  
  return normalized;
}

interface DryRunResult {
  dry_run: true;
  provider: string;
  action: string;
  would_send: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  mock_response: {
    success: boolean;
    data: unknown;
    estimated_cost?: string;
  };
  notes: string[];
}

// Mock response generators for dry-run mode
const mockResponses: Record<string, Record<string, (params: any) => unknown>> = {
  '46elks': {
    send_sms: (params) => ({
      id: 'mock_sms_' + Date.now(),
      to: params.to,
      from: params.from || 'APIClaw',
      message: params.message,
      status: 'delivered',
      cost: 5200, // ~0.52 SEK in microöre
    }),
  },
  twilio: {
    send_sms: (params) => ({
      sid: 'SMmock' + Date.now(),
      to: params.to,
      from: params.from || '+15017122661',
      body: params.message,
      status: 'queued',
    }),
  },
  brave_search: {
    search: (params) => ({
      query: params.query,
      results: [
        { title: 'Mock Result 1', url: 'https://example.com/1', description: 'This is a mock search result for dry-run testing.' },
        { title: 'Mock Result 2', url: 'https://example.com/2', description: 'Another mock result to simulate search.' },
      ],
      total: 2,
    }),
  },
  resend: {
    send_email: (params) => ({
      id: 'mock_email_' + Date.now(),
      to: params.to,
      from: params.from || 'APIClaw <noreply@apiclaw.nordsym.com>',
      subject: params.subject,
      status: 'sent',
    }),
  },
  openrouter: {
    chat: (params) => ({
      content: '[DRY-RUN] This is a mock response. In production, this would be generated by ' + (params.model || 'anthropic/claude-3-haiku'),
      model: params.model || 'anthropic/claude-3-haiku',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
  },
  elevenlabs: {
    text_to_speech: (params) => ({
      audio_base64: 'W0RSWV9SVU5fTU9DS19BVURJT10=', // "[DRY_RUN_MOCK_AUDIO]" in base64
      format: 'mp3',
      text_length: params.text?.length || 0,
    }),
  },
  replicate: {
    run: (params) => ({
      status: 'succeeded',
      output: ['https://example.com/mock-image.png'],
      model: params.model,
      metrics: { predict_time: 2.5 },
    }),
    list_models: () => ({
      models: [
        { name: 'stability-ai/sdxl', description: 'Mock model listing' },
      ],
      message: 'DRY-RUN: Would list available models',
    }),
  },
  firecrawl: {
    scrape: (params) => ({
      markdown: `# Mock Scrape of ${params.url}\n\nThis is a dry-run mock of scraped content.`,
      metadata: { title: 'Mock Page', url: params.url },
    }),
    crawl: (params) => ({
      id: 'crawl_mock_' + Date.now(),
      status: 'started',
      message: 'DRY-RUN: Crawl job would be started',
    }),
    map: (params) => ({
      links: ['https://example.com/page1', 'https://example.com/page2'],
    }),
  },
  github: {
    search_repos: (params) => ({
      total: 2,
      repos: [
        { name: 'mock/repo', description: 'Mock repository', stars: 100, url: 'https://github.com/mock/repo', language: 'TypeScript' },
      ],
    }),
    get_repo: (params) => ({
      name: `${params.owner}/${params.repo}`,
      description: 'Mock repository details',
      stars: 100,
      forks: 10,
      language: 'TypeScript',
      url: `https://github.com/${params.owner}/${params.repo}`,
    }),
    list_issues: () => ({
      issues: [{ number: 1, title: 'Mock Issue', state: 'open', user: 'mock-user' }],
    }),
    create_issue: (params) => ({
      number: 1,
      url: `https://github.com/${params.owner}/${params.repo}/issues/1`,
    }),
    get_file: (params) => ({
      name: params.path.split('/').pop(),
      path: params.path,
      size: 100,
      content: '// Mock file content for dry-run',
    }),
  },
  e2b: {
    run_code: (params) => ({
      text: 'DRY-RUN: Code would execute: ' + (params.code?.substring(0, 50) || ''),
      logs: { stdout: [], stderr: [] },
      results: [],
    }),
    run_shell: (params) => ({
      stdout: 'DRY-RUN: Would run: ' + params.command,
      stderr: '',
      exitCode: 0,
    }),
  },
};

// API endpoint info for dry-run
const apiEndpoints: Record<string, Record<string, { url: string; method: string; estimatedCost?: string }>> = {
  '46elks': {
    send_sms: { url: 'https://api.46elks.com/a1/sms', method: 'POST', estimatedCost: '~0.35-0.52 SEK' },
  },
  twilio: {
    send_sms: { url: 'https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json', method: 'POST', estimatedCost: '~$0.0079/SMS' },
  },
  brave_search: {
    search: { url: 'https://api.search.brave.com/res/v1/web/search', method: 'GET' },
  },
  resend: {
    send_email: { url: 'https://api.resend.com/emails', method: 'POST' },
  },
  openrouter: {
    chat: { url: 'https://openrouter.ai/api/v1/chat/completions', method: 'POST', estimatedCost: 'varies by model' },
  },
  elevenlabs: {
    text_to_speech: { url: 'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}', method: 'POST', estimatedCost: '~$0.30/1000 chars' },
  },
  replicate: {
    run: { url: 'https://api.replicate.com/v1/predictions', method: 'POST', estimatedCost: 'varies by model' },
    list_models: { url: 'https://api.replicate.com/v1/models', method: 'GET' },
  },
  firecrawl: {
    scrape: { url: 'https://api.firecrawl.dev/v1/scrape', method: 'POST' },
    crawl: { url: 'https://api.firecrawl.dev/v1/crawl', method: 'POST' },
    map: { url: 'https://api.firecrawl.dev/v1/map', method: 'POST' },
  },
  github: {
    search_repos: { url: 'https://api.github.com/search/repositories', method: 'GET' },
    get_repo: { url: 'https://api.github.com/repos/{owner}/{repo}', method: 'GET' },
    list_issues: { url: 'https://api.github.com/repos/{owner}/{repo}/issues', method: 'GET' },
    create_issue: { url: 'https://api.github.com/repos/{owner}/{repo}/issues', method: 'POST' },
    get_file: { url: 'https://api.github.com/repos/{owner}/{repo}/contents/{path}', method: 'GET' },
  },
  e2b: {
    run_code: { url: 'https://api.e2b.dev/v1/sandboxes', method: 'POST' },
    run_shell: { url: 'https://api.e2b.dev/v1/sandboxes', method: 'POST' },
  },
};

/**
 * Generate a dry-run result showing what would be sent without making actual API calls
 */
export function generateDryRun(
  providerId: string,
  action: string,
  params: Record<string, any>
): DryRunResult {
  const endpoint = apiEndpoints[providerId]?.[action] || { url: 'unknown', method: 'POST' };
  const mockGen = mockResponses[providerId]?.[action];
  const mockData = mockGen ? mockGen(params) : { message: 'Mock response for ' + action };

  // Build what would be sent
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth header hints
  if (['46elks', 'twilio'].includes(providerId)) {
    headers['Authorization'] = 'Basic [base64(username:password)]';
  } else if (['brave_search'].includes(providerId)) {
    headers['X-Subscription-Token'] = '[API_KEY]';
  } else if (['resend', 'openrouter', 'replicate', 'firecrawl'].includes(providerId)) {
    headers['Authorization'] = 'Bearer [API_KEY]';
  } else if (providerId === 'elevenlabs') {
    headers['xi-api-key'] = '[API_KEY]';
  } else if (providerId === 'github') {
    headers['Authorization'] = 'Bearer [GITHUB_TOKEN]';
    headers['User-Agent'] = 'APIClaw';
  }

  // Determine body based on method
  let body: unknown = undefined;
  if (endpoint.method === 'POST') {
    if (providerId === '46elks') {
      body = { from: params.from || 'APIClaw', to: params.to, message: params.message };
    } else if (providerId === 'twilio') {
      body = { From: params.from, To: params.to, Body: params.message };
    } else {
      body = params;
    }
  }

  const notes: string[] = [
    '⚠️ DRY-RUN MODE: No actual API call was made',
    'This shows what WOULD be sent if you remove dry_run: true',
  ];

  if (endpoint.estimatedCost) {
    notes.push(`Estimated cost: ${endpoint.estimatedCost}`);
  }

  return {
    dry_run: true,
    provider: providerId,
    action,
    would_send: {
      url: endpoint.url,
      method: endpoint.method,
      headers,
      ...(body ? { body } : {}),
    },
    mock_response: {
      success: true,
      data: mockData,
      ...(endpoint.estimatedCost ? { estimated_cost: endpoint.estimatedCost } : {}),
    },
    notes,
  };
}

/**
 * Create a structured error result with error code
 */
function createErrorResult(
  provider: string,
  action: string,
  error: string,
  code: ErrorCode,
  status?: number
): ExecuteResult {
  return {
    success: false,
    provider,
    action,
    error,
    code,
  };
}

// Helper to safely access properties
function safeGet(obj: unknown, ...keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

// Provider action handlers
const handlers: Record<string, Record<string, (params: any, creds: any) => Promise<ExecuteResult>>> = {
  
  // 46elks - Swedish SMS/Voice
  '46elks': {
    send_sms: async (params, creds) => {
      const { to, message, from = 'APIClaw' } = params;
      
      if (!to || !message) {
        return createErrorResult('46elks', 'send_sms', 'Missing required params: to, message', ERROR_CODES.INVALID_PARAMS);
      }

      const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
      
      const response = await fetchWithRetry('https://api.46elks.com/a1/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ from, to, message }),
      }, { provider: '46elks', action: 'send_sms' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('46elks', 'send_sms', (data.message as string) || 'SMS failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: '46elks', 
        action: 'send_sms',
        data: { id: data.id, to: data.to, cost: data.cost },
        cost: parseInt(String(data.cost)) / 10000000 // Convert microöre to SEK
      };
    },
  },

  // Twilio - Global SMS/Voice
  twilio: {
    send_sms: async (params, creds) => {
      const { to, message, from } = params;
      
      if (!to || !message) {
        return createErrorResult('twilio', 'send_sms', 'Missing required params: to, message', ERROR_CODES.INVALID_PARAMS);
      }

      const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
      const fromNumber = from || creds.from_number || '+15017122661';
      
      const response = await fetchWithRetry(
        `https://api.twilio.com/2010-04-01/Accounts/${creds.username}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: fromNumber, To: to, Body: message }),
        },
        { provider: 'twilio', action: 'send_sms' }
      );

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('twilio', 'send_sms', (data.message as string) || 'SMS failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'twilio', 
        action: 'send_sms',
        data: { sid: data.sid, to: data.to, status: data.status }
      };
    },
  },

  // Brave Search
  brave_search: {
    search: async (params, creds) => {
      const { query, count = 5 } = params;
      
      if (!query) {
        return createErrorResult('brave_search', 'search', 'Missing required param: query', ERROR_CODES.INVALID_PARAMS);
      }

      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', count.toString());

      const response = await fetchWithRetry(url.toString(), {
        headers: { 'X-Subscription-Token': creds.api_key },
      }, { provider: 'brave_search', action: 'search' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('brave_search', 'search', (data.message as string) || 'Search failed', statusToErrorCode(response.status));
      }

      const webData = data.web as Record<string, unknown> | undefined;
      const rawResults = (webData?.results as Array<Record<string, unknown>>) || [];
      const results = rawResults.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
      }));

      return { 
        success: true, 
        provider: 'brave_search', 
        action: 'search',
        data: { query, results, total: results.length }
      };
    },
  },

  // Resend - Email
  resend: {
    send_email: async (params, creds) => {
      const { to, subject, html, text, from = 'APIClaw <noreply@apiclaw.nordsym.com>' } = params;
      
      if (!to || !subject || (!html && !text)) {
        return createErrorResult('resend', 'send_email', 'Missing required params: to, subject, html or text', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      }, { provider: 'resend', action: 'send_email' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('resend', 'send_email', (data.message as string) || 'Email failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'resend', 
        action: 'send_email',
        data: { id: data.id }
      };
    },
  },

  // OpenRouter - AI Models
  openrouter: {
    chat: async (params, creds) => {
      const { messages, model = 'anthropic/claude-3-haiku', max_tokens = 1000 } = params;
      
      if (!messages || !Array.isArray(messages)) {
        return createErrorResult('openrouter', 'chat', 'Missing required param: messages (array)', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://apiclaw.nordsym.com',
        },
        body: JSON.stringify({ model, messages, max_tokens }),
      }, { provider: 'openrouter', action: 'chat' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        const errorData = data.error as Record<string, unknown> | undefined;
        return createErrorResult('openrouter', 'chat', (errorData?.message as string) || 'Chat failed', statusToErrorCode(response.status));
      }

      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const firstChoice = choices?.[0];
      const message = firstChoice?.message as Record<string, unknown> | undefined;

      return { 
        success: true, 
        provider: 'openrouter', 
        action: 'chat',
        data: { 
          content: message?.content,
          model: data.model,
          usage: data.usage 
        }
      };
    },
  },

  // ElevenLabs - Text-to-Speech
  elevenlabs: {
    text_to_speech: async (params, creds) => {
      const { text, voice_id = '21m00Tcm4TlvDq8ikWAM', model_id = 'eleven_monolingual_v1' } = params;
      
      if (!text) {
        return createErrorResult('elevenlabs', 'text_to_speech', 'Missing required param: text', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': creds.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, model_id }),
        },
        { provider: 'elevenlabs', action: 'text_to_speech' }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as Record<string, unknown>;
        return createErrorResult('elevenlabs', 'text_to_speech', (error.detail as string) || 'TTS failed', statusToErrorCode(response.status));
      }

      // Return audio as base64
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      return { 
        success: true, 
        provider: 'elevenlabs', 
        action: 'text_to_speech',
        data: { 
          audio_base64: base64,
          format: 'mp3',
          text_length: text.length
        }
      };
    },
  },

  // Replicate - Run any AI model (images, audio, video, text)
  replicate: {
    run: async (params, creds) => {
      const { model, input } = params;
      
      if (!model) {
        return createErrorResult('replicate', 'run', 'Missing required param: model (e.g., "stability-ai/sdxl:...")', ERROR_CODES.INVALID_PARAMS);
      }
      if (!input) {
        return createErrorResult('replicate', 'run', 'Missing required param: input (object with model inputs)', ERROR_CODES.INVALID_PARAMS);
      }

      // Parse model into owner/name and version
      const [modelPath, version] = model.split(':');
      
      // Create prediction
      const response = await fetchWithRetry('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: version || undefined,
          model: version ? undefined : modelPath,
          input,
        }),
      }, { provider: 'replicate', action: 'run' });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as Record<string, unknown>;
        return createErrorResult('replicate', 'run', (error.detail as string) || 'Prediction failed', statusToErrorCode(response.status));
      }

      const prediction = await response.json() as Record<string, unknown>;
      
      // Poll for completion (max 60 seconds)
      let result = prediction;
      const startTime = Date.now();
      while (result.status === 'starting' || result.status === 'processing') {
        if (Date.now() - startTime > 60000) {
          return { 
            success: true, 
            provider: 'replicate', 
            action: 'run',
            data: { 
              status: 'pending',
              prediction_id: result.id,
              message: 'Prediction still running. Use prediction_id to check status.',
              urls: result.urls
            }
          };
        }
        await sleep(1000);
        const pollResponse = await fetchWithRetry((result.urls as Record<string, string>)?.get || `https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Bearer ${creds.api_key}` },
        }, { provider: 'replicate', action: 'run_poll' });
        result = await pollResponse.json() as Record<string, unknown>;
      }

      if (result.status === 'failed') {
        return createErrorResult('replicate', 'run', (result.error as string) || 'Prediction failed', ERROR_CODES.PROVIDER_ERROR);
      }

      return { 
        success: true, 
        provider: 'replicate', 
        action: 'run',
        data: { 
          status: result.status,
          output: result.output,
          model: modelPath,
          metrics: result.metrics
        }
      };
    },

    list_models: async (_params, creds) => {
      const response = await fetchWithRetry('https://api.replicate.com/v1/models', {
        headers: { 'Authorization': `Bearer ${creds.api_key}` },
      }, { provider: 'replicate', action: 'list_models' });

      if (!response.ok) {
        return createErrorResult('replicate', 'list_models', 'Failed to list models', statusToErrorCode(response.status));
      }

      const data = await response.json() as Record<string, unknown>;
      
      return { 
        success: true, 
        provider: 'replicate', 
        action: 'list_models',
        data: { 
          models: data.results,
          message: 'Use model owner/name with run action. Popular: stability-ai/sdxl, meta/llama-2-70b-chat, openai/whisper'
        }
      };
    },
  },

  // Firecrawl - Web scraping and crawling
  firecrawl: {
    scrape: async (params, creds) => {
      const { url, formats = ['markdown'] } = params;
      
      if (!url) {
        return createErrorResult('firecrawl', 'scrape', 'Missing required param: url', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, formats }),
      }, { provider: 'firecrawl', action: 'scrape' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok || !data.success) {
        return createErrorResult('firecrawl', 'scrape', (data.error as string) || 'Scrape failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'firecrawl', 
        action: 'scrape',
        data: data.data,
      };
    },

    crawl: async (params, creds) => {
      const { url, limit = 10 } = params;
      
      if (!url) {
        return createErrorResult('firecrawl', 'crawl', 'Missing required param: url', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, limit }),
      }, { provider: 'firecrawl', action: 'crawl' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok || !data.success) {
        return createErrorResult('firecrawl', 'crawl', (data.error as string) || 'Crawl failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'firecrawl', 
        action: 'crawl',
        data: { id: data.id, status: 'started', message: 'Crawl job started. Poll status with crawl_status action.' },
      };
    },

    map: async (params, creds) => {
      const { url } = params;
      
      if (!url) {
        return createErrorResult('firecrawl', 'map', 'Missing required param: url', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      }, { provider: 'firecrawl', action: 'map' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok || !data.success) {
        return createErrorResult('firecrawl', 'map', (data.error as string) || 'Map failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'firecrawl', 
        action: 'map',
        data: { links: data.links },
      };
    },
  },

  // GitHub - Code & Repos
  github: {
    search_repos: async (params, creds) => {
      const { query, sort = 'stars', limit = 10 } = params;
      
      if (!query) {
        return createErrorResult('github', 'search_repos', 'Missing required param: query', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      }, { provider: 'github', action: 'search_repos' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('github', 'search_repos', (data.message as string) || 'Search failed', statusToErrorCode(response.status));
      }

      const items = (data.items as any[]) || [];
      return { 
        success: true, 
        provider: 'github', 
        action: 'search_repos',
        data: { 
          total: data.total_count,
          repos: items.slice(0, limit).map(r => ({
            name: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            url: r.html_url,
            language: r.language,
          }))
        },
      };
    },

    get_repo: async (params, creds) => {
      const { owner, repo } = params;
      
      if (!owner || !repo) {
        return createErrorResult('github', 'get_repo', 'Missing required params: owner, repo', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      }, { provider: 'github', action: 'get_repo' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('github', 'get_repo', (data.message as string) || 'Get repo failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'github', 
        action: 'get_repo',
        data: {
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          url: data.html_url,
          created: data.created_at,
          updated: data.updated_at,
        },
      };
    },

    list_issues: async (params, creds) => {
      const { owner, repo, state = 'open', limit = 10 } = params;
      
      if (!owner || !repo) {
        return createErrorResult('github', 'list_issues', 'Missing required params: owner, repo', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${limit}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      }, { provider: 'github', action: 'list_issues' });

      const data = await response.json() as unknown[];
      
      if (!response.ok) {
        return createErrorResult('github', 'list_issues', 'List issues failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'github', 
        action: 'list_issues',
        data: { 
          issues: (data as any[]).map(i => ({
            number: i.number,
            title: i.title,
            state: i.state,
            user: i.user?.login,
            url: i.html_url,
            created: i.created_at,
          }))
        },
      };
    },

    create_issue: async (params, creds) => {
      const { owner, repo, title, body = '' } = params;
      
      if (!owner || !repo || !title) {
        return createErrorResult('github', 'create_issue', 'Missing required params: owner, repo, title', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body }),
      }, { provider: 'github', action: 'create_issue' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('github', 'create_issue', (data.message as string) || 'Create issue failed', statusToErrorCode(response.status));
      }

      return { 
        success: true, 
        provider: 'github', 
        action: 'create_issue',
        data: { 
          number: data.number,
          url: data.html_url,
        },
      };
    },

    get_file: async (params, creds) => {
      const { owner, repo, path } = params;
      
      if (!owner || !repo || !path) {
        return createErrorResult('github', 'get_file', 'Missing required params: owner, repo, path', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      }, { provider: 'github', action: 'get_file' });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return createErrorResult('github', 'get_file', (data.message as string) || 'Get file failed', statusToErrorCode(response.status));
      }

      // Decode base64 content
      const content = data.content ? Buffer.from(data.content as string, 'base64').toString('utf-8') : null;

      return { 
        success: true, 
        provider: 'github', 
        action: 'get_file',
        data: { 
          name: data.name,
          path: data.path,
          size: data.size,
          content,
        },
      };
    },
  },

  // E2B - Code Sandbox for AI Agents
  // Uses @e2b/code-interpreter SDK
  e2b: {
    run_code: async (params, creds) => {
      const { code, language = 'python' } = params;
      
      if (!code) {
        return createErrorResult('e2b', 'run_code', 'Missing required param: code', ERROR_CODES.INVALID_PARAMS);
      }

      try {
        // Dynamic import to avoid issues if SDK not installed
        const { Sandbox } = await import('@e2b/code-interpreter');
        
        // Set API key via env (SDK reads from E2B_API_KEY)
        process.env.E2B_API_KEY = creds.api_key;
        
        const sandbox = await Sandbox.create();
        
        try {
          const execution = await sandbox.runCode(code);
          
          return { 
            success: true, 
            provider: 'e2b', 
            action: 'run_code',
            data: { 
              text: execution.text,
              logs: execution.logs,
              results: execution.results,
            },
          };
        } finally {
          await sandbox.kill().catch(() => {});
        }
      } catch (error: any) {
        return createErrorResult('e2b', 'run_code', error.message || 'Code execution failed', ERROR_CODES.PROVIDER_ERROR);
      }
    },

    run_shell: async (params, creds) => {
      const { command } = params;
      
      if (!command) {
        return createErrorResult('e2b', 'run_shell', 'Missing required param: command', ERROR_CODES.INVALID_PARAMS);
      }

      try {
        const { Sandbox } = await import('@e2b/code-interpreter');
        
        process.env.E2B_API_KEY = creds.api_key;
        
        const sandbox = await Sandbox.create();
        
        try {
          const result = await sandbox.commands.run(command);
          
          return { 
            success: true, 
            provider: 'e2b', 
            action: 'run_shell',
            data: { 
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode,
            },
          };
        } finally {
          await sandbox.kill().catch(() => {});
        }
      } catch (error: any) {
        return createErrorResult('e2b', 'run_shell', error.message || 'Shell execution failed', ERROR_CODES.PROVIDER_ERROR);
      }
    },
  },

  // Groq - Ultra-fast LLM inference
  groq: {
    chat: async (params, creds) => {
      const { messages, model = 'llama3-8b-8192', max_tokens = 1024 } = params;

      if (!messages || !Array.isArray(messages)) {
        return createErrorResult('groq', 'chat', 'Missing required param: messages (array)', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens }),
      }, { provider: 'groq', action: 'chat' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        const err = data.error as Record<string, unknown> | undefined;
        return createErrorResult('groq', 'chat', (err?.message as string) || 'Chat failed', statusToErrorCode(response.status));
      }

      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const message = choices?.[0]?.message as Record<string, unknown> | undefined;

      return {
        success: true,
        provider: 'groq',
        action: 'chat',
        data: {
          content: message?.content,
          model: data.model,
          usage: data.usage,
        },
      };
    },
  },

  // Deepgram - Speech-to-text transcription
  deepgram: {
    transcribe: async (params, creds) => {
      const { url, model = 'nova-2', language = 'en' } = params;

      if (!url) {
        return createErrorResult('deepgram', 'transcribe', 'Missing required param: url (audio file URL)', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      }, { provider: 'deepgram', action: 'transcribe' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return createErrorResult('deepgram', 'transcribe', (data.err_msg as string) || 'Transcription failed', statusToErrorCode(response.status));
      }

      const results = data.results as Record<string, unknown> | undefined;
      const channels = results?.channels as Array<Record<string, unknown>> | undefined;
      const alternatives = channels?.[0]?.alternatives as Array<Record<string, unknown>> | undefined;
      const transcript = alternatives?.[0]?.transcript as string | undefined;

      return {
        success: true,
        provider: 'deepgram',
        action: 'transcribe',
        data: {
          transcript,
          confidence: alternatives?.[0]?.confidence,
          duration: (data.metadata as Record<string, unknown> | undefined)?.duration,
        },
      };
    },
  },

  // Serper - Google Search API for AI
  serper: {
    search: async (params, creds) => {
      const { query, num = 10, gl = 'us', hl = 'en' } = params;

      if (!query) {
        return createErrorResult('serper', 'search', 'Missing required param: query', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': creds.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num, gl, hl }),
      }, { provider: 'serper', action: 'search' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return createErrorResult('serper', 'search', (data.message as string) || 'Search failed', statusToErrorCode(response.status));
      }

      const organic = (data.organic as Array<Record<string, unknown>>) || [];

      return {
        success: true,
        provider: 'serper',
        action: 'search',
        data: {
          query,
          results: organic.map(r => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
            position: r.position,
          })),
          total: organic.length,
          answerBox: data.answerBox,
          knowledgeGraph: data.knowledgeGraph,
        },
      };
    },
  },

  // Mistral - Open-weight LLMs
  mistral: {
    chat: async (params, creds) => {
      const { messages, model = 'mistral-small-latest', max_tokens = 1024 } = params;

      if (!messages || !Array.isArray(messages)) {
        return createErrorResult('mistral', 'chat', 'Missing required param: messages (array)', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens }),
      }, { provider: 'mistral', action: 'chat' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        const err = data.message as string | undefined;
        return createErrorResult('mistral', 'chat', err || 'Chat failed', statusToErrorCode(response.status));
      }

      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const message = choices?.[0]?.message as Record<string, unknown> | undefined;

      return {
        success: true,
        provider: 'mistral',
        action: 'chat',
        data: {
          content: message?.content,
          model: data.model,
          usage: data.usage,
        },
      };
    },

    embed: async (params, creds) => {
      const { input, model = 'mistral-embed' } = params;

      if (!input) {
        return createErrorResult('mistral', 'embed', 'Missing required param: input (string or array)', ERROR_CODES.INVALID_PARAMS);
      }

      const inputs = Array.isArray(input) ? input : [input];

      const response = await fetchWithRetry('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, input: inputs }),
      }, { provider: 'mistral', action: 'embed' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return createErrorResult('mistral', 'embed', (data.message as string) || 'Embedding failed', statusToErrorCode(response.status));
      }

      const embedData = data.data as Array<Record<string, unknown>> | undefined;

      return {
        success: true,
        provider: 'mistral',
        action: 'embed',
        data: {
          embeddings: embedData?.map(d => d.embedding),
          model: data.model,
          usage: data.usage,
        },
      };
    },
  },

  // Cohere - Enterprise NLP and embeddings
  cohere: {
    chat: async (params, creds) => {
      const { message, model = 'command-r', max_tokens = 1024, preamble } = params;

      if (!message) {
        return createErrorResult('cohere', 'chat', 'Missing required param: message', ERROR_CODES.INVALID_PARAMS);
      }

      const body: Record<string, unknown> = { model, message, max_tokens };
      if (preamble) body.preamble = preamble;

      const response = await fetchWithRetry('https://api.cohere.com/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, { provider: 'cohere', action: 'chat' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return createErrorResult('cohere', 'chat', (data.message as string) || 'Chat failed', statusToErrorCode(response.status));
      }

      return {
        success: true,
        provider: 'cohere',
        action: 'chat',
        data: {
          content: data.text,
          generation_id: data.generation_id,
          usage: data.meta,
        },
      };
    },

    embed: async (params, creds) => {
      const { texts, model = 'embed-english-v3.0', input_type = 'search_document' } = params;

      if (!texts || !Array.isArray(texts)) {
        return createErrorResult('cohere', 'embed', 'Missing required param: texts (array of strings)', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.cohere.com/v1/embed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, texts, input_type }),
      }, { provider: 'cohere', action: 'embed' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return createErrorResult('cohere', 'embed', (data.message as string) || 'Embedding failed', statusToErrorCode(response.status));
      }

      return {
        success: true,
        provider: 'cohere',
        action: 'embed',
        data: {
          embeddings: data.embeddings,
          model: data.model,
        },
      };
    },
  },

  // Together AI - Open-source model inference
  together: {
    chat: async (params, creds) => {
      const { messages, model = 'meta-llama/Llama-3-8b-chat-hf', max_tokens = 1024 } = params;

      if (!messages || !Array.isArray(messages)) {
        return createErrorResult('together', 'chat', 'Missing required param: messages (array)', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens }),
      }, { provider: 'together', action: 'chat' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        const err = data.error as Record<string, unknown> | undefined;
        return createErrorResult('together', 'chat', (err?.message as string) || 'Chat failed', statusToErrorCode(response.status));
      }

      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const message = choices?.[0]?.message as Record<string, unknown> | undefined;

      return {
        success: true,
        provider: 'together',
        action: 'chat',
        data: {
          content: message?.content,
          model: data.model,
          usage: data.usage,
        },
      };
    },
  },

  // Stability AI - Image generation
  stability: {
    generate_image: async (params, creds) => {
      const { prompt, model = 'stable-diffusion-xl-1024-v1-0', width = 1024, height = 1024, steps = 30 } = params;

      if (!prompt) {
        return createErrorResult('stability', 'generate_image', 'Missing required param: prompt', ERROR_CODES.INVALID_PARAMS);
      }

      const response = await fetchWithRetry(`https://api.stability.ai/v1/generation/${model}/text-to-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt, weight: 1 }],
          width,
          height,
          steps,
          samples: 1,
        }),
      }, { provider: 'stability', action: 'generate_image' });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        return createErrorResult('stability', 'generate_image', (data.message as string) || 'Image generation failed', statusToErrorCode(response.status));
      }

      const artifacts = data.artifacts as Array<Record<string, unknown>> | undefined;
      const image = artifacts?.[0];

      return {
        success: true,
        provider: 'stability',
        action: 'generate_image',
        data: {
          image_base64: image?.base64,
          finish_reason: image?.finishReason,
          seed: image?.seed,
        },
      };
    },
  },

  // AssemblyAI - Audio transcription and intelligence
  assemblyai: {
    transcribe: async (params, creds) => {
      const { audio_url, language_code = 'en', speaker_labels = false, sentiment_analysis = false } = params;

      if (!audio_url) {
        return createErrorResult('assemblyai', 'transcribe', 'Missing required param: audio_url', ERROR_CODES.INVALID_PARAMS);
      }

      // Submit transcription job
      const submitResponse = await fetchWithRetry('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': creds.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url, language_code, speaker_labels, sentiment_analysis }),
      }, { provider: 'assemblyai', action: 'transcribe' });

      const submitData = await submitResponse.json() as Record<string, unknown>;

      if (!submitResponse.ok) {
        return createErrorResult('assemblyai', 'transcribe', (submitData.error as string) || 'Submit failed', statusToErrorCode(submitResponse.status));
      }

      const transcriptId = submitData.id as string;

      // Poll until complete (max 120 seconds)
      const startTime = Date.now();
      while (Date.now() - startTime < 120000) {
        await sleep(3000);

        const pollResponse = await fetchWithRetry(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { 'Authorization': creds.api_key },
        }, { provider: 'assemblyai', action: 'transcribe_poll' });

        const pollData = await pollResponse.json() as Record<string, unknown>;

        if (pollData.status === 'completed') {
          return {
            success: true,
            provider: 'assemblyai',
            action: 'transcribe',
            data: {
              transcript: pollData.text,
              words: pollData.words,
              utterances: pollData.utterances,
              sentiment_analysis_results: pollData.sentiment_analysis_results,
              audio_duration: pollData.audio_duration,
            },
          };
        }

        if (pollData.status === 'error') {
          return createErrorResult('assemblyai', 'transcribe', (pollData.error as string) || 'Transcription failed', ERROR_CODES.PROVIDER_ERROR);
        }
      }

      return {
        success: true,
        provider: 'assemblyai',
        action: 'transcribe',
        data: {
          status: 'processing',
          transcript_id: transcriptId,
          message: 'Transcription still processing. Use transcript_id to poll manually.',
        },
      };
    },
  },
};

// Get available actions for a provider (static handlers only)
export function getProviderActions(providerId: string): string[] {
  return Object.keys(handlers[providerId] || {});
}

// Get available actions for a provider (includes dynamic providers)
export async function getProviderActionsAsync(providerId: string): Promise<string[]> {
  // First check static handlers
  const staticActions = Object.keys(handlers[providerId] || {});
  if (staticActions.length > 0) {
    return staticActions;
  }
  
  // Then check dynamic providers
  return listDynamicActions(providerId);
}

// Get all connected providers with their actions (static handlers only)
export function getConnectedProviders(): { provider: string; actions: string[] }[] {
  return Object.entries(handlers).map(([provider, actions]) => ({
    provider,
    actions: Object.keys(actions),
  }));
}

// Execute an API call
export async function executeAPICall(
  providerId: string, 
  action: string, 
  params: Record<string, any>,
  userId?: string,
  customerKey?: string
): Promise<ExecuteResult> {
  // Check for dynamic (self-service) provider config first
  if (userId) {
    const isDynamic = await hasDynamicConfig(providerId);
    if (isDynamic) {
      const dynamicResult = await executeDynamicAction(providerId, action, params, userId, customerKey);
      return normalizeResponse(dynamicResult);
    }
  }
  
  // Fall back to hardcoded handlers
  // Check if provider exists
  const providerHandlers = handlers[providerId];
  if (!providerHandlers) {
    // Check if it might be a dynamic provider without userId
    const dynamicActions = await listDynamicActions(providerId);
    if (dynamicActions.length > 0) {
      return createErrorResult(
        providerId,
        action,
        `Provider '${providerId}' requires userId for dynamic execution. Available actions: ${dynamicActions.join(', ')}`,
        ERROR_CODES.INVALID_PARAMS
      );
    }
    return createErrorResult(
      providerId,
      action,
      `Provider '${providerId}' not connected. Available: ${Object.keys(handlers).join(', ')}`,
      ERROR_CODES.UNKNOWN_PROVIDER
    );
  }

  // Check if action exists
  const handler = providerHandlers[action];
  if (!handler) {
    return createErrorResult(
      providerId,
      action,
      `Action '${action}' not available for ${providerId}. Available: ${Object.keys(providerHandlers).join(', ')}`,
      ERROR_CODES.UNKNOWN_ACTION
    );
  }

  // Providers that don't require credentials (free/open APIs)
  const NO_CREDS_PROVIDERS = ['coingecko'];
  
  // Get credentials - customer key takes priority, then local secrets, then proxy
  // Set both apiKey and token so it works with different handler patterns (most use apiKey, GitHub uses token)
  let creds = customerKey ? { apiKey: customerKey, api_key: customerKey, token: customerKey, apiSecret: '' } : getCredentials(providerId);
  const usingCustomerKey = !!customerKey;
  
  // For providers that don't need credentials, use empty creds
  if (!creds && NO_CREDS_PROVIDERS.includes(providerId)) {
    creds = { apiKey: '', api_key: '', token: '', apiSecret: '' };
  }
  
  if (!creds) {
    // Try proxy for supported providers
    if (PROXY_PROVIDERS.includes(providerId)) {
      try {
        const proxyResult = await callProxy(providerId, { action, ...params });
        return normalizeResponse({
          success: true,
          provider: providerId,
          action,
          data: proxyResult,
        });
      } catch (e: any) {
        return createErrorResult(providerId, action, e.message || 'Proxy call failed', ERROR_CODES.PROVIDER_ERROR);
      }
    }
    return createErrorResult(
      providerId,
      action,
      `No credentials configured for ${providerId}. Set up ~/.secrets/${providerId}.env`,
      ERROR_CODES.NO_CREDENTIALS
    );
  }

  // Execute and normalize response
  try {
    const result = await handler(params, creds);
    return normalizeResponse(result);
  } catch (error: any) {
    // Check if it's a network/timeout error
    const errorMessage = error.message || 'Unknown error';
    let errorCode: ErrorCode = ERROR_CODES.PROVIDER_ERROR;
    
    if (errorMessage.includes('Max retries exceeded')) {
      errorCode = ERROR_CODES.MAX_RETRIES_EXCEEDED;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      errorCode = ERROR_CODES.TIMEOUT;
    } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('fetch')) {
      errorCode = ERROR_CODES.NETWORK_ERROR;
    }
    
    return createErrorResult(providerId, action, errorMessage, errorCode);
  }
}
