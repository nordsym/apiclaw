/**
 * APIClaw Health Check - Next.js API Route
 * GET /api/health
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceHealth } from '../../src/lib/service-health';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  
  return res.status(200).json(createServiceHealth());
}
