# Public Convex function review

`src/trust-floor.test.ts` inventories registered public queries, mutations and actions using the TypeScript checker and Convex's public visibility types. It follows imported builder aliases, namespace imports, and re-exports, including the legacy `directCall` namespace. Generated declarations and test modules are excluded, as they are from the Convex entry-point set.

Every public function needs an actual call to a reviewed credential validator, or a reviewed entry in one of these files:

- `convex/public-function-allowlist.json`: necessary anonymous behavior, with a one-line reason for every export.
- `convex/public-function-auth-reviews.json`: protocol-specific authentication, such as PKCE, refresh tokens, bearer-token hashes and invitation tokens, that the common-validator check cannot classify.

Both files pin the registration's AST digest, including argument validators. A behavior change requires reviewing the reason and updating the digest, even if the function name stays unchanged. Adding a token argument or an auth-looking comment is insufficient. The inventory is a static regression check; credential validation and tenant authorization still need runtime tests and code review.

Anonymous exceptions are catalog and routing metadata, published listings, aggregate provider/API health, pre-login CLI start, retired device-link responses, waitlist submission/count, public OAuth client metadata, and diagnostic event intake. Diagnostic intake cannot authenticate a workspace or execute an API. Gateway execution and managed discovery retain their existing HTTP credential checks; they are not exempted by this list.

Customer, workspace and log diagnostics, MoU operations, seed/migration/backfill operations, legacy credit/purchase reads and writes, and usage maintenance must be internal or explicitly authenticate their callers. Customer IDs alone are never credentials. `providers:getApiById` normalizes IDs specifically to the API catalog table so it cannot read another table.

The retained external seed tools require `APICLAW_INTERNAL_SECRET`. Runtime clients use workspace sessions for workspace writes and analytics. Server-only legacy billing, usage and capability writers require the internal server credential. Internal server calls and catalog health updates use internal function references. Two obsolete seed scripts that already called private functions now exit with a retirement message before any network request.

Use `npm run convex:dev` and `npm run convex:deploy`, which run `scripts/convex-safe.mjs`. The guard checks process settings, `.env`, `.env.local` and custom target selectors. Unknown targets fail closed. Deploy always requires explicit command-specific production confirmation and runs all three TypeScript projects before invoking Convex. Keep production credentials out of normal development environments. Owner approval is required before setting production confirmation; tests never invoke the Convex CLI.

`npm run lint` enforces `@typescript-eslint/no-explicit-any` and `@typescript-eslint/ban-ts-comment` on changed lines and all new files. Existing findings outside changed lines are counted without blocking the PR. CI supplies the PR base SHA, or the previous commit on a main-branch push. Locally the baseline is `origin/main`, overridable with `LINT_BASE`.

After an approved production deployment, separately verify the live published function inventory. A local test or merged PR does not establish what is running in production.
