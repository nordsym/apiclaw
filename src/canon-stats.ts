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
 * 2026-05-17 canon-comms gate: Twilio (22 sub-rows), Resend (2 rows), and
 * 46elks (2 rows) were intentionally moved from callable: true to false
 * because they're NordSym canon-credential providers — keys we hold for
 * our own ops, not for random users to send mail/SMS through. Net effect
 * on callable count: -36. They remain discoverable, just not in the
 * default callable bucket. Honest measurement updated below.
 *
 * We only cite directly-measured figures. The other ~4140 untestable
 * providers (POST-only, required path-vars / query params) have valid OpenAPI
 * specs but we can't smoketest them blindly, so they sit in Discovery rather
 * than Callable. Honest measurement over flattering extrapolation.
 */

export const CANON_STATS = {
  /** Updated each time canon refreshes. */
  generated_at: '2026-05-17',

  /** Indexed for discovery — searchable, free, no auth. */
  discoverable: 26_704,

  /** Empirically verified callable: smoketest returned 200 + parseable JSON,
   *  minus canon-credential providers we gate from the public callable surface. */
  callable: 2_872,

  /**
   * Managed providers — APIClaw owns the keys. Subset of `callable`.
   * APILayer counts as a single brand provider with 26 sub-actions.
   */
  managed_brands: 19,
  managed_directcallconfigs: 49,

  /** All-time npm installs (canon as of last vault sync). */
  npm_installs: 14_667,

  /** API Surface narrative (used in marketing copy). */
  hero_line: '26,704 indexed APIs · 2,872 callable',
  hero_line_short: '26.7k discoverable · 2.9k callable',
} as const;

export type CanonStats = typeof CANON_STATS;
