/**
 * APIClaw canon stats — single source of truth for the numbers we cite
 * publicly (landing hero, llms.txt, MCP help text, manifest, vault MOC).
 *
 * Canon update protocol:
 *   1. Re-run scripts/smoketest-callable.mjs to refresh empirics.
 *   2. Re-run scripts/build-verification-status.mjs (writes verification-status.json).
 *   3. Update CANON_STATS below to match the new empirical numbers.
 *   4. Re-run landing/scripts/sync-canon-to-stats.mjs (regenerates stats.json).
 *   5. Bump @nordsym/apiclaw version, build, publish, deploy.
 *
 * Numbers as of 2026-04-29 full-sweep smoketest (n=5302 trivially-testable
 * providers from the 9478-callable runtime pool):
 *   - WORKING_JSON: 2895 (returned 200 + parseable JSON) — counted as callable
 *   - All other buckets (working_other, auth, needs_ctx, dead) are NOT callable
 *
 * We only cite the directly-measured 2895 figure. The other 4176 untestable
 * providers (POST-only, required path-vars / query params) have valid OpenAPI
 * specs but we can't smoketest them blindly, so they sit in Discovery rather
 * than Callable. Honest measurement over flattering extrapolation.
 */

export const CANON_STATS = {
  /** Updated each time canon refreshes. */
  generated_at: '2026-04-29',

  /** Indexed for discovery — searchable, free, no auth. */
  discoverable: 26_704,

  /** Empirically verified callable: smoketest returned 200 + parseable JSON. */
  callable: 2_895,

  /**
   * Managed providers — APIClaw owns the keys. Subset of `callable`.
   * APILayer counts as a single brand provider with 26 sub-actions.
   */
  managed_brands: 19,
  managed_directcallconfigs: 49,

  /** All-time npm installs (canon as of last vault sync). */
  npm_installs: 13_552,

  /** API Surface narrative (used in marketing copy). */
  hero_line: '26,704 indexed APIs · 2,895 callable',
  hero_line_short: '26.7k discoverable · 2.9k callable',
} as const;

export type CanonStats = typeof CANON_STATS;
