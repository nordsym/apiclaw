# Workspace state browser matrix

Run `npm run test:workspace-browser` at the repository root, then open http://127.0.0.1:48732/ in a local browser. The page runs 24 scenarios and prints each outcome. All must pass. The tests mount the actual React workspace views, with a synthetic session and intercepted fetch. No production credentials or requests are used.

For an already running server, rebuild with `node scripts/workspace-state-matrix.cjs --build-only`, then reload the page. Next navigation is modeled by `navigation.tsx`; framework routing and real Stripe/Clerk behavior require deployment smoke verification.

The matrix covers initial failure, remount, focus, pageshow, session renewal, Stripe portal and checkout success/cancel, stale response ordering, agent recovery/reconnect, failed reads and saves, unsaved routing/name drafts, pending saves, billing unknown state, onboarding, and standalone chains. The Node suite additionally covers response contracts, one-time session recovery, mutation invalidation/no replay, and current Stripe payment snapshots.
