/**
 * APIClaw canon stats - single source of truth for the numbers we cite
 * publicly (landing hero, llms.txt, MCP help text, manifest, vault MOC).
 *
 * Canon update protocol:
 *   1. Re-run scripts/smoketest-callable.mjs to refresh empirics.
 *   2. Re-run scripts/build-verification-status.mjs (writes verification-status.json).
 *   3. Update CANON_STATS below to match the new empirical numbers.
 *   4. Re-run landing/scripts/sync-canon-to-stats.mjs (regenerates stats.json).
 *   5. Bump @nordsym/apiclaw version, build, publish, deploy.
 *
 * Numbers as of the 2026-07-19 public-catalog reconciliation. The catalog
 * starts with 26,704 registry rows, removes 66 internal or unavailable rows,
 * collapses 41 managed-provider aliases, and inserts the 22 canonical managed
 * adapter cards. That yields 26,619 public catalog entries.
 *
 * Verification has two deliberately separate counts:
 *   - 689 current public catalog cards map to evidence by exact name.
 *   - 2,895 definitions returned JSON in the historical full sweep.
 *
 * The historical sweep aggregate cannot be mapped safely to the current cards
 * and is never used as a public headline. Host fallback is prohibited because
 * shared spec hosts such as api.apis.guru and virtserver.swaggerhub.com caused
 * false positives. Managed execution is also separate so an executable adapter
 * is not mislabeled as source-verified.
 *
 * The underlying 2026-04-29 full-sweep smoketest covered 5,302 trivially
 * testable providers from the 9,478-callable legacy runtime pool:
 *   - WORKING_JSON: 2895 (returned 200 + parseable JSON) - one input to
 *     source verification, not proof that APIClaw can proxy the definition.
 *   - All other buckets (working_other, auth, needs_ctx, dead) are not
 *     source-verified.
 *
 * 2026-05-17 canon-comms gate: internal communication providers were
 * intentionally moved from callable: true to false because they use
 * NordSym canon credentials - keys we hold for
 * our own ops, not for random users to send mail/SMS through. Net effect
 * on the legacy callable count: -36. They are excluded from public surfaces.
 *
 * We only cite directly-measured figures. The other ~4140 untestable
 * providers (POST-only, required path-vars / query params) have valid OpenAPI
 * specs but we can't smoketest them blindly, so they sit in Discovery rather
 * rather than Source-verified. Honest measurement over flattering extrapolation.
 */

export const CANON_STATS = {
  /** Updated each time canon refreshes. */
  generated_at: '2026-07-19',

  /** Public catalog entries, after internal-provider exclusion and adapter
   * alias collapse. Searchable after signup at no usage charge. */
  discoverable: 26_619,

  /** Current public catalog cards mapped to verification by exact name. */
  source_verified: 689,

  /** Historical sweep passes. Not safely mappable to current catalog cards and
   *  not a public headline or executable coverage claim. */
  verification_sweep_passes: 2_895,

  /**
   * Legacy managed-provider inventory fields. Runtime readiness is determined
   * from the current managed discovery response, not these static counts.
   * APILayer counts as a single brand provider with 26 sub-actions.
   */
  managed_provider_adapters: 22,

  /** Managed providers with at least one customer-executable action. */
  customer_executable_providers: 5,

  /** All-time npm installs (canon as of 2026-05-27 per npmjs dashboard). */
  npm_installs: 16_485,

  /** API Surface narrative (used in marketing copy). */
  hero_line: '26,619 discoverable APIs · 689 source-verified',
  hero_line_short: '26.6k discoverable · 689 source-verified',
} as const;

export type CanonStats = typeof CANON_STATS;
