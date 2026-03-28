#!/usr/bin/env node
/**
 * Minimal HTTP API Server for APIClaw
 * Bypasses chain executor imports
 */

import { createServer } from 'http';
import { URL } from 'url';

const PORT = parseInt(process.env.PORT || '3001');

// Import whitelist directly
import { isAuthorized, getProduct } from './product-whitelist.js';

interface APIRequest {
  provider: string;
  action: string;
  params: Record<string, any>;
  agentId: string;
}

function sendJSON(res: any, status: number, data: any): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

async function parseBody<T>(req: any): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  console.log(`[APIClaw] ${req.method} ${url.pathname}`);
  
  // CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }
  
  // Health check
  if (url.pathname === '/health') {
    sendJSON(res, 200, { 
      status: 'ok', 
      service: 'apiclaw-http-api',
      version: '2.0.0',
      whitelist: 'multi-product',
    });
    return;
  }
  
  // Discovery endpoint
  if (url.pathname === '/api/discover' && req.method === 'GET') {
    const query = url.searchParams.get('query');
    const agentId = url.searchParams.get('agentId');
    
    if (!query) {
      sendJSON(res, 400, { error: 'Missing query parameter' });
      return;
    }
    
    const authorized = await isAuthorized(agentId || undefined);
    
    if (!authorized) {
      sendJSON(res, 403, {
        error: 'Unauthorized',
        message: 'This endpoint is restricted. Contact admin@nordsym.com',
      });
      return;
    }
    
    const product = agentId ? getProduct(agentId) : null;
    
    sendJSON(res, 200, {
      success: true,
      query,
      agentId,
      product,
      message: 'Whitelist v2.0 active - discovery endpoint placeholder',
    });
    return;
  }
  
  // Call API endpoint
  if (url.pathname === '/api/call_api' && req.method === 'POST') {
    try {
      const body = await parseBody<APIRequest>(req);
      const { provider, action, params, agentId } = body;
      
      if (!provider || !action || !agentId) {
        sendJSON(res, 400, {
          error: 'Missing required fields',
          required: ['provider', 'action', 'agentId', 'params'],
        });
        return;
      }
      
      const authorized = await isAuthorized(agentId);
      
      if (!authorized) {
        sendJSON(res, 403, {
          error: 'Unauthorized',
          message: 'Agent not whitelisted',
        });
        return;
      }
      
      const product = getProduct(agentId);
      
      sendJSON(res, 200, {
        success: true,
        agentId,
        provider,
        action,
        product,
        message: 'Whitelist v2.0 active - execution placeholder',
      });
      
    } catch (e: any) {
      sendJSON(res, 400, { error: e.message });
    }
    return;
  }
  
  // 404
  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n🦞 APIClaw HTTP API (Whitelist v2.0)`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/discover?query=...&agentId=...`);
  console.log(`   POST /api/call_api\n`);
});
