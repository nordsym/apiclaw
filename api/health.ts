/**
 * APIClaw Health Check - Vercel Serverless Function
 * GET /api/health
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    status: 'ok',
    service: 'apiclaw-http-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
}
