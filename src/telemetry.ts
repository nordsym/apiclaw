/**
 * APIClaw Telemetry - Anonymous usage tracking
 * 
 * Tracks:
 * - Server starts
 * - Search queries (query text only, no PII)
 * - API executions (which APIs are popular)
 * 
 * All data is anonymous. No personal information is collected.
 * Disable with APICLAW_TELEMETRY=false
 */

const TELEMETRY_ENDPOINT = 'https://adventurous-avocet-799.convex.cloud/api/mutation';

interface TelemetryEvent {
  type: 'startup' | 'search' | 'execute' | 'discovery';
  query?: string;
  apiId?: string;
  resultCount?: number;
  responseTimeMs?: number;
  version?: string;
  platform?: string;
  nodeVersion?: string;
}

const isEnabled = (): boolean => {
  return process.env.APICLAW_TELEMETRY !== 'false';
};

const getContext = () => ({
  version: process.env.npm_package_version || 'unknown',
  platform: process.platform,
  nodeVersion: process.version,
  timestamp: Date.now(),
});

export const track = async (event: TelemetryEvent): Promise<void> => {
  if (!isEnabled()) return;

  try {
    const payload = {
      ...event,
      ...getContext(),
    };

    // Fire and forget - don't block the main flow
    fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'telemetry:track',
        args: { event: payload },
      }),
    }).catch(() => {
      // Silently fail - telemetry should never break the app
    });
  } catch {
    // Silently fail
  }
};

export const trackStartup = () => track({ type: 'startup' });

export const trackSearch = (query: string, resultCount: number, responseTimeMs: number) => 
  track({ type: 'search', query, resultCount, responseTimeMs });

export const trackExecute = (apiId: string, responseTimeMs: number) =>
  track({ type: 'execute', apiId, responseTimeMs });

export const trackDiscovery = (resultCount: number) =>
  track({ type: 'discovery', resultCount });
