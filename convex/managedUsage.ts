import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  activationManagedCallCount,
  evaluateManagedUsage,
  hasActivePaygEntitlement,
  isInternalTier,
  managedQuotaMessage,
  type ManagedBillingClass,
  type ManagedTrafficClass,
} from "./managedUsagePolicy";
import { isManagedActionAllowedForTraffic } from "./providerBoundaries";
import { PAYG_MARGIN_RATE } from "../src/product-truth";
import {
  buildIdempotencyReplayReceipt,
  safeReplayTerminalCode,
} from "./idempotencyBinding";

const trafficClassValidator = v.union(v.literal("customer"), v.literal("internal"));
const costSourceValidator = v.union(
  v.literal("provider_response"),
  v.literal("token_price_table"),
  v.literal("fixed_price_policy"),
  v.literal("reservation"),
  v.literal("zero_cost"),
);

const AUTHORIZATION_LEASE_MS = 15 * 60 * 1000;

type ManagedCostSource =
  | "provider_response"
  | "token_price_table"
  | "fixed_price_policy"
  | "reservation"
  | "zero_cost";

type LedgerStatus = "authorized" | "succeeded" | "failed";
export type DuplicateManagedRequestReason =
  | "duplicate_request_authorized"
  | "duplicate_request_succeeded"
  | "duplicate_request_failed";

export function duplicateManagedRequestReason(status: LedgerStatus): DuplicateManagedRequestReason {
  if (status === "authorized") return "duplicate_request_authorized";
  if (status === "succeeded") return "duplicate_request_succeeded";
  return "duplicate_request_failed";
}

export function managedDuplicateTerminalReceipt(ledger: {
  requestId: string;
  terminalCode?: string;
  executionCertainty?: "not_dispatched" | "provider_rejected" | "provider_terminal_failure" | "completed" | "uncertain";
  operatorActionRequired?: boolean;
  retryAttempts?: number;
}) {
  if (!ledger.executionCertainty) return undefined;
  const code = safeReplayTerminalCode(ledger.terminalCode);
  return {
    requestId: ledger.requestId,
    outcome: ledger.executionCertainty === "uncertain"
      ? "outcome_unknown"
      : ledger.executionCertainty === "completed"
        ? "succeeded"
        : "terminal",
    executionCertainty: ledger.executionCertainty,
    attempts: ledger.retryAttempts ?? 1,
    operatorActionRequired: ledger.operatorActionRequired ?? false,
    retryable: false,
    ...(code ? { code } : {}),
  };
}

export function authorizationNeedsReconciliation(
  ledger: {
    status: LedgerStatus;
    updatedAt: number;
    authorizationLeaseExpiresAt?: number;
    reconciliationRequiredAt?: number;
  },
  now: number,
  olderThanMs: number,
): boolean {
  if (ledger.status !== "authorized" || ledger.reconciliationRequiredAt !== undefined) return false;
  const leaseExpiresAt = ledger.authorizationLeaseExpiresAt ?? ledger.updatedAt + olderThanMs;
  return leaseExpiresAt <= now && ledger.updatedAt <= now - olderThanMs;
}

type StripeBillingSnapshotWorkspace = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paygMeterPriceId?: string;
  paygMeterId?: string;
  paygMeterEventName?: string;
};

export function buildStripeBillingSnapshot(
  workspace: StripeBillingSnapshotWorkspace,
  billingClass: ManagedBillingClass,
): {
  stripeCustomerIdSnapshot?: string;
  stripeSubscriptionIdSnapshot?: string;
  stripePriceIdSnapshot?: string;
  stripeMeterIdSnapshot?: string;
  stripeMeterEventNameSnapshot?: string;
} {
  if (billingClass !== "payg") return {};
  if (
    !workspace.stripeCustomerId ||
    !workspace.stripeSubscriptionId ||
    !workspace.paygMeterPriceId ||
    !workspace.paygMeterId ||
    !workspace.paygMeterEventName
  ) {
    throw new Error("PAYG authorization is missing immutable Stripe billing context");
  }
  return {
    stripeCustomerIdSnapshot: workspace.stripeCustomerId,
    stripeSubscriptionIdSnapshot: workspace.stripeSubscriptionId,
    stripePriceIdSnapshot: workspace.paygMeterPriceId,
    stripeMeterIdSnapshot: workspace.paygMeterId,
    stripeMeterEventNameSnapshot: workspace.paygMeterEventName,
  };
}

export function resolveRealizedManagedCost(
  reportedProviderCostMicros: number,
  billingClass: ManagedBillingClass,
  success: boolean,
  costSource: "provider_response" | "token_price_table" | "fixed_price_policy" | "reservation" | "zero_cost",
): {
  providerCostMicros: number;
  customerChargeMicros: number;
  marginMicros: number;
  billingException?: string;
  stripePending: boolean;
} {
  const reservationOnly = costSource === "reservation";
  const providerCostMicros = reservationOnly ? 0 : reportedProviderCostMicros;
  const customerCharge = success && !reservationOnly
    ? customerChargeMicros(providerCostMicros, billingClass)
    : 0;
  return {
    providerCostMicros,
    customerChargeMicros: customerCharge,
    marginMicros: success && !reservationOnly
      ? Math.max(0, customerCharge - providerCostMicros)
      : 0,
    billingException: success && reservationOnly
      ? "actual_cost_missing_reconciliation_required"
      : undefined,
    stripePending: success && !reservationOnly && billingClass === "payg" && customerCharge > 0,
  };
}

export function resolveActivationProviderCostMicros(input: {
  currentProviderCostMicros: number;
  reservedProviderCostMicros: number;
  reportedProviderCostMicros?: number;
  realizedProviderCostMicros: number;
  success: boolean;
  costSource: ManagedCostSource;
  billingException?: string;
}): number {
  const reportedOverReservation =
    input.billingException === "reported_cost_exceeds_authorized_reservation" &&
    input.reportedProviderCostMicros !== undefined;
  if (reportedOverReservation) {
    return Math.max(
      0,
      input.currentProviderCostMicros -
        input.reservedProviderCostMicros +
        input.reportedProviderCostMicros!,
    );
  }
  if (input.costSource === "reservation" && input.success) {
    return input.currentProviderCostMicros;
  }
  return Math.max(
    0,
    input.currentProviderCostMicros -
      input.reservedProviderCostMicros +
      input.realizedProviderCostMicros,
  );
}

export function shouldPlaceManagedCostHold(input: {
  trafficClass: ManagedTrafficClass;
  billingClass: ManagedBillingClass;
  billingException?: string;
}): boolean {
  return input.trafficClass === "customer" &&
    Boolean(input.billingException);
}

export function usdToMicros(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error("Cost must be a finite non-negative number");
  const micros = Math.round(value * 1_000_000);
  if (!Number.isSafeInteger(micros)) throw new Error("Cost exceeds the safe metering range");
  return micros;
}

export function microsToUsd(value: number): number {
  return value / 1_000_000;
}

// costCents is USD cents (apiLogs.costCents / workspace.monthlySpendCents unit).
// 1,000,000 micros = 1 USD = 100 cents, so cents = micros / 10,000.
export function microsToCents(value: number): number {
  return value / 10_000;
}

type ManagedLedgerSummaryRow = {
  provider: string;
  status: LedgerStatus;
  billingClass: ManagedBillingClass;
  providerCostMicros?: number;
  customerChargeMicros?: number;
  marginMicros?: number;
  billingException?: string;
  stripeStatus: "not_applicable" | "pending" | "claiming" | "reported";
};

export function summarizeManagedLedger(rows: ManagedLedgerSummaryRow[]) {
  const byProvider = new Map<string, {
    provider: string;
    calls: number;
    succeeded: number;
    failed: number;
    authorized: number;
    providerCostMicros: number;
    customerChargeMicros: number;
    marginMicros: number;
    billingExceptions: number;
    stripeUnreportedMicros: number;
  }>();
  const totals = {
    providerCostMicros: 0,
    customerChargeMicros: 0,
    marginMicros: 0,
    activationProviderCostMicros: 0,
    internalProviderCostMicros: 0,
    stripeUnreportedMicros: 0,
  };

  for (const row of rows) {
    const provider = row.provider.trim().toLowerCase() || "unknown";
    const current = byProvider.get(provider) ?? {
      provider,
      calls: 0,
      succeeded: 0,
      failed: 0,
      authorized: 0,
      providerCostMicros: 0,
      customerChargeMicros: 0,
      marginMicros: 0,
      billingExceptions: 0,
      stripeUnreportedMicros: 0,
    };
    const providerCostMicros = row.providerCostMicros ?? 0;
    const customerChargeMicros = row.customerChargeMicros ?? 0;
    const marginMicros = row.marginMicros ?? 0;
    const stripeUnreportedMicros =
      ["pending", "claiming"].includes(row.stripeStatus) ? customerChargeMicros : 0;

    current.calls += 1;
    current[row.status] += 1;
    current.providerCostMicros += providerCostMicros;
    current.customerChargeMicros += customerChargeMicros;
    current.marginMicros += marginMicros;
    current.billingExceptions += row.billingException ? 1 : 0;
    current.stripeUnreportedMicros += stripeUnreportedMicros;
    byProvider.set(provider, current);

    totals.providerCostMicros += providerCostMicros;
    totals.customerChargeMicros += customerChargeMicros;
    totals.marginMicros += marginMicros;
    totals.stripeUnreportedMicros += stripeUnreportedMicros;
    if (row.billingClass === "activation") {
      totals.activationProviderCostMicros += providerCostMicros;
    }
    if (row.billingClass === "internal") {
      totals.internalProviderCostMicros += providerCostMicros;
    }
  }

  return {
    providerCostUsd: microsToUsd(totals.providerCostMicros),
    customerChargeUsd: microsToUsd(totals.customerChargeMicros),
    marginUsd: microsToUsd(totals.marginMicros),
    activationProviderCostUsd: microsToUsd(totals.activationProviderCostMicros),
    internalProviderCostUsd: microsToUsd(totals.internalProviderCostMicros),
    stripeUnreportedUsd: microsToUsd(totals.stripeUnreportedMicros),
    byProvider: [...byProvider.values()]
      .sort((a, b) =>
        b.providerCostMicros - a.providerCostMicros ||
        b.calls - a.calls ||
        a.provider.localeCompare(b.provider))
      .map((row) => ({
        ...row,
        providerCostUsd: microsToUsd(row.providerCostMicros),
        customerChargeUsd: microsToUsd(row.customerChargeMicros),
        marginUsd: microsToUsd(row.marginMicros),
        stripeUnreportedUsd: microsToUsd(row.stripeUnreportedMicros),
      })),
  };
}

export function customerChargeMicros(providerCostMicros: number, billingClass: ManagedBillingClass): number {
  return billingClass === "payg"
    ? Math.ceil(providerCostMicros * (1 + PAYG_MARGIN_RATE))
    : 0;
}

export function authorizeRealizedManagedCost(input: {
  reservedProviderCostMicros: number;
  providerCostUsd?: number;
  costSource: ManagedCostSource;
}): {
  reportedProviderCostMicros?: number;
  realizedInputMicros: number;
  effectiveCostSource: ManagedCostSource;
  billingException?: string;
} {
  if (input.costSource === "reservation") {
    return {
      realizedInputMicros: input.reservedProviderCostMicros,
      effectiveCostSource: "reservation",
    };
  }
  if (input.costSource === "zero_cost") {
    return {
      reportedProviderCostMicros: 0,
      realizedInputMicros: 0,
      effectiveCostSource: "zero_cost",
    };
  }
  if (input.providerCostUsd === undefined) {
    return {
      realizedInputMicros: input.reservedProviderCostMicros,
      effectiveCostSource: "reservation",
      billingException: "actual_cost_missing_reconciliation_required",
    };
  }

  let reportedProviderCostMicros: number;
  try {
    reportedProviderCostMicros = usdToMicros(input.providerCostUsd);
  } catch {
    return {
      realizedInputMicros: input.reservedProviderCostMicros,
      effectiveCostSource: "reservation",
      billingException: "reported_cost_outside_safe_range_reconciliation_required",
    };
  }
  if (reportedProviderCostMicros > input.reservedProviderCostMicros) {
    return {
      reportedProviderCostMicros,
      realizedInputMicros: input.reservedProviderCostMicros,
      effectiveCostSource: "reservation",
      billingException: "reported_cost_exceeds_authorized_reservation",
    };
  }
  return {
    reportedProviderCostMicros,
    realizedInputMicros: reportedProviderCostMicros,
    effectiveCostSource: input.costSource,
  };
}

export function managedFinalizationMatchesAuthorization(input: {
  authorizedProvider: string;
  authorizedModel?: string;
  reportedProvider?: string;
  reportedModel?: string;
  costSource: ManagedCostSource;
}): boolean {
  if (
    input.reportedProvider !== undefined &&
    input.reportedProvider.toLowerCase() !== input.authorizedProvider.toLowerCase()
  ) return false;
  if (
    input.reportedModel !== undefined &&
    input.authorizedModel !== undefined &&
    input.reportedModel !== input.authorizedModel
  ) return false;
  if (
    input.authorizedProvider.toLowerCase() === "openrouter" &&
    !["provider_response", "reservation", "zero_cost"].includes(input.costSource)
  ) return false;
  return true;
}

export const authorizeManagedCall = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    requestId: v.string(),
    requestFingerprint: v.string(),
    provider: v.string(),
    action: v.string(),
    model: v.optional(v.string()),
    path: v.string(),
    estimatedProviderCostUsd: v.optional(v.float64()),
    billingGradeCost: v.optional(v.boolean()),
    trafficClass: v.optional(trafficClassValidator),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.status !== "active") {
      return {
        allowed: false as const,
        reason: workspace ? "workspace_inactive" : "workspace_not_found",
        message: workspace ? `Workspace status is ${workspace.status}` : "Workspace not found",
      };
    }

    const existing = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_requestId", (q) => q.eq("requestId", args.requestId))
      .unique();
    if (existing) {
      if (
        existing.workspaceId !== args.workspaceId ||
        existing.provider !== args.provider ||
        existing.action !== args.action ||
        existing.model !== args.model ||
        existing.path !== args.path ||
        existing.requestFingerprint !== args.requestFingerprint
      ) {
        throw new Error("requestId collision across different managed calls");
      }
      return {
        allowed: false as const,
        duplicate: true,
        reason: duplicateManagedRequestReason(existing.status),
        ledgerId: existing._id,
        billingClass: existing.billingClass,
        trafficClass: existing.trafficClass,
        receipt: buildIdempotencyReplayReceipt(existing),
      };
    }

    const trafficClass = args.trafficClass === "internal" || isInternalTier(workspace.tier)
      ? "internal"
      : "customer";
    if (
      !isManagedActionAllowedForTraffic(args.provider, args.action, trafficClass)
    ) {
      return {
        allowed: false as const,
        reason: "managed_action_not_customer_executable",
        message: "This managed provider action is not available on APIClaw's public execution surface.",
      };
    }

    const decision = evaluateManagedUsage(workspace, {
      estimatedProviderCostUsd: args.estimatedProviderCostUsd,
      billingGradeCost: args.billingGradeCost,
      trafficClass: args.trafficClass as ManagedTrafficClass | undefined,
    });
    if (!decision.allowed) {
      return {
        allowed: false as const,
        reason: decision.reason,
        message: managedQuotaMessage(decision.reason),
        managedUsageCount: decision.managedUsageCount,
        managedUsageLimit: decision.managedUsageLimit,
        managedUsageRemaining: decision.managedUsageRemaining,
        activationProviderCostUsd: decision.activationProviderCostUsd,
        activationProviderCostCapUsd: decision.activationProviderCostCapUsd,
        activationProviderCostRemainingUsd: decision.activationProviderCostRemainingUsd,
        upgradeUrl: "https://apiclaw.cloud/upgrade",
      };
    }

    const now = Date.now();
    const reservationMicros = usdToMicros(args.estimatedProviderCostUsd ?? 0);
    const stripeBillingSnapshot = buildStripeBillingSnapshot(workspace, decision.billingClass);
    const currentManagedCount = workspace.managedUsageCount ?? workspace.usageCount ?? 0;
    const currentActivationCount = activationManagedCallCount(workspace);
    const patch: Record<string, unknown> = {
      usageCount: (workspace.usageCount ?? 0) + 1,
      managedUsageCount: currentManagedCount + 1,
      // Freeze the conservative legacy fallback before incrementing any class.
      // PAYG, internal, and contract calls therefore never consume activation.
      activationManagedCallCount: currentActivationCount,
      usageLimit: decision.billingClass === "activation" ? decision.managedUsageLimit : -1,
      updatedAt: now,
    };
    if (decision.billingClass === "activation") {
      patch.activationManagedCallCount = currentActivationCount + 1;
      patch.activationProviderCostMicros = (workspace.activationProviderCostMicros ?? 0) + reservationMicros;
    }
    await ctx.db.patch(args.workspaceId, patch);

    const ledgerId = await ctx.db.insert("managedCallLedger", {
      workspaceId: args.workspaceId,
      requestId: args.requestId,
      requestFingerprint: args.requestFingerprint,
      provider: args.provider,
      action: args.action,
      model: args.model,
      path: args.path,
      trafficClass: decision.trafficClass,
      billingClass: decision.billingClass,
      status: "authorized",
      reservedProviderCostMicros: reservationMicros,
      ...stripeBillingSnapshot,
      stripeStatus: "not_applicable",
      createdAt: now,
      updatedAt: now,
      authorizationLeaseExpiresAt: now + AUTHORIZATION_LEASE_MS,
    });

    return {
      allowed: true as const,
      duplicate: false,
      ledgerId,
      requestId: args.requestId,
      billingClass: decision.billingClass,
      trafficClass: decision.trafficClass,
      managedUsageCount: currentManagedCount + 1,
      activationManagedCallCount: decision.billingClass === "activation"
        ? currentActivationCount + 1
        : currentActivationCount,
      managedUsageLimit: decision.managedUsageLimit,
      managedUsageRemaining: decision.managedUsageRemaining,
      activationProviderCostUsd: decision.activationProviderCostUsd + microsToUsd(reservationMicros),
      activationProviderCostCapUsd: decision.activationProviderCostCapUsd,
      quotaWarning: decision.warning,
    };
  },
});

export const finalizeManagedCall = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    success: v.boolean(),
    providerCostUsd: v.optional(v.float64()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    upstreamRequestId: v.optional(v.string()),
    costSource: v.optional(costSourceValidator),
    terminalCode: v.optional(v.string()),
    executionCertainty: v.optional(v.union(
      v.literal("not_dispatched"),
      v.literal("provider_rejected"),
      v.literal("provider_terminal_failure"),
      v.literal("completed"),
      v.literal("uncertain"),
    )),
    operatorActionRequired: v.optional(v.boolean()),
    retryAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (!ledger) throw new Error("Managed call ledger entry not found");
    if (ledger.status !== "authorized") {
      return {
        success: ledger.status === "succeeded",
        alreadyFinalized: true,
        ledgerId: ledger._id,
        providerCostMicros: ledger.providerCostMicros ?? 0,
        customerChargeMicros: ledger.customerChargeMicros ?? 0,
        marginMicros: ledger.marginMicros ?? 0,
        reservedProviderCostMicros: ledger.reservedProviderCostMicros,
        reportedProviderCostMicros: ledger.reportedProviderCostMicros,
        billingException: ledger.billingException,
      };
    }

    const workspace = await ctx.db.get(ledger.workspaceId);
    if (!workspace) throw new Error("Workspace not found while finalizing managed call");

    const now = Date.now();
    const requestedCostSource = args.costSource ??
      (args.providerCostUsd === 0 ? "zero_cost" : "reservation");
    const providerMismatch = args.provider !== undefined &&
      args.provider.toLowerCase() !== ledger.provider.toLowerCase();
    const modelMismatch = args.model !== undefined &&
      ledger.model !== undefined &&
      args.model !== ledger.model;
    const authorizationMismatch = !managedFinalizationMatchesAuthorization({
      authorizedProvider: ledger.provider,
      authorizedModel: ledger.model,
      reportedProvider: args.provider,
      reportedModel: args.model,
      costSource: requestedCostSource,
    });
    const authorizedCost = authorizationMismatch
      ? {
          realizedInputMicros: ledger.reservedProviderCostMicros,
          effectiveCostSource: "reservation" as const,
          billingException: "finalization_does_not_match_authorization",
        }
      : authorizeRealizedManagedCost({
          reservedProviderCostMicros: ledger.reservedProviderCostMicros,
          providerCostUsd: args.providerCostUsd,
          costSource: requestedCostSource,
        });
    const reportedProviderCostMicros = authorizedCost.realizedInputMicros;
    const costSource = authorizedCost.effectiveCostSource;
    const reservationOnly = costSource === "reservation";
    // A reservation is a pre-call upper bound, never evidence of realized
    // provider spend. Keep the reservation separately and flag successful calls
    // that returned without an actual-cost source for operator reconciliation.
    const realizedCost = resolveRealizedManagedCost(
      reportedProviderCostMicros,
      ledger.billingClass,
      args.success,
      costSource,
    );
    const { providerCostMicros, customerChargeMicros: chargeMicros, marginMicros } = realizedCost;
    const billingException = authorizedCost.billingException ?? realizedCost.billingException;
    const workspacePatch: Record<string, unknown> = {};

    if (ledger.billingClass === "activation") {
      const current = workspace.activationProviderCostMicros ?? ledger.reservedProviderCostMicros;
      workspacePatch.activationProviderCostMicros = resolveActivationProviderCostMicros({
        currentProviderCostMicros: current,
        reservedProviderCostMicros: ledger.reservedProviderCostMicros,
        reportedProviderCostMicros: authorizedCost.reportedProviderCostMicros,
        realizedProviderCostMicros: providerCostMicros,
        success: args.success,
        costSource,
        billingException,
      });
      if (!args.success && providerCostMicros === 0) {
        workspacePatch.managedUsageCount = Math.max(0, (workspace.managedUsageCount ?? workspace.usageCount ?? 1) - 1);
        workspacePatch.usageCount = Math.max(0, (workspace.usageCount ?? 1) - 1);
        workspacePatch.activationManagedCallCount = Math.max(
          0,
          activationManagedCallCount(workspace) - 1,
        );
      }
    }
    if (shouldPlaceManagedCostHold({
      trafficClass: ledger.trafficClass,
      billingClass: ledger.billingClass,
      billingException,
    })) {
      // A customer billing anomaly must trip a sticky circuit before another
      // request can spend against the same supplier rail. It is deliberately
      // not cleared by ordinary subscription or invoice updates.
      workspacePatch.stripeSubscriptionStatus = "managed_cost_hold";
      workspacePatch.managedCostHoldAt = now;
      workspacePatch.managedCostHoldReason = billingException;
    }
    if (Object.keys(workspacePatch).length > 0) {
      workspacePatch.updatedAt = now;
      await ctx.db.patch(ledger.workspaceId, workspacePatch);
    }

    await ctx.db.patch(ledger._id, {
      status: args.success ? "succeeded" : "failed",
      provider: providerMismatch ? ledger.provider : (args.provider ?? ledger.provider),
      model: modelMismatch ? ledger.model : (args.model ?? ledger.model),
      providerCostMicros,
      customerChargeMicros: args.success ? chargeMicros : 0,
      marginMicros: args.success ? marginMicros : 0,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      upstreamRequestId: args.upstreamRequestId,
      costSource,
      reportedProviderCostMicros: authorizedCost.reportedProviderCostMicros,
      billingException,
      terminalCode: args.terminalCode,
      executionCertainty: args.executionCertainty,
      operatorActionRequired: args.operatorActionRequired,
      retryAttempts: args.retryAttempts,
      reconciliationRequiredAt: billingException ? now : undefined,
      stripeStatus: realizedCost.stripePending
        ? "pending"
        : "not_applicable",
      completedAt: now,
      updatedAt: now,
    });

    // Best-effort: surface realized cost on the matching apiLogs row for
    // Activity/analytics. Never let an analytics patch fail the caller's
    // already-finalized billing outcome.
    try {
      await ctx.runMutation(internal.logs.attachCost, {
        requestId: ledger.requestId,
        costCents: microsToCents(args.success ? chargeMicros : 0),
      });
    } catch (e) {
      console.warn("[finalizeManagedCall] attachCost failed:", e instanceof Error ? e.message : e);
    }

    return {
      success: args.success,
      alreadyFinalized: false,
      ledgerId: ledger._id,
      providerCostMicros,
      customerChargeMicros: args.success ? chargeMicros : 0,
      marginMicros: args.success ? marginMicros : 0,
      reservedProviderCostMicros: ledger.reservedProviderCostMicros,
      reportedProviderCostMicros: authorizedCost.reportedProviderCostMicros,
      billingException,
    };
  },
});

export const markInternalOutcomeUnknown = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    code: v.string(),
    attempts: v.number(),
  },
  returns: v.object({
    marked: v.boolean(),
    requestId: v.string(),
    terminalCode: v.string(),
    executionCertainty: v.literal("uncertain"),
    operatorActionRequired: v.boolean(),
    retryAttempts: v.number(),
  }),
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (!ledger) throw new Error("Managed call ledger entry not found");
    if (ledger.trafficClass !== "internal" || ledger.provider !== "openai-codex") {
      throw new Error("Outcome-unknown closure is restricted to internal openai-codex calls");
    }
    if (ledger.status !== "authorized") {
      return {
        marked: false,
        requestId: ledger.requestId,
        terminalCode: ledger.terminalCode ?? args.code,
        executionCertainty: "uncertain" as const,
        operatorActionRequired: ledger.operatorActionRequired ?? true,
        retryAttempts: ledger.retryAttempts ?? args.attempts,
      };
    }
    const now = Date.now();
    await ctx.db.patch(ledger._id, {
      status: "failed",
      providerCostMicros: 0,
      customerChargeMicros: 0,
      marginMicros: 0,
      costSource: "zero_cost",
      stripeStatus: "not_applicable",
      terminalCode: args.code,
      executionCertainty: "uncertain",
      operatorActionRequired: true,
      retryAttempts: args.attempts,
      completedAt: now,
      updatedAt: now,
    });
    return {
      marked: true,
      requestId: ledger.requestId,
      terminalCode: args.code,
      executionCertainty: "uncertain" as const,
      operatorActionRequired: true,
      retryAttempts: args.attempts,
    };
  },
});

export const markInternalOperatorAlertDelivered = internalMutation({
  args: {
    ledgerId: v.id("managedCallLedger"),
    deliveredAt: v.number(),
  },
  returns: v.object({ marked: v.boolean() }),
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId);
    if (
      !ledger ||
      ledger.executionCertainty !== "uncertain" ||
      ledger.operatorActionRequired !== true ||
      ledger.operatorAlertSentAt !== undefined
    ) {
      return { marked: false };
    }
    await ctx.db.patch(ledger._id, {
      operatorAlertSentAt: args.deliveredAt,
      updatedAt: Math.max(ledger.updatedAt, args.deliveredAt),
    });
    return { marked: true };
  },
});

export const getLedger = internalQuery({
  args: { ledgerId: v.id("managedCallLedger") },
  handler: async (ctx, { ledgerId }) => ctx.db.get(ledgerId),
});

export const getLedgerByRequestId = internalQuery({
  args: { requestId: v.string() },
  handler: async (ctx, { requestId }) => ctx.db
    .query("managedCallLedger")
    .withIndex("by_requestId", (q) => q.eq("requestId", requestId))
    .unique(),
});

export const getOperatingSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const [workspaces, sessions, recentLedger] = await Promise.all([
      ctx.db.query("workspaces").collect(),
      ctx.db.query("agentSessions").collect(),
      ctx.db
        .query("managedCallLedger")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", thirtyDaysAgo))
        .collect(),
    ]);

    const active = workspaces.filter((workspace) => workspace.status === "active");
    const customer = active.filter((workspace) => !["founder", "partner"].includes(workspace.tier));
    const activationUsage = customer.map((workspace) => activationManagedCallCount(workspace));
    const billingClasses = recentLedger.reduce<Record<string, number>>((out, row) => {
      out[row.billingClass] = (out[row.billingClass] ?? 0) + 1;
      return out;
    }, {});
    const cost = summarizeManagedLedger(recentLedger);

    return {
      generatedAt: now,
      workspaces: {
        total: workspaces.length,
        active: active.length,
        createdLast7d: workspaces.filter((workspace) => workspace.createdAt >= sevenDaysAgo).length,
        customer: customer.length,
        founderOrPartner: active.length - customer.length,
        nearLifetimeCap: activationUsage.filter((count) => count >= 20 && count < 25).length,
        atOrOverLifetimeCap: activationUsage.filter((count) => count >= 25).length,
        paygReady: active.filter((workspace) => hasActivePaygEntitlement(workspace)).length,
      },
      auth: {
        sessions: sessions.length,
        sessionsUsedLast7d: sessions.filter((session) => (session.lastUsedAt ?? session.createdAt) >= sevenDaysAgo).length,
      },
      managedLedger30d: {
        total: recentLedger.length,
        succeeded: recentLedger.filter((row) => row.status === "succeeded").length,
        failed: recentLedger.filter((row) => row.status === "failed").length,
        authorized: recentLedger.filter((row) => row.status === "authorized").length,
        stripePending: recentLedger.filter((row) => row.stripeStatus === "pending").length,
        stripeClaiming: recentLedger.filter((row) => row.stripeStatus === "claiming").length,
        stripeReported: recentLedger.filter((row) => row.stripeStatus === "reported").length,
        billingExceptions: recentLedger.filter((row) => !!row.billingException).length,
        billingClasses,
        cost,
      },
    };
  },
});

export const releaseStaleAuthorizations = internalMutation({
  args: { olderThanMs: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, { olderThanMs, limit = 100 }) => {
    const cutoff = Date.now() - olderThanMs;
    const authorized = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_status", (q) => q.eq("status", "authorized"))
      .take(Math.max(1, Math.min(500, limit)));
    let flagged = 0;
    for (const ledger of authorized) {
      const now = Date.now();
      if (!authorizationNeedsReconciliation(ledger, now, olderThanMs)) continue;
      await ctx.db.patch(ledger._id, {
        billingException: "stale_authorization_reconciliation_required",
        reconciliationRequiredAt: now,
        updatedAt: now,
      });
      flagged += 1;
    }
    // Compatibility shape for the existing cron. No authorization, counter, or
    // reservation is ever auto-released because an upstream outcome may be
    // ambiguous. An operator must reconcile it from provider evidence.
    return { released: 0, flagged, cutoff };
  },
});

export type ManagedCallAuthorization = {
  ledgerId: Id<"managedCallLedger">;
  requestId: string;
  billingClass: ManagedBillingClass;
  trafficClass: ManagedTrafficClass;
  quotaWarning?: unknown;
};
