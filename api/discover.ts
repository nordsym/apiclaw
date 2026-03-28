/**
 * APIClaw Discovery API - Vercel Serverless Function
 * GET /api/discover?query=...&agentId=...
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorized, getProduct } from '../dist/product-whitelist.js';
import { discoverAPIs } from '../dist/discovery.js';
import { logAPICall } from '../dist/analytics.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Agent-Id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { query, agentId, category, maxResults } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing query parameter' });
  }
  
  const agentIdStr = typeof agentId === 'string' ? agentId : undefined;
  
  if (!(await isAuthorized(agentIdStr))) {
    return res.status(403).json({ 
      error: 'Unauthorized', 
      message: 'This endpoint is restricted. Contact admin@nordsym.com',
    });
  }
  
  const startTime = Date.now();
  const results = discoverAPIs(query, { 
    category: typeof category === 'string' ? category : undefined,
    maxResults: typeof maxResults === 'string' ? parseInt(maxResults) : 5,
  });
  const responseTimeMs = Date.now() - startTime;
  
  // Log to analytics
  const product = agentIdStr ? getProduct(agentIdStr) : null;
  logAPICall({
    timestamp: new Date().toISOString(),
    provider: 'apiclaw_discovery',
    action: 'discover',
    type: 'open',
    userId: agentIdStr || 'unknown',
    success: true,
    latencyMs: responseTimeMs,
    metadata: product ? { product } : undefined,
  });
  
  return res.status(200).json({
    success: true,
    query,
    agentId: agentIdStr,
    product,
    results,
    responseTimeMs,
  });
}
