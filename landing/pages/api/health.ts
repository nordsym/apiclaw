/**
 * APIClaw Health Check - Next.js API Route
 * GET /api/health
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  
  return res.status(200).json({
    status: 'ok',
    service: 'apiclaw-gateway',
    version: '2.9.7',
    timestamp: new Date().toISOString(),
  });
}
