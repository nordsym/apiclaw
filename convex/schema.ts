import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Credits per agent
  agentCredits: defineTable({
    agentId: v.string(),
    balanceUsd: v.number(),
    currency: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_agentId", ["agentId"]),

  // Purchases (API access bought by agents)
  purchases: defineTable({
    agentId: v.string(),
    providerId: v.string(),
    amountUsd: v.number(),
    creditsGranted: v.number(),
    status: v.string(), // active, exhausted, refunded
    credentials: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_providerId", ["providerId"])
    .index("by_agentId_providerId", ["agentId", "providerId"]),

  // Usage tracking per purchase
  usage: defineTable({
    purchaseId: v.id("purchases"),
    providerId: v.string(),
    unitsUsed: v.number(),
    unitsRemaining: v.number(),
    costIncurredUsd: v.number(),
    lastUsedAt: v.number(),
  })
    .index("by_purchaseId", ["purchaseId"])
    .index("by_providerId", ["providerId"]),

  // ============================================
  // WORKSPACE TABLES (MCP Agent Authentication)
  // ============================================

  // Workspaces (agent owner accounts)
  workspaces: defineTable({
    email: v.string(),
    workspaceName: v.optional(v.string()), // Display name (e.g., "APILayer", "My Team")
    passwordHash: v.optional(v.string()),
    status: v.string(), // "pending" | "active" | "suspended"
    tier: v.string(), // "free" | "pro" | "scale" | "usage_based" | "enterprise" | "partner"
    usageCount: v.number(), // total API calls made (lifetime)
    usageLimit: v.number(), // max API calls for tier
    // Canonical managed-usage counters. Unlike the legacy weekly fields below,
    // these never reset. Existing workspaces fall back to usageCount until their
    // first M-5 authorization writes managedUsageCount.
    managedUsageCount: v.optional(v.number()),
    activationManagedCallCount: v.optional(v.number()),
    activationProviderCostMicros: v.optional(v.number()),
    // Weekly usage (resets every Monday 00:00 UTC)
    weeklyUsageCount: v.optional(v.number()), // calls this week
    weeklyUsageLimit: v.optional(v.number()), // 50 for free, unlimited for paid tiers
    lastWeeklyResetAt: v.optional(v.number()), // timestamp of last reset
    // Hourly rate limit
    hourlyUsageCount: v.optional(v.number()), // calls this hour
    lastHourlyResetAt: v.optional(v.number()), // timestamp of last hourly reset
    // Legacy field (no longer used)
    backerUntil: v.optional(v.number()),
    // Main agent identification
    mainAgentId: v.optional(v.string()), // UUID, auto-generated on first call
    mainAgentName: v.optional(v.string()), // Auto-generated name (e.g., "Crimson Phoenix")
    // AI Backend tracking
    aiBackend: v.optional(v.string()), // "claude-3-opus", "gpt-4", etc.
    aiBackendLastSeen: v.optional(v.number()), // timestamp of last AI backend header
    // Stripe billing fields
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeSubscriptionStatus: v.optional(v.string()), // "active" | "trialing" | "past_due" | "canceled" | "incomplete"
    billingPlan: v.optional(v.string()), // "free" | "usage_based" | "starter" | "pro" | "scale"
    paygMeterReadyAt: v.optional(v.number()),
    paygMeterPriceId: v.optional(v.string()),
    paygMeterId: v.optional(v.string()),
    paygMeterEventName: v.optional(v.string()),
    paygActivationId: v.optional(v.string()),
    paygActivationStartedAt: v.optional(v.number()),
    creditBalance: v.optional(v.number()), // prepaid credits in cents
    lastBillingDate: v.optional(v.number()),
    // Payment method fields
    hasPaymentMethod: v.optional(v.boolean()),
    hasCardAttached: v.optional(v.boolean()), // mirror of hasPaymentMethod, set at subscription/payment-method attach time
    paymentMethodType: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    // Per-workspace gating override (shadow-mode bypass flag)
    // true  => enforce auth/billing gate even if env is in shadow mode
    // false => never gate this workspace (legacy grandfather)
    // unset => follow AUTH_ENFORCEMENT env
    gatingEnabled: v.optional(v.boolean()),
    // Referral fields
    referralCode: v.optional(v.string()), // CLAW-XXXXXX format
    referredBy: v.optional(v.id("workspaces")), // who referred this user
    // Budget & Spend Alerts (PRD 2.6)
    budgetCap: v.optional(v.number()), // Monthly budget cap in USD cents (null = unlimited)
    budgetAlertSentAt: v.optional(v.number()), // When 80% alert was last sent (resets monthly)
    pauseOnBudgetExceeded: v.optional(v.boolean()), // If true, block execution when budget exceeded
    monthlySpendCents: v.optional(v.number()), // Current month's spend in cents
    lastSpendResetAt: v.optional(v.number()), // When monthly spend was last reset
    // Activity tracking
    lastActiveAt: v.optional(v.number()), // Last API call timestamp (main agent)
    // A-15 post-auth welcome - set after successful delivery so the shared
    // nurture ledger and fast welcome path never send a second welcome.
    postVerifyNudgeSentAt: v.optional(v.number()),
    // Independent sticky circuit for provider-cost integrity anomalies. This
    // cannot be cleared by ordinary Stripe lifecycle or payment-method events.
    managedCostHoldAt: v.optional(v.number()),
    managedCostHoldReason: v.optional(v.string()),
    // Internal-only activation watchdog marker. Set after the operator alert
    // is accepted by Inbound Net so a stalled signup is reported once.
    activationStalledAlertSentAt: v.optional(v.number()),
    // One-shot first managed execute after Clerk session establish. Set when
    // the server claims the NASA/Frankfurter rail so a workspace cannot loop.
    firstExecuteAttemptedAt: v.optional(v.number()),
    // Onboarding wizard state
    onboardingCompletedAt: v.optional(v.number()), // null = wizard pending
    onboardingDismissedAt: v.optional(v.number()), // Tracks "skip for now" -- toast instead of full wizard on next visit
    onboardingSource: v.optional(v.string()), // "X / Twitter", "Reddit / Hacker News", etc.
    onboardingBuilding: v.optional(v.string()), // freeform: what user is building
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_status", ["status"])
    .index("by_referralCode", ["referralCode"])
    .index("by_mainAgentId", ["mainAgentId"]),

  // Invoices (Stripe invoice records)
  invoices: defineTable({
    workspaceId: v.id("workspaces"),
    stripeInvoiceId: v.string(),
    amount: v.number(), // in cents
    status: v.string(), // "paid" | "pending" | "failed" | "void"
    periodStart: v.number(),
    periodEnd: v.number(),
    callCount: v.number(),
    pdfUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_stripeInvoiceId", ["stripeInvoiceId"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"]),

  // Usage records (daily aggregation for billing)
  usageRecords: defineTable({
    workspaceId: v.id("workspaces"),
    date: v.string(), // "2026-02-28" format
    callCount: v.number(),
    providerCostUsd: v.optional(v.float64()), // actual provider cost accumulated
    apiclawCostUsd: v.optional(v.float64()),  // provider cost + 15% margin accumulated
    reportedToStripe: v.boolean(),
    stripeUsageRecordId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_date", ["date"])
    .index("by_workspaceId_date", ["workspaceId", "date"])
    .index("by_reportedToStripe", ["reportedToStripe"]),

  // One immutable billing identity per managed upstream attempt. This is the
  // reconciliation source for provider spend and Stripe metering; daily
  // usageRecords remain a legacy reporting aggregate only.
  managedCallLedger: defineTable({
    workspaceId: v.id("workspaces"),
    requestId: v.string(),
    requestFingerprint: v.optional(v.string()),
    provider: v.string(),
    action: v.string(),
    model: v.optional(v.string()),
    path: v.string(),
    trafficClass: v.union(v.literal("customer"), v.literal("internal"), v.literal("byok")),
    billingClass: v.union(
      v.literal("activation"),
      v.literal("payg"),
      v.literal("internal"),
      v.literal("contract"),
      v.literal("byok")
    ),
    status: v.union(
      v.literal("authorized"),
      v.literal("succeeded"),
      v.literal("failed")
    ),
    terminalCode: v.optional(v.string()),
    executionCertainty: v.optional(v.union(
      v.literal("not_dispatched"),
      v.literal("provider_rejected"),
      v.literal("provider_terminal_failure"),
      v.literal("completed"),
      v.literal("uncertain")
    )),
    operatorActionRequired: v.optional(v.boolean()),
    retryAttempts: v.optional(v.number()),
    operatorAlertSentAt: v.optional(v.number()),
    reservedProviderCostMicros: v.number(),
    // Immutable-at-authorization PAYG billing context. Metering must never
    // reconstruct a historical charge from mutable workspace configuration.
    stripeCustomerIdSnapshot: v.optional(v.string()),
    stripeSubscriptionIdSnapshot: v.optional(v.string()),
    stripePriceIdSnapshot: v.optional(v.string()),
    stripeMeterIdSnapshot: v.optional(v.string()),
    stripeMeterEventNameSnapshot: v.optional(v.string()),
    providerCostMicros: v.optional(v.number()),
    // Raw provider-reported cost retained when it exceeded the authorized
    // reservation. It is evidence for reconciliation, never automatic billing.
    reportedProviderCostMicros: v.optional(v.number()),
    customerChargeMicros: v.optional(v.number()),
    marginMicros: v.optional(v.number()),
    costSource: v.optional(v.union(
      v.literal("provider_response"),
      v.literal("token_price_table"),
      v.literal("fixed_price_policy"),
      v.literal("reservation"),
      v.literal("zero_cost")
    )),
    billingException: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    upstreamRequestId: v.optional(v.string()),
    stripeStatus: v.union(
      v.literal("not_applicable"),
      v.literal("pending"),
      v.literal("claiming"),
      v.literal("reported")
    ),
    stripeMeterEventIdentifier: v.optional(v.string()),
    stripeClaimedAt: v.optional(v.number()),
    stripeReportedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    authorizationLeaseExpiresAt: v.optional(v.number()),
    reconciliationRequiredAt: v.optional(v.number()),
  })
    .index("by_requestId", ["requestId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_stripeStatus", ["stripeStatus"]),

  // Workspace API Keys (persistent keys for programmatic access)
  workspaceApiKeys: defineTable({
    workspaceId: v.id("workspaces"),
    key: v.string(), // "sk-claw-" + 48 random chars (hashed after creation)
    keyHash: v.string(), // SHA-256 hash for lookup (key itself not stored after first show)
    keyPrefix: v.string(), // "sk-claw-...last4" for display
    name: v.string(), // user label ("Production", "My Agent")
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_keyHash", ["keyHash"])
    .index("by_workspaceId", ["workspaceId"]),

  // Agent sessions (for MCP server authentication)
  agentSessions: defineTable({
    workspaceId: v.id("workspaces"),
    sessionToken: v.string(),
    // Existing rows without sessionKind are durable owner/agent sessions.
    // Browser sessions are short-lived children minted from an owner session
    // and must always carry both parentSessionId and expiresAt.
    sessionKind: v.optional(v.union(v.literal("owner"), v.literal("browser"))),
    parentSessionId: v.optional(v.id("agentSessions")),
    expiresAt: v.optional(v.number()),
    fingerprint: v.optional(v.string()), // machine fingerprint
    customName: v.optional(v.string()), // user-defined name
    lastUsedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_parentSessionId", ["parentSessionId"]),

  // Agents — one per unique (fingerprint, mcpClient) pair
  // An agent = an MCP client installation, NOT a login session
  agents: defineTable({
    fingerprint: v.string(), // hostname:username
    mcpClient: v.string(), // "claude-desktop" | "claude-code" | "cursor" | "windsurf" | "cline" | "continue" | "unknown"
    workspaceId: v.id("workspaces"), // always linked — auto-created on first call
    name: v.optional(v.string()), // auto-generated or user-set (see nameSetByUser)
    nameSetByUser: v.optional(v.boolean()), // true once `name` was set via renameAgent, not auto-generated (real names, 2026-08-24)
    aiBackend: v.optional(v.string()), // "claude-3-opus" etc
    platform: v.optional(v.string()), // "darwin" | "linux" | "win32"
    callCount: v.number(),
    firstSeenAt: v.number(),
    lastActiveAt: v.number(),
    defaultModel: v.optional(v.string()), // per-agent default model override (BYOH B1, 2026-08-24)
  })
    .index("by_fingerprint_client", ["fingerprint", "mcpClient"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_lastActiveAt", ["lastActiveAt"])
    .index("by_mcpClient", ["mcpClient"]),

  // Subagent tracking (tasks spawned by main agent)
  subagents: defineTable({
    workspaceId: v.id("workspaces"),
    subagentId: v.string(), // from X-APIClaw-Subagent header
    name: v.optional(v.string()), // optional display name
    description: v.optional(v.string()), // user-provided description
    aiBackend: v.optional(v.string()), // "claude-3-opus", "gpt-4", etc.
    isRegistered: v.optional(v.boolean()), // true if pre-registered (not implicit)
    callCount: v.number(),
    firstSeenAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_subagentId", ["workspaceId", "subagentId"])
    .index("by_lastActiveAt", ["lastActiveAt"]),

  // Search logs (analytics for workspace searches)
  searchLogs: defineTable({
    workspaceId: v.id("workspaces"),
    subagentId: v.optional(v.string()),
    query: v.string(),
    resultCount: v.number(),
    hasResults: v.boolean(),
    matchedProviders: v.optional(v.array(v.string())),
    responseTimeMs: v.number(),
    timestamp: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_hasResults", ["hasResults"])
    .index("by_workspaceId_timestamp", ["workspaceId", "timestamp"]),

  // Workspace team members (invite-based access)
  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    invitedBy: v.optional(v.string()), // email of inviter
    inviteToken: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("revoked")),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_email", ["email"])
    .index("by_inviteToken", ["inviteToken"])
    .index("by_workspaceId_email", ["workspaceId", "email"]),

  // Magic links for workspace email verification
  workspaceMagicLinks: defineTable({
    email: v.string(),
    token: v.string(),
    sessionFingerprint: v.optional(v.string()),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // CLI browser-loopback auth codes (A-22 agent-native auth).
  // Three-phase: start() → claim() (after Clerk) → exchange() (PKCE verified).
  cliAuthCodes: defineTable({
    authId: v.string(),         // CLI nonce, looked up by browser page
    state: v.string(),          // CSRF nonce, returned to localhost callback
    challenge: v.string(),      // PKCE: base64url(sha256(verifier))
    port: v.number(),           // loopback port (informational)
    fingerprint: v.optional(v.string()),
    status: v.string(),         // "pending" | "claimed" | "exchanged"
    code: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    exchangedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_code", ["code"]),

  // Credit top-ups (from Stripe payments)
  creditTopups: defineTable({
    agentId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    amountUsd: v.number(),
    creditsGranted: v.number(),
    packageType: v.string(), // starter, growth, scale
    status: v.string(), // pending, completed, failed
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_agentId", ["agentId"])
    .index("by_stripeSessionId", ["stripeSessionId"])
    .index("by_stripePaymentIntentId", ["stripePaymentIntentId"]),

  // ============================================
  // PROVIDER TABLES (for provider dashboard)
  // ============================================

  // API Providers (companies/individuals offering APIs)
  providers: defineTable({
    email: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    website: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    stripeConnectId: v.optional(v.string()), // for payouts
    stripeOnboardingComplete: v.optional(v.boolean()),
    status: v.string(), // pending, approved, rejected, suspended
    workspaceId: v.optional(v.id("workspaces")), // Link to unified workspace identity
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_stripeConnectId", ["stripeConnectId"])
    .index("by_status", ["status"])
    .index("by_workspaceId", ["workspaceId"]),

  // APIs listed by providers (self-service onboarding)
  providerAPIs: defineTable({
    providerId: v.optional(v.id("providers")), // legacy — prefer workspaceId
    workspaceId: v.optional(v.id("workspaces")), // new — workspace owns this API
    name: v.string(),
    description: v.string(),
    category: v.string(),
    openApiUrl: v.optional(v.string()),
    docsUrl: v.optional(v.string()),
    baseUrl: v.optional(v.string()), // canonical origin used by universal proxy
    pricingModel: v.string(), // free, freemium, paid
    pricingNotes: v.optional(v.string()),
    status: v.string(), // active, paused
    // Binary callable funnel (GTM canon):
    //   "live"      — callable via /v1/call (managed adapter or open proxy)
    //   "discovery" — searchable in registry, not callable
    listingStatus: v.optional(v.string()),
    // How /v1/call authenticates upstream:
    //   "managed" — APIClaw holds the provider key (46 managed-provider adapters)
    //   "none"    — keyless public API, universal pass-through
    //   "unknown" — auth model not mapped, cannot be called (= discovery lane)
    authType: v.optional(v.string()),
    // Execution mode used by /v1/call:
    //   "direct_call"     — dispatch to existing /proxy/{providerName} adapter
    //   "open_proxy"      — generic fetch via baseUrl + agent-supplied path
    //   "discovery_only"  — reject with helpful error
    proxyMode: v.optional(v.string()),
    // Circuit-breaker state — NEVER deleted, only patched.
    healthStatus: v.optional(v.string()), // "healthy" | "degraded" | "down"
    lastHealthCheckAt: v.optional(v.number()),
    consecutiveFailures: v.optional(v.number()),
    circuitOpenUntil: v.optional(v.number()), // epoch ms — if set & in future, calls return 503
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
    // Analytics
    discoveryCount: v.optional(v.number()),
    lastDiscoveredAt: v.optional(v.number()),
  })
    .index("by_providerId", ["providerId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_status_category", ["status", "category"])
    .index("by_listingStatus", ["listingStatus"])
    .index("by_authType", ["authType"])
    .index("by_name", ["name"]),

  // APIs listed by providers (for full dashboard)
  apis: defineTable({
    providerId: v.id("providers"),
    workspaceId: v.optional(v.id("workspaces")), // Parallel workspace link
    name: v.string(),
    description: v.string(),
    category: v.string(),
    icon: v.optional(v.string()), // emoji or URL
    baseUrl: v.string(),
    docsUrl: v.optional(v.string()),
    authType: v.string(), // api_key, oauth, basic, bearer
    pricingModel: v.string(), // free, per_call, monthly, credits
    pricePerCall: v.optional(v.number()), // in USD cents
    monthlyPrice: v.optional(v.number()), // in USD cents
    rateLimitPerMinute: v.optional(v.number()),
    regions: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    status: v.string(), // active, paused, pending_review
    isPublic: v.boolean(),
    // Credentials (encrypted in production)
    credentialTemplate: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_providerId", ["providerId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // API Calls / Usage logs (for analytics)
  apiCalls: defineTable({
    apiId: v.id("apis"),
    providerId: v.id("providers"),
    workspaceId: v.optional(v.id("workspaces")), // Parallel workspace link
    agentId: v.string(),
    endpoint: v.optional(v.string()),
    method: v.optional(v.string()),
    statusCode: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    costUsd: v.number(), // cost in USD (fractional)
    region: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_apiId", ["apiId"])
    .index("by_providerId", ["providerId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_agentId", ["agentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_providerId_timestamp", ["providerId", "timestamp"]),

  // Provider Payouts
  payouts: defineTable({
    providerId: v.id("providers"),
    workspaceId: v.optional(v.id("workspaces")), // Parallel workspace link
    amountUsd: v.number(),
    status: v.string(), // pending, processing, completed, failed
    stripePayoutId: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_providerId", ["providerId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_status", ["status"]),

  // OTP codes for terminal-native email verification
  otpCodes: defineTable({
    email: v.string(),
    code: v.string(), // 6-digit code
    fingerprint: v.optional(v.string()),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    attempts: v.number(), // failed attempts counter
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_email_code", ["email", "code"]),

  // Magic link tokens for email auth
  magicLinks: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // Retained only so historical device-link rows remain readable during the
  // retirement window. Public start/poll/complete handlers no longer issue or
  // reveal workspace bearers. CLI loopback auth is canonical.
  deviceAuthCodes: defineTable({
    code: v.string(),                     // short opaque token in the URL
    fingerprint: v.optional(v.string()),  // device fingerprint that started the request
    status: v.string(),                   // "pending" | "linked" | "expired"
    sessionToken: v.optional(v.string()), // populated when status = "linked"
    workspaceId: v.optional(v.id("workspaces")),
    email: v.optional(v.string()),
    expiresAt: v.number(),
    createdAt: v.number(),
    linkedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  // Sessions for authenticated providers
  sessions: defineTable({
    providerId: v.id("providers"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_providerId", ["providerId"]),

  // Rate limiting
  rateLimits: defineTable({
    key: v.string(),
    identifier: v.string(),
    action: v.string(),
    count: v.number(),
    hourBucket: v.number(),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_identifier", ["identifier"]),

  // Usage analytics
  analytics: defineTable({
    event: v.string(),  // "discovery", "instant", "search_query"
    provider: v.optional(v.string()),
    query: v.optional(v.string()),
    identifier: v.string(),
    workspaceId: v.optional(v.id("workspaces")), // Claimed workspace (null = anonymous)
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_timestamp", ["timestamp"])
    .index("by_provider", ["provider"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_identifier", ["identifier"]),

  // ============================================
  // FUNNEL EVENTS — canonical conversion truth
  // install -> first_run -> register_owner -> verify_code -> first_call_api_success
  // ============================================
  funnelEvents: defineTable({
    event: v.string(), // one of FUNNEL_EVENTS (see convex/funnel.ts)
    classification: v.string(), // "human" | "ci" | "bot" | "internal"
    workspaceId: v.optional(v.id("workspaces")),
    fingerprint: v.optional(v.string()),
    // Deprecated security-migration field. No new write path accepts it.
    // Remove after funnel:scrubStoredSessionTokens has run in production.
    sessionToken: v.optional(v.string()),
    email: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    mcpClient: v.optional(v.string()),
    platform: v.optional(v.string()),
    version: v.optional(v.string()),
    dedupeKey: v.optional(v.string()), // for first-time events (install/first_run/first_call)
    props: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_classification", ["classification"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_fingerprint", ["fingerprint"])
    .index("by_dedupeKey", ["dedupeKey"])
    .index("by_timestamp", ["timestamp"])
    .index("by_event_timestamp", ["event", "timestamp"]),

  // MCP Server telemetry (anonymous usage tracking)
  telemetry: defineTable({
    type: v.string(),  // "startup", "search", "execute", "discovery"
    query: v.optional(v.string()),
    apiId: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    responseTimeMs: v.optional(v.number()),
    version: v.string(),
    platform: v.string(),
    nodeVersion: v.string(),
    timestamp: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================
  // SELF-SERVICE DIRECT CALL TABLES
  // ============================================

  // Provider managed routing configuration (master key, limits, pricing)
  providerDirectCall: defineTable({
    providerId: v.id("providers"),
    workspaceId: v.optional(v.id("workspaces")), // Parallel workspace link
    apiId: v.optional(v.id("providerAPIs")),
    baseUrl: v.string(),
    authType: v.string(), // "bearer" | "basic" | "api_key" | "none"
    authHeader: v.string(), // e.g. "Authorization", "X-API-Key"
    authPrefix: v.string(), // e.g. "Bearer ", "Basic ", ""
    encryptedMasterKey: v.string(),
    rateLimitPerUser: v.number(), // requests per minute per user
    rateLimitPerDay: v.number(), // requests per day per user
    pricePerRequest: v.number(), // in USD cents
    status: v.string(), // "draft" | "testing" | "live"
    // Customer key passthrough settings
    allowCustomerKeys: v.optional(v.boolean()), // Allow agents to pass their own API key (default: true)
    requireCustomerKeys: v.optional(v.boolean()), // Require customer key, no master key fallback (default: false)
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_providerId", ["providerId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_apiId", ["apiId"])
    .index("by_status", ["status"]),

  // Actions defined by providers for their managed-provider APIs
  providerActions: defineTable({
    directCallId: v.id("providerDirectCall"),
    name: v.string(), // machine name, e.g. "send_sms"
    displayName: v.string(), // human-friendly, e.g. "Send SMS"
    description: v.string(),
    method: v.string(), // "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    path: v.string(), // e.g. "/v1/messages" or "/users/{userId}"
    params: v.array(v.object({
      name: v.string(),
      type: v.string(), // "string" | "number" | "boolean" | "object"
      required: v.boolean(),
      description: v.string(),
      default: v.optional(v.any()),
      in: v.string(), // "body" | "query" | "path"
    })),
    responseMapping: v.array(v.object({
      name: v.string(),
      path: v.string(), // JSON path, e.g. "data.id" or "results[0].name"
    })),
    enabled: v.boolean(),
    // Confirmation settings for costly actions
    requiresConfirmation: v.optional(v.boolean()), // If true, requires user confirmation before executing
    estimatedCost: v.optional(v.string()), // Human-readable cost estimate, e.g. "~2-5 SEK per invoice"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_directCallId", ["directCallId"])
    .index("by_directCallId_name", ["directCallId", "name"]),

  // Usage logs for managed-provider actions
  usageLog: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
    workspaceId: v.optional(v.id("workspaces")), // Parallel workspace link
    directCallId: v.id("providerDirectCall"),
    actionName: v.string(),
    timestamp: v.number(),
    success: v.boolean(),
    latencyMs: v.number(),
    creditsUsed: v.number(), // in USD cents
    errorMessage: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_providerId", ["providerId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_directCallId", ["directCallId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_userId_providerId", ["userId", "providerId"])
    .index("by_userId_timestamp", ["userId", "timestamp"]),

  // ============================================
  // API LOGS (workspace/consumer view)
  // ============================================

  apiLogs: defineTable({
    workspaceId: v.id("workspaces"),
    sessionToken: v.string(),
    subagentId: v.optional(v.string()),
    provider: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    latencyMs: v.number(),
    errorMessage: v.optional(v.string()),
    direction: v.optional(v.string()), // "outbound" (I called) or "inbound" (someone called my API)
    callerWorkspaceId: v.optional(v.string()), // who made the call (for inbound logs)
    costCents: v.optional(v.number()), // patched in post-hoc from managedCallLedger via requestId
    requestId: v.optional(v.string()), // shared key with managedCallLedger, when this call went through managed metering
    keySource: v.optional(v.union(v.literal("byo"), v.literal("apiclaw"))), // which rail's credential executed this call (BYOH, 2026-08-24)
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"])
    .index("by_subagentId", ["subagentId"])
    .index("by_provider", ["provider"])
    .index("by_requestId", ["requestId"]),

  // ============================================
  // PROVIDER HEALTH (rolling success-rate scoring)
  // ============================================
  // Populated by an hourly aggregate cron. Discovery consumes this to
  // down-rank providers whose recent call success rate has degraded.
  // One row per provider, upserted in place.

  providerHealth: defineTable({
    providerId: v.string(),         // e.g. "openrouter", "brave_search"
    successRate: v.number(),         // 0.0 to 1.0 over the window
    p50LatencyMs: v.number(),
    callCount: v.number(),           // total over the window
    successCount: v.number(),
    windowDays: v.number(),          // typically 30
    computedAt: v.number(),
  })
    .index("by_providerId", ["providerId"])
    .index("by_computedAt", ["computedAt"]),

  // ============================================
  // WAITLIST (for managed provider leads)
  // ============================================

  waitlist: defineTable({
    email: v.string(),
    type: v.string(), // "provider" | "agent" | "general"
    source: v.optional(v.string()), // "landing", "docs", etc.
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_type", ["type"]),

  // ============================================
  // CAPABILITY LAYER (abstraction over providers)
  // ============================================

  // Capability definitions (sms, email, invoice, search, etc.)
  capabilities: defineTable({
    id: v.string(),              // "sms", "email", "invoice"
    name: v.string(),            // "SMS Messaging"
    description: v.string(),
    category: v.string(),        // "communication", "business", "ai"
    standardParams: v.array(v.object({
      name: v.string(),
      type: v.string(),          // "string" | "number" | "boolean"
      required: v.boolean(),
      description: v.string(),
      default: v.optional(v.any()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_capability_id", ["id"])
    .index("by_category", ["category"]),

  // Provider → Capability mappings (which providers offer which capabilities)
  providerCapabilities: defineTable({
    providerId: v.string(),      // "46elks", "twilio"
    capabilityId: v.string(),    // "sms"
    priority: v.number(),        // 1 = primary, 2 = fallback
    regions: v.array(v.string()), // ["SE", "EU", "US"]
    pricePerUnit: v.number(),    // in smallest currency unit (cents/öre)
    currency: v.string(),        // "SEK", "USD"
    avgLatencyMs: v.number(),
    paramMapping: v.any(),       // Record<string, string> - capability param → provider param
    enabled: v.boolean(),
    healthStatus: v.string(),    // "healthy" | "degraded" | "down"
    lastHealthCheck: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_providerId", ["providerId"])
    .index("by_capabilityId", ["capabilityId"])
    .index("by_capabilityId_enabled", ["capabilityId", "enabled"])
    .index("by_healthStatus", ["healthStatus"]),

  // Capability usage logs (for analytics and billing)
  capabilityLogs: defineTable({
    capabilityId: v.string(),
    providerId: v.string(),
    userId: v.string(),
    action: v.string(),
    success: v.boolean(),
    fallbackUsed: v.boolean(),
    fallbackReason: v.optional(v.string()),
    latencyMs: v.number(),
    cost: v.number(),
    currency: v.string(),
    timestamp: v.number(),
  })
    .index("by_capabilityId", ["capabilityId"])
    .index("by_providerId", ["providerId"])
    .index("by_userId", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================
  // WEBHOOKS
  // ============================================

  webhooks: defineTable({
    workspaceId: v.id("workspaces"),
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(), // For signature verification
    enabled: v.boolean(),
    lastTriggeredAt: v.optional(v.number()),
    lastStatus: v.optional(v.string()), // "success" | "failed"
    failCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"]),

  // ============================================
  // BYOK - BRING YOUR OWN KEY
  // ============================================

  // User-provided API keys for providers
  providerKeys: defineTable({
    workspaceId: v.id("workspaces"),
    provider: v.string(), // "brave_search", "openrouter", etc.
    encryptedKey: v.string(), // Base64 encoded for MVP
    keyHint: v.string(), // Last 4 chars for display
    isCustom: v.boolean(), // true if custom provider (not built-in)
    customConfig: v.optional(v.object({
      baseUrl: v.string(),
      authType: v.string(), // "bearer", "api_key", "basic"
      authHeader: v.optional(v.string()), // e.g. "X-API-Key"
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_provider", ["workspaceId", "provider"]),

  // ============================================
  // EARN PROGRESS TRACKING
  // ============================================

  earnProgress: defineTable({
    workspaceId: v.id("workspaces"),

    // Usage tasks
    firstDirectCall: v.boolean(),
    firstDirectCallAt: v.optional(v.number()),

    apisUsed: v.array(v.string()), // Track unique provider/action combos
    apisUsedComplete: v.boolean(),

    agentListed: v.boolean(),
    agentListedAt: v.optional(v.number()),

    apiListed: v.boolean(),
    apiListedAt: v.optional(v.number()),

    byokSetup: v.boolean(),
    byokSetupAt: v.optional(v.number()),

    // Growth tasks
    githubStarred: v.boolean(),
    githubStarredAt: v.optional(v.number()),

    twitterFollowed: v.boolean(),
    twitterFollowedAt: v.optional(v.number()),

    // Referrals (tracked separately but stored here for convenience)
    referralCount: v.number(),

    // Calculated total
    totalEarned: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"]),

  // ============================================
  // FEEDBACK SYSTEM
  // ============================================

  // ============================================
  // CHAIN ORCHESTRATION TABLES
  // ============================================

  // Chain executions (main orchestration record)
  chains: defineTable({
    workspaceId: v.id("workspaces"),
    // Chain definition
    steps: v.array(v.any()), // Array of step definitions (raw, unresolved)
    // Execution state
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("paused")
    ),
    currentStep: v.number(), // Index of current step (0-based)
    // Results storage
    results: v.any(), // Record<stepId, result>
    // Error tracking
    error: v.optional(v.object({
      stepId: v.string(),
      code: v.string(),
      message: v.string(),
      retryAfter: v.optional(v.number()),
    })),
    // Execution options
    continueOnError: v.optional(v.boolean()),
    timeout: v.optional(v.number()), // ms
    // Resume capability
    resumeToken: v.optional(v.string()),
    canResume: v.optional(v.boolean()),
    // Cost tracking
    totalCostCents: v.optional(v.number()),
    totalLatencyMs: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_status", ["status"])
    .index("by_workspaceId_status", ["workspaceId", "status"])
    .index("by_resumeToken", ["resumeToken"]),

  // Chain templates (reusable chain definitions)
  chainTemplates: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    // Input schema for the template
    inputs: v.optional(v.any()), // JSON Schema for inputs
    // Chain definition
    chain: v.array(v.any()), // Array of step definitions
    // Usage tracking
    useCount: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_name", ["workspaceId", "name"]),

  // Chain step executions (detailed trace per step)
  chainExecutions: defineTable({
    chainId: v.id("chains"),
    stepId: v.string(), // The id from step definition
    stepIndex: v.number(), // Position in chain
    // Execution state
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("skipped")
    ),
    // I/O
    input: v.optional(v.any()), // Resolved params sent to provider
    output: v.optional(v.any()), // Result from provider
    // Metrics
    latencyMs: v.optional(v.number()),
    costCents: v.optional(v.number()),
    // Error info
    error: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      retryCount: v.optional(v.number()),
    })),
    // Parallel execution tracking
    parallelGroup: v.optional(v.string()), // Group ID if part of parallel batch
    // Timestamps
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_chainId", ["chainId"])
    .index("by_chainId_stepId", ["chainId", "stepId"])
    .index("by_chainId_stepIndex", ["chainId", "stepIndex"]),

  // User feedback with voting
  feedback: defineTable({
    workspaceId: v.id("workspaces"),
    type: v.union(v.literal("bug"), v.literal("feature"), v.literal("general")),
    content: v.string(),
    votes: v.number(),
    votedBy: v.array(v.string()), // workspace IDs that voted
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("planned"), v.literal("shipped")),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_votes", ["votes"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // WORKSPACE SETTINGS (Gateway routing config)
  // ============================================

  workspaceSettings: defineTable({
    workspaceId: v.id("workspaces"),
    // Routing preferences
    routingMode: v.string(), // "best_price" | "highest_quality" | "fastest" | "balanced"
    defaultModel: v.optional(v.string()), // e.g. "anthropic/claude-sonnet-4-6"
    // Budget controls
    maxPricePerMTokens: v.optional(v.float64()), // deprecated, no reader; kept for existing documents
    monthlyBudgetLimit: v.optional(v.float64()), // deprecated, no reader; kept for existing documents
    // Provider preferences
    preferredProviders: v.optional(v.array(v.string())), // e.g. ["groq", "mistral", "together"]
    blockedProviders: v.optional(v.array(v.string())), // providers to never use
    // Fallback
    allowOpenRouterFallback: v.optional(v.boolean()), // default true
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"]),

  // ============================================
  // MOU SIGNATURES
  // ============================================
  
  mouDocuments: defineTable({
    partnerId: v.string(), // e.g., "apilayer"
    partnerName: v.string(),
    partnerEmail: v.string(),
    partnerRepresentative: v.optional(v.string()),
    documentHtml: v.optional(v.string()),
    sections: v.optional(v.any()), // Alternative document format
    status: v.string(), // "pending" | "signed"
    signedAt: v.optional(v.number()),
    signatureDataUrl: v.optional(v.string()), // base64 signature image
    signerName: v.optional(v.string()),
    signerTitle: v.optional(v.string()),
    signerIp: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_partnerId", ["partnerId"])
    .index("by_status", ["status"]),

  // ═══════════════════════════════════════════════════════════════
  // NURTURE - Workspace lifecycle + email nurture state
  // ═══════════════════════════════════════════════════════════════
  nurture: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.optional(v.string()),            // mirrored for easy dedupe
    stage: v.union(
      v.literal("new"),                       // <48h since signup, no activity yet
      v.literal("activating"),                // seen some discovery, no calls
      v.literal("active"),                    // has made API calls recently
      v.literal("power"),                     // >50 calls in last 14d
      v.literal("dormant"),                   // no activity 7d+
      v.literal("lost"),                      // no activity 30d+
      v.literal("partner-locked"),            // partner workspace — never nurture
      v.literal("excluded")                   // explicit opt-out / internal / test
    ),
    lastActivityAt: v.optional(v.number()),
    emailsSent: v.number(),                   // total nurture emails sent
    lastEmailSentAt: v.optional(v.number()),
    lastEmailKind: v.optional(v.string()),    // "welcome", "try-discover", "first-call", "upgrade", "reactivate-7d", "reactivate-30d", "power-upgrade"
    unsubscribed: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_email", ["email"])
    .index("by_stage", ["stage"])
    .index("by_lastActivityAt", ["lastActivityAt"]),

  // ============================================
  // REMOTE MCP — OAuth 2.1 (PKCE + DCR)
  // ============================================
  // Clients registered to talk to https://apiclaw.cloud/mcp.
  // Created either via the dashboard ("Generate Grok Connector") or via
  // RFC 7591 Dynamic Client Registration. A client is just metadata; it
  // grants nothing on its own — tokens require human consent on
  // /oauth/authorize against an email-authenticated workspace.
  mcpOAuthClients: defineTable({
    clientId: v.string(),                  // public identifier (claw_mcp_<24 chars>)
    clientSecretHash: v.optional(v.string()), // null = public client (PKCE only)
    clientSecretPrefix: v.optional(v.string()), // "claw_mcp_secret_...last4"
    workspaceId: v.optional(v.id("workspaces")), // bound on first authorize; null = unbound DCR client
    name: v.string(),                      // display name (e.g. "Grok (xAI)")
    redirectUris: v.array(v.string()),
    grantTypes: v.array(v.string()),       // ["authorization_code", "refresh_token"]
    tokenEndpointAuthMethod: v.string(),   // "client_secret_basic" | "none" (public PKCE client)
    scope: v.string(),                     // space-separated scopes granted to this client
    registrationKind: v.string(),          // "dashboard" | "dynamic"
    createdAt: v.number(),
    updatedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_workspaceId", ["workspaceId"]),

  // Short-lived authorization codes (10 min TTL).
  mcpOAuthAuthCodes: defineTable({
    code: v.string(),                      // single-use opaque code
    clientId: v.string(),
    workspaceId: v.id("workspaces"),
    redirectUri: v.string(),
    scope: v.string(),
    codeChallenge: v.string(),             // PKCE challenge
    codeChallengeMethod: v.string(),       // "S256"
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_workspaceId", ["workspaceId"]),

  // ============================================
  // CONTROL PLANE — MISSIONS
  // ============================================
  // A mission is a single orchestration unit (one-or-many tool/API calls
  // executed under a named template). Powers the CLI `apiclaw mission start`,
  // the MCP `start_mission` tool, and the Grok runtime experience.
  // Architecturally ready for parallel sub-tasks; v1 runs sequentially.
  missions: defineTable({
    workspaceId: v.id("workspaces"),
    requestId: v.optional(v.string()),
    requestFingerprint: v.optional(v.string()),
    template: v.string(),                  // template slug. v1 templates resolve via TEMPLATE_REGISTRY; v2 via missionTemplates table.
    templateVersion: v.optional(v.number()), // pinned version for v2 template-driven missions. omit for legacy v1.
    title: v.string(),                     // human-readable summary
    status: v.string(),                    // "queued" | "running" | "needs_validation" | "needs_revision" | "completed" | "failed" | "cancelled"
    params: v.any(),                       // input args (JSON)
    state: v.optional(v.any()),            // v2: accumulated step outputs keyed by stepId
    result: v.optional(v.any()),           // final output once completed
    error: v.optional(v.string()),         // error message if failed
    initiator: v.string(),                 // "cli" | "mcp" | "http" | "grok"
    clientId: v.optional(v.string()),      // OAuth client_id when initiator=mcp/grok
    parentMissionId: v.optional(v.id("missions")), // parallel sub-mission support
    budgetUsd: v.optional(v.float64()),    // halt + alert if costUsd exceeds this
    underlyingCostUsd: v.optional(v.float64()),    // raw API cost (for billing)
    chargedCostUsd: v.optional(v.float64()),       // exact customer charge aggregated from managed ledger finalizations
    isInternal: v.boolean(),               // true = NordSym workspace, no margin charged
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_status", ["status"])
    .index("by_template", ["template"])
    .index("by_workspaceId_requestId", ["workspaceId", "requestId"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"]),

  // Per-mission audit log. Real observability, not magic. Every step a
  // mission takes (LLM call, API call, sub-task spawn, error) writes a row.
  missionEvents: defineTable({
    missionId: v.id("missions"),
    workspaceId: v.id("workspaces"),
    type: v.string(),                      // "step_start" | "tool_call" | "api_call" | "step_complete" | "log" | "cost"
    label: v.string(),                     // short human label
    data: v.optional(v.any()),             // freeform per-event payload
    durationMs: v.optional(v.number()),
    costUsd: v.optional(v.float64()),
    timestamp: v.number(),
  })
    .index("by_missionId", ["missionId"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_missionId_timestamp", ["missionId", "timestamp"]),

  // ============================================
  // MISSION TEMPLATES (v2 — data-driven compositions)
  // ============================================
  //
  // A template is a composition of primitives (fetch, transform, decide,
  // validate, execute) chained via sequence / parallel / branch. The runner
  // walks the steps array and dispatches each step to its primitive handler.
  //
  // Templates are versioned: missions pin (slug, version) so a template
  // edit cannot retroactively change the behavior of in-flight runs.
  // Steps are stored as v.any() because their shape is primitive-specific;
  // validation happens via the Zod-style validators in missionPrimitives.ts
  // before write and at runtime.

  missionTemplates: defineTable({
    slug: v.string(),                       // "prd-generation", "competitive-analysis"
    version: v.number(),                    // monotonic per slug; never reuse
    ownerWorkspaceId: v.id("workspaces"),
    visibility: v.union(
      v.literal("private"),                 // only owner workspace can run
      v.literal("public"),                  // any authenticated workspace can run
      v.literal("marketplace"),             // listed in discover_missions; revenue share
    ),
    title: v.string(),
    description: v.string(),
    inputSchema: v.any(),                   // JSON-schema describing mission.params shape
    outputSchema: v.any(),                  // JSON-schema describing mission.result shape
    contractAssertions: v.array(v.any()),   // typed pass/fail rules for validators
    pricingPerRunUsd: v.optional(v.float64()), // surcharge on top of underlying cost; for marketplace templates
    resultStepId: v.optional(v.string()),   // which step's output to surface as mission.result. defaults to last step.
    steps: v.array(v.any()),                // composition graph; see missionPrimitives.ts for step shape
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug_version", ["slug", "version"])
    .index("by_slug_enabled", ["slug", "enabled"])
    .index("by_visibility_enabled", ["visibility", "enabled"])
    .index("by_ownerWorkspaceId", ["ownerWorkspaceId"]),

  // Bearer access + refresh tokens (hashed, never stored raw).
  mcpOAuthTokens: defineTable({
    tokenHash: v.string(),                 // hash of the bearer token
    tokenPrefix: v.string(),               // "sk-mcp-...last4" for display
    kind: v.string(),                      // "access" | "refresh"
    clientId: v.string(),
    workspaceId: v.id("workspaces"),
    scope: v.string(),
    parentTokenId: v.optional(v.id("mcpOAuthTokens")), // refresh chain
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_clientId", ["clientId"]),

  // Live model catalog — populated by internal.modelCatalog.refresh (6h cron).
  // Single source of truth for /v1/models. Replaces the old hardcoded 25-entry list.
  modelCatalog: defineTable({
    id: v.string(),                          // canonical apiclaw-routable ID e.g. "openai/gpt-4o"
    ownedBy: v.string(),                     // "openai" | "anthropic" | "mistral" | ...
    via: v.string(),                         // "direct" (managed by apiclaw) | "openrouter" (fallback) | "managed-fallback"
    endpoint: v.string(),                    // "/v1/chat/completions" | "/v1/embeddings" | "/v1/messages"
    name: v.optional(v.string()),            // display name
    contextWindow: v.optional(v.number()),
    inputModalities: v.optional(v.array(v.string())),  // ["text","image","audio"]
    source: v.string(),                      // provider that returned this entry
    deprecated: v.optional(v.boolean()),     // true when not seen in last refresh window
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_canonical_id", ["id"])
    .index("by_ownedBy", ["ownedBy"])
    .index("by_via", ["via"])
    .index("by_endpoint", ["endpoint"])
    .index("by_lastSeenAt", ["lastSeenAt"]),

  // Stripe webhook delivery ledger. Payloads are intentionally not stored.
  // The Stripe event ID is enough to provide replay and concurrency safety.
  stripeWebhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    status: v.union(v.literal("processing"), v.literal("succeeded"), v.literal("failed")),
    attempts: v.number(),
    receivedAt: v.number(),
    processingStartedAt: v.number(),
    completedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_status", ["status"]),
});
