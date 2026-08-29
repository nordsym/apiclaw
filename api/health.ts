/**
 * APIClaw Health Check - Vercel Serverless Function
 * GET /api/health
 */

import type { VercelRequestLike, VercelResponseLike } from './vercel-types.js';

export default async function handler(
  _req: VercelRequestLike,
  res: VercelResponseLike
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  
  return res.status(200).json({
    status: 'ok',
    service: 'apiclaw-gateway',
    version: '2.9.5',
    timestamp: new Date().toISOString(),
  });
}
