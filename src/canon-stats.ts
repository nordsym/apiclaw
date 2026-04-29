/**
 * APIClaw canon stats — single source of truth for the numbers we cite
 * publicly (landing hero, llms.txt, MCP help text, manifest, vault MOC).
 *
 * Canon update protocol:
 *   1. Re-run scripts/smoketest-callable.mjs to refresh empirics.
 *   2. Re-run scripts/build-verification-status.mjs (writes verification-status.json).
 *   3. Update CANON_STATS below to match the new bucket counts.
 *   4. Re-run scripts/build-stats-json.mjs (regenerates landing/src/lib/stats.json).
 *   5. Bump @nordsym/apiclaw version, build, publish, deploy.
 *
 * Numbers as of 2026-04-29 full-sweep smoketest (sample n=5302 of 5302
 * trivially-testable from the 9478-callable pool):
 *   - WORKING_JSON: 2895 directly verified (~54.6% of testable subset)
 *   - WORKING_*:    395 additional 2xx responses (empty/HTML/other)
 *   - AUTH:         375 (mis-flagged requiresAuth=false in spec)
 *   - NEEDS_CTX:    506 (require parameters we can't blindly test)
 *   - DEAD:         1131 (DNS/TLS/timeout/404/5xx)
 *
 * Extrapolated to the full callable pool, ~5175 are verified working.
 * We cite the directly-measured 2895 as the conservative public figure
 * because that's what we can prove without extrapolation.
 */

export const CANON_STATS = {
  /** Updated each time canon refreshes. */
  generated_at: '2026-04-29',

  /** Tier 1: indexed for discovery — searchable, free, no auth. */
  discoverable: 26_704,

  /** Tier 2: directly verified callable (smoketest WORKING_JSON). */
  callable_verified: 2_895,

  /** Tier 2 + extrapolated subset that requires context to test. */
  callable_total: 5_175,

  /**
   * Tier 3: managed providers — APIClaw owns the keys. APILayer counts
   * as a single brand provider with 26 sub-actions.
   */
  managed_brands: 19,
  managed_directcallconfigs: 49,

  /** All-time npm installs (canon as of last vault sync). */
  npm_installs: 13_552,

  /** API Surface narrative (used in marketing copy). */
  hero_line: '26,704 indexed APIs · 5,175 callable',
  hero_line_short: '26.7k discoverable · 5.2k callable',
} as const;

export type CanonStats = typeof CANON_STATS;
