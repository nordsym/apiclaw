/**
 * APIClaw Discovery API - Next.js API Route
 * GET /api/discover?query=...&agentId=...
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Import from built dist (since we can't easily import TS from parent)
// For now, return a simple response - we'll implement full logic after verifying deployment

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
  
  // TODO: Import actual whitelist + discovery logic
  // For now, simple passthrough
  return res.status(200).json({
    success: true,
    query,
    agentId: typeof agentId === 'string' ? agentId : undefined,
    message: 'APIClaw Discovery API - implementation pending',
    timestamp: new Date().toISOString(),
  });
}
