import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const CLAIM_LEASE_MS = 5 * 60 * 1000;
const STRIPE_DEDUPE_SAFETY_WINDOW_MS = 23 * 60 * 60 * 1000;
const STRIPE_EVENT_MAX_AGE_MS = 34 * 24 * 60 * 60 * 1000;
const MAX_BATCH_SIZE = 25;
const MICRO_USD_PRICE_IN_CENTS = "0.0001";

type ClaimableLedger = {
  stripeStatus: "not_applicable" | "pending" | "claiming" | "reported";
  stripeClaimedAt?: number;
  updatedAt?: number;
  reconciliationRequiredAt?: number;
};

type LedgerStripeSnapshotSource = {
  stripeCustomerIdSnapshot?: string;
  stripeSubscriptionIdSnapshot?: string;
  stripePriceIdSnapshot?: string;
  stripeMeterIdSnapshot?: string;
  stripeMeterEventNameSnapshot?: string;
};

export type LedgerStripeSnapshot = {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  meterId: string;
  eventName: string;
};

type MeterEnvironment = Record<string, string | undefined>;

export type MicroUsdMeterConfig = {
  secretKey: string;
  eventName: string;
  meterId: string;
  priceId: string;
};

export type ClaimDecision =
  | "claim"
  | "reclaim"
  | "busy"
  | "reported"
  | "not_applicable"
  | "reconciliation_required";

export function stripeMeterEventIdentifier(ledgerId: string): string {
  return `apiclaw_managed_${ledgerId}`;
}

export function preserveFirstStripeClaimAt(
  existingClaimedAt: number | undefined,
  now: number,
): number {
  return existingClaimedAt ?? now;
}

export function decideStripeClaim(
  ledger: ClaimableLedger,
  now: number,
): ClaimDecision {
  if (ledger.reconciliationRequiredAt) return "reconciliation_required";
  if (ledger.stripeStatus === "reported") return "reported";
  if (ledger.stripeStatus === "not_applicable") return "not_applicable";
  if (ledger.stripeStatus === "pending") return "claim";

  const claimedAt = ledger.stripeClaimedAt;
  if (!claimedAt) return "reclaim";

  const currentClaimAt = ledger.updatedAt ?? claimedAt;
  const currentClaimAge = Math.max(0, now - currentClaimAt);
  if (currentClaimAge < CLAIM_LEASE_MS) return "busy";
  const firstClaimAge = Math.max(0, now - claimedAt);
  if (firstClaimAge >= STRIPE_DEDUPE_SAFETY_WINDOW_MS) {
    // Stripe only guarantees meter-event identifier uniqueness for at least
    // 24 hours. Never retry an ambiguous event outside that window.
    return "reconciliation_required";
  }
  return "reclaim";
}

export function readLedgerStripeSnapshot(
  ledger: LedgerStripeSnapshotSource,
): LedgerStripeSnapshot | undefined {
  const customerId = ledger.stripeCustomerIdSnapshot?.trim();
  const subscriptionId = ledger.stripeSubscriptionIdSnapshot?.trim();
  const priceId = ledger.stripePriceIdSnapshot?.trim();
  const meterId = ledger.stripeMeterIdSnapshot?.trim();
  const eventName = ledger.stripeMeterEventNameSnapshot?.trim();
  if (!customerId || !subscriptionId || !priceId || !meterId || !eventName) {
    return undefined;
  }
  return { customerId, subscriptionId, priceId, meterId, eventName };
}

function requiredEnvironmentValue(env: MeterEnvironment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured for exact Stripe metering`);
  return value;
}

export function readMicroUsdMeterConfig(env: MeterEnvironment): MicroUsdMeterConfig {
  const unit = requiredEnvironmentValue(env, "STRIPE_METER_VALUE_UNIT");
  if (unit !== "micro_usd") {
    throw new Error("STRIPE_METER_VALUE_UNIT must be exactly micro_usd");
  }

  return {
    secretKey: requiredEnvironmentValue(env, "STRIPE_SECRET_KEY"),
    eventName: requiredEnvironmentValue(env, "STRIPE_METER_EVENT_NAME_MICRO_USD"),
    meterId: requiredEnvironmentValue(env, "STRIPE_METER_ID_MICRO_USD"),
    priceId: requiredEnvironmentValue(env, "STRIPE_PRICE_ID_MICRO_USD"),
  };
}

function normalizeDecimal(value: string): string | undefined {
  const match = value.trim().match(/^\+?(\d+)(?:\.(\d+))?$/);
  if (!match) return undefined;
  const whole = match[1].replace(/^0+(?=\d)/, "");
  const fractional = (match[2] || "").replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole;
}

export function isExactMicroUsdPrice(unitAmountDecimal: string | null): boolean {
  if (!unitAmountDecimal) return false;
  return normalizeDecimal(unitAmountDecimal) === MICRO_USD_PRICE_IN_CENTS;
}

export function buildStripeMeterEvent(
  eventName: string,
  customerId: string,
  chargeMicros: number,
  identifier: string,
  timestampMs: number,
): Stripe.Billing.MeterEventCreateParams {
  if (!Number.isSafeInteger(chargeMicros) || chargeMicros <= 0) {
    throw new Error("Stripe charge must be a positive integer number of micro-USD");
  }
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    throw new Error("Stripe meter timestamp must be a positive finite timestamp");
  }

  return {
    event_name: eventName,
    payload: {
      stripe_customer_id: customerId,
      value: String(chargeMicros),
    },
    identifier,
    timestamp: Math.floor(timestampMs / 1000),
  };
}

export function isDefinitiveStripeStatus(status: number | undefined): boolean {
  return typeof status === "number" &&
    status >= 400 &&
    status < 500 &&
    status !== 409 &&
    status !== 429;
}

function isDefinitiveStripeRejection(error: unknown): boolean {
  if (!(error instanceof Stripe.errors.StripeError)) return false;
  return isDefinitiveStripeStatus(error.statusCode);
}

export const listStripeCandidates = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const boundedLimit = Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(limit)));
    const pending = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_stripeStatus", (q) => q.eq("stripeStatus", "pending"))
      .filter((q) => q.eq(q.field("reconciliationRequiredAt"), undefined))
      .take(boundedLimit);
    const claiming = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_stripeStatus", (q) => q.eq("stripeStatus", "claiming"))
      .filter((q) => q.eq(q.field("reconciliationRequiredAt"), undefined))
      .take(boundedLimit);
    return [...pending, ...claiming]
      .sort((left, right) =>
        (left.updatedAt || left.stripeClaimedAt || left.createdAt) -
        (right.updatedAt || right.stripeClaimedAt || right.createdAt)
      )
      .slice(0, boundedLimit);
  },
});

export const getStripeCandidate = internalQuery({
  args: { ledgerId: v.id("managedCallLedger") },
  handler: async (ctx, { ledgerId }) => {
    const ledger = await ctx.db.get(ledgerId);
    if (!ledger) return null;
    return { ledger };
  },
});

export const claimStripeCandidate = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (!ledger) return { claimed: false as const, reason: "missing" as const };
    if (
      ledger.status !== "succeeded" ||
      ledger.billingClass !== "payg" ||
      !ledger.customerChargeMicros ||
      ledger.customerChargeMicros <= 0
    ) {
      return { claimed: false as const, reason: "not_billable" as const };
    }

    const snapshot = readLedgerStripeSnapshot(ledger);
    if (!snapshot) {
      await ctx.db.patch(ledger._id, {
        reconciliationRequiredAt: args.now,
        billingException: ledger.billingException || "stripe_billing_snapshot_missing",
        updatedAt: args.now,
      });
      return { claimed: false as const, reason: "reconciliation_required" as const };
    }

    const decision = decideStripeClaim(ledger, args.now);
    if (decision !== "claim" && decision !== "reclaim") {
      return { claimed: false as const, reason: decision };
    }

    const identifier = ledger.stripeMeterEventIdentifier || stripeMeterEventIdentifier(ledger._id);
    await ctx.db.patch(ledger._id, {
      stripeStatus: "claiming",
      stripeMeterEventIdentifier: identifier,
      stripeClaimedAt: preserveFirstStripeClaimAt(ledger.stripeClaimedAt, args.now),
      updatedAt: args.now,
    });
    return {
      claimed: true as const,
      ledgerId: ledger._id,
      identifier,
      chargeMicros: ledger.customerChargeMicros,
      timestampMs: ledger.completedAt || ledger.updatedAt,
      ...snapshot,
      reclaimed: decision === "reclaim",
    };
  },
});

export const markStripeCandidateReconciliationRequired = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    reason: v.string(),
    markedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (!ledger || ledger.stripeStatus === "reported" || ledger.stripeStatus === "not_applicable") {
      return { marked: false };
    }
    if (ledger.reconciliationRequiredAt) {
      return { marked: true, alreadyMarked: true };
    }
    await ctx.db.patch(ledger._id, {
      reconciliationRequiredAt: args.markedAt,
      billingException: ledger.billingException || args.reason.slice(0, 200),
      updatedAt: args.markedAt,
    });
    return { marked: true, alreadyMarked: false };
  },
});

export const markStripeCandidateReported = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    identifier: v.string(),
    reportedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (!ledger) throw new Error("Managed call ledger entry not found");
    if (ledger.stripeStatus === "reported") {
      if (ledger.stripeMeterEventIdentifier !== args.identifier) {
        throw new Error("Stripe identifier mismatch on an already reported ledger entry");
      }
      return { reported: true, alreadyReported: true };
    }
    if (
      ledger.stripeStatus !== "claiming" ||
      ledger.stripeMeterEventIdentifier !== args.identifier
    ) {
      throw new Error("Stripe claim is no longer owned by this meter event");
    }

    await ctx.db.patch(ledger._id, {
      stripeStatus: "reported",
      stripeReportedAt: args.reportedAt,
      updatedAt: args.reportedAt,
    });
    return { reported: true, alreadyReported: false };
  },
});

export const releaseStripeCandidate = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    identifier: v.string(),
    releasedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (
      !ledger ||
      ledger.stripeStatus !== "claiming" ||
      ledger.stripeMeterEventIdentifier !== args.identifier
    ) {
      return { released: false };
    }
    await ctx.db.patch(ledger._id, {
      stripeStatus: "pending",
      stripeClaimedAt: undefined,
      updatedAt: args.releasedAt,
    });
    return { released: true };
  },
});

export type StripeReadiness = {
  customerId: string;
  subscriptionId: string;
  meterId: string;
  priceId: string;
  eventName: string;
  valueUnit: "micro_usd";
};

export type MicroUsdMeterWorkspace = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export async function verifyMicroUsdMeterReadiness(
  stripe: Stripe,
  config: MicroUsdMeterConfig,
  workspace: MicroUsdMeterWorkspace,
): Promise<StripeReadiness> {
  if (!workspace.stripeCustomerId || !workspace.stripeSubscriptionId) {
    throw new Error("PAYG workspace is missing its Stripe customer or subscription");
  }

  const [meter, subscription] = await Promise.all([
    stripe.billing.meters.retrieve(config.meterId),
    stripe.subscriptions.retrieve(workspace.stripeSubscriptionId),
  ]);
  if (
    meter.status !== "active" ||
    meter.event_name !== config.eventName ||
    meter.default_aggregation.formula !== "sum" ||
    meter.customer_mapping.event_payload_key !== "stripe_customer_id" ||
    meter.value_settings.event_payload_key !== "value"
  ) {
    throw new Error("Configured Stripe meter is not an active sum meter with APIClaw payload keys");
  }

  const subscriptionCustomer = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  if (subscriptionCustomer !== workspace.stripeCustomerId) {
    throw new Error("Stripe subscription customer does not match the APIClaw workspace");
  }
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    throw new Error(`Stripe subscription is not billable (${subscription.status})`);
  }

  const item = subscription.items.data.find((candidate) => candidate.price.id === config.priceId);
  if (
    !item ||
    item.price.currency !== "usd" ||
    item.price.billing_scheme !== "per_unit" ||
    item.price.transform_quantity !== null ||
    item.price.recurring?.usage_type !== "metered" ||
    item.price.recurring.meter !== config.meterId ||
    !isExactMicroUsdPrice(item.price.unit_amount_decimal)
  ) {
    throw new Error(
      "Stripe subscription must contain the configured metered price at exactly $0.000001 per unit",
    );
  }

  return {
    customerId: workspace.stripeCustomerId,
    subscriptionId: workspace.stripeSubscriptionId,
    meterId: config.meterId,
    priceId: config.priceId,
    eventName: config.eventName,
    valueUnit: "micro_usd",
  };
}

type MeteringResults = {
  configured: boolean;
  candidates: number;
  reported: number;
  busy: number;
  reconciliationRequired: number;
  failed: number;
  errors: string[];
};

export const reportPendingToStripe = internalAction({
  args: {},
  handler: async (ctx): Promise<MeteringResults> => {
    const results: MeteringResults = {
      configured: false,
      candidates: 0,
      reported: 0,
      busy: 0,
      reconciliationRequired: 0,
      failed: 0,
      errors: [],
    };

    let config: MicroUsdMeterConfig;
    try {
      config = readMicroUsdMeterConfig(process.env);
      results.configured = true;
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : "Stripe micro-USD meter is not configured");
      return results;
    }

    const stripe = new Stripe(config.secretKey);
    const candidates = await ctx.runQuery(internal.managedMetering.listStripeCandidates, {
      limit: MAX_BATCH_SIZE,
    });
    results.candidates = candidates.length;

    for (const candidate of candidates) {
      const now = Date.now();
      const decision = decideStripeClaim(candidate, now);
      if (decision === "busy") {
        results.busy += 1;
        continue;
      }
      if (decision === "reconciliation_required") {
        results.reconciliationRequired += 1;
        await ctx.runMutation(
          internal.managedMetering.markStripeCandidateReconciliationRequired,
          {
            ledgerId: candidate._id,
            reason: "stripe_claim_outside_dedupe_window",
            markedAt: now,
          },
        );
        continue;
      }
      if (decision === "reported" || decision === "not_applicable") continue;

      const timestampMs = candidate.completedAt || candidate.updatedAt;
      if (now - timestampMs > STRIPE_EVENT_MAX_AGE_MS) {
        results.reconciliationRequired += 1;
        await ctx.runMutation(
          internal.managedMetering.markStripeCandidateReconciliationRequired,
          {
            ledgerId: candidate._id,
            reason: "stripe_meter_event_too_old",
            markedAt: now,
          },
        );
        continue;
      }

      const claim = await ctx.runMutation(internal.managedMetering.claimStripeCandidate, {
        ledgerId: candidate._id,
        now,
      });
      if (!claim.claimed) {
        if (claim.reason === "busy") results.busy += 1;
        if (claim.reason === "reconciliation_required") results.reconciliationRequired += 1;
        continue;
      }

      try {
        const event = buildStripeMeterEvent(
          claim.eventName,
          claim.customerId,
          claim.chargeMicros,
          claim.identifier,
          claim.timestampMs,
        );
        await stripe.billing.meterEvents.create(event, { idempotencyKey: claim.identifier });
        await ctx.runMutation(internal.managedMetering.markStripeCandidateReported, {
          ledgerId: claim.ledgerId,
          identifier: claim.identifier,
          reportedAt: Date.now(),
        });
        results.reported += 1;
      } catch (error) {
        results.failed += 1;
        results.errors.push(`${candidate._id}: ${error instanceof Error ? error.message : "Stripe reporting failed"}`);
        if (isDefinitiveStripeRejection(error)) {
          await ctx.runMutation(
            internal.managedMetering.markStripeCandidateReconciliationRequired,
            {
              ledgerId: claim.ledgerId,
              reason: "stripe_meter_event_rejected",
              markedAt: Date.now(),
            },
          );
        } else {
          // Network, conflict, rate-limit, and Stripe 5xx failures are
          // ambiguous or transient. The claim remains in place and is retried
          // with identical immutable parameters inside Stripe's guaranteed
          // deduplication window.
        }
      }
    }

    return results;
  },
});
