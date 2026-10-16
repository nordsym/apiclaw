import { getManagedProviderAdapter } from './product-truth.js';
import { getWorkspacePublicApi } from './workspace-public-apis.js';

export type PublicDiscoveryHealth = ReadonlySet<string> | undefined;

/** One public metadata request per local fallback, never per result or with credentials. */
export async function loadPublicDiscoveryHealth(
  request: typeof fetch = fetch,
  convexUrl = process.env.CONVEX_URL || 'https://adventurous-avocet-799.convex.cloud',
): Promise<PublicDiscoveryHealth> {
  try {
    const response = await request(`${convexUrl.replace(/\/$/, '')}/api/query`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'publicApiHealth:snapshot', args: {} }),
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.json() as { status?: string; value?: { approvedIds?: unknown; disabledIds?: unknown } };
    const { approvedIds, disabledIds } = body.value ?? {};
    if (!response.ok || body.status !== 'success' || !Array.isArray(approvedIds) || !Array.isArray(disabledIds)
      || !approvedIds.every((id) => typeof id === 'string') || !disabledIds.every((id) => typeof id === 'string')) return undefined;
    const disabled = new Set(disabledIds);
    return new Set(approvedIds.filter((id) => !disabled.has(id)));
  } catch { return undefined; }
}

/** The snapshot may demote compiled entries, but cannot promote unknown inventory. */
export function applyPublicDiscoveryHealth<T extends { id?: string; name?: string; callable?: boolean }>(
  row: T, health: PublicDiscoveryHealth,
): T {
  if (getManagedProviderAdapter(row.id) || getManagedProviderAdapter(row.name)) return row;
  const approved = getWorkspacePublicApi(row.name) ?? getWorkspacePublicApi(row.id);
  return { ...row, callable: row.callable === true && !!approved && health?.has(approved.id) === true };
}
