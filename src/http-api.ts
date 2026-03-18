/**
 * APIClaw HTTP API Server
 * Provides REST endpoints for headless agents (Hivr bees, webhooks, etc)
 * 
 * Endpoints:
 * - GET  /api/discover?query=...&agentId=...
 * - POST /api/call_api { provider, action, params, agentId }
 * - GET  /health
 * 
 * Auth: Whitelist-based for Hivr bees
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { discoverAPIs } from './discovery.js';
import { isOpenAPI, executeOpenAPI } from './open-apis.js';
import { executeMetered } from './metered.js';
import { logAPICall } from './analytics.js';
import { getMachineFingerprint } from './session.js';

// Hivr bees whitelist - these agents get free unlimited access
const HIVR_BEES_WHITELIST = [
  'bytebee',
  'analyzerbee',
  'buildbee',
  'buzzwriter',
  'hivemind',
  'hivesage',
  'symbot',
  'hivrqueen',
  'marketmaven',
  'reconbee',
  'sprintbee',
  'quillbee',
  // Add more as Hivr grows
];

interface APIRequest {
  provider: string;
  action: string;
  params: Record<string, any>;
  agentId: string;
}

/**
 * Check if agent is authorized (Hivr bee)
 */
function isAuthorized(agentId: string | undefined): boolean {
  if (!agentId) return false;
  const normalized = agentId.toLowerCase().trim();
  return HIVR_BEES_WHITELIST.includes(normalized);
}

/**
 * Parse JSON body from request
 */
async function parseBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res: ServerResponse, status: number, data: any): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Id',
  });
  res.end(JSON.stringify(data));
}

/**
 * Handle /api/discover
 * GET /api/discover?query=web+search&agentId=bytebee&category=Search&maxResults=5
 */
async function handleDiscover(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const query = url.searchParams.get('query');
  const agentId = url.searchParams.get('agentId');
  const category = url.searchParams.get('category') || undefined;
  const maxResults = parseInt(url.searchParams.get('maxResults') || '5');
  
  if (!query) {
    sendJSON(res, 400, { error: 'Missing query parameter' });
    return;
  }
  
  if (!isAuthorized(agentId || undefined)) {
    sendJSON(res, 403, { 
      error: 'Unauthorized', 
      message: 'This endpoint is restricted to Hivr bees. Contact admin@nordsym.com for access.',
    });
    return;
  }
  
  const startTime = Date.now();
  const results = discoverAPIs(query, { category, maxResults });
  const responseTimeMs = Date.now() - startTime;
  
  // Log to analytics
  logAPICall({
    timestamp: new Date().toISOString(),
    provider: 'apiclaw_discovery',
    action: 'discover',
    type: 'open',
    userId: `hivr:${agentId}`,
    success: true,
    latencyMs: responseTimeMs,
  });
  
  sendJSON(res, 200, {
    success: true,
    query,
    results: results.map(r => ({
      provider: r.provider,
      score: r.relevance_score,
      reasons: r.match_reasons,
    })),
    count: results.length,
    responseTimeMs,
  });
}

/**
 * Handle /api/call_api
 * POST /api/call_api
 * Body: { provider: "brave_search", action: "search", params: { query: "AI news" }, agentId: "bytebee" }
 */
async function handleCallAPI(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: APIRequest;
  
  try {
    body = await parseBody<APIRequest>(req);
  } catch (e) {
    sendJSON(res, 400, { error: 'Invalid JSON body' });
    return;
  }
  
  const { provider, action, params, agentId } = body;
  
  if (!provider || !action || !params || !agentId) {
    sendJSON(res, 400, { 
      error: 'Missing required fields', 
      required: ['provider', 'action', 'params', 'agentId'] 
    });
    return;
  }
  
  if (!isAuthorized(agentId)) {
    sendJSON(res, 403, { 
      error: 'Unauthorized', 
      message: 'This endpoint is restricted to Hivr bees. Contact admin@nordsym.com for access.',
    });
    return;
  }
  
  const startTime = Date.now();
  let result: any;
  let apiType: 'open' | 'direct';
  let success = true;
  let error: string | undefined;
  
  try {
    if (isOpenAPI(provider)) {
      apiType = 'open';
      result = await executeOpenAPI(provider, action, params);
      success = result.success;
      error = result.error;
    } else {
      apiType = 'direct';
      // For Direct Call APIs, use Hivr's workspace/credentials
      // TODO: Get Hivr workspace token from env or config
      const customerKey = process.env.APICLAW_HIVR_CUSTOMER_KEY;
      const stripeCustomerId = process.env.APICLAW_HIVR_STRIPE_CUSTOMER;
      
      result = await executeMetered(provider, action, params, {
        customerId: stripeCustomerId,
        customerKey,
        userId: `hivr:${agentId}`,
      });
      success = result.success;
      error = result.error;
    }
  } catch (e: any) {
    success = false;
    error = e.message;
    result = { success: false, error: error };
  }
  
  const latencyMs = Date.now() - startTime;
  
  // Log to analytics
  logAPICall({
    timestamp: new Date().toISOString(),
    provider,
    action,
    type: apiType!,
    userId: `hivr:${agentId}`,
    success,
    latencyMs,
    error,
  });
  
  sendJSON(res, success ? 200 : 500, {
    success,
    provider,
    action,
    agentId,
    data: result.data,
    error: result.error,
    latencyMs,
  });
}

/**
 * Handle OPTIONS (CORS preflight)
 */
function handleOptions(res: ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Id',
    'Access-Control-Max-Age': '86400',
  });
  res.end();
}

/**
 * Main request handler
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  console.log(`[APIClaw HTTP] ${req.method} ${url.pathname}`);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }
  
  // Health check
  if (url.pathname === '/health') {
    sendJSON(res, 200, { status: 'ok', service: 'apiclaw-http-api' });
    return;
  }
  
  // Route requests
  if (url.pathname === '/api/discover' && req.method === 'GET') {
    await handleDiscover(req, res, url);
    return;
  }
  
  if (url.pathname === '/api/call_api' && req.method === 'POST') {
    await handleCallAPI(req, res);
    return;
  }
  
  // 404
  sendJSON(res, 404, { error: 'Not found' });
}

/**
 * Start HTTP server
 */
export function startHTTPServer(port: number = 3000): void {
  const server = createServer(async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (error: any) {
      console.error('[APIClaw HTTP] Error:', error);
      sendJSON(res, 500, { error: 'Internal server error', message: error.message });
    }
  });
  
  server.listen(port, () => {
    console.log(`\n🦞 APIClaw HTTP API running on http://localhost:${port}`);
    console.log(`   GET  /api/discover?query=...&agentId=...`);
    console.log(`   POST /api/call_api`);
    console.log(`   GET  /health\n`);
  });
  
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[APIClaw HTTP] Port ${port} is already in use`);
    } else {
      console.error('[APIClaw HTTP] Server error:', error);
    }
  });
}
