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
    passwordHash: v.optional(v.string()),
    status: v.string(), // "pending" | "active" | "suspended"
    tier: v.string(), // "free" | "pro" | "enterprise" | "backer"
    usageCount: v.number(), // total API calls made (lifetime)
    usageLimit: v.number(), // max API calls for tier
    // Weekly usage (resets every Monday 00:00 UTC)
    weeklyUsageCount: v.optional(v.number()), // calls this week
    weeklyUsageLimit: v.optional(v.number()), // 50 for free, unlimited for backer
    lastWeeklyResetAt: v.optional(v.number()), // timestamp of last reset
    // Hourly rate limit
    hourlyUsageCount: v.optional(v.number()), // calls this hour
    lastHourlyResetAt: v.optional(v.number()), // timestamp of last hourly reset
    // Backer status (Founding Backer = unlimited until end of 2026)
    backerUntil: v.optional(v.number()), // timestamp when backer status expires
    // Main agent identification
    mainAgentId: v.optional(v.string()), // UUID, auto-generated on first call
    mainAgentName: v.optional(v.string()), // Auto-generated name (e.g., "Crimson Phoenix")
    // Stripe billing fields
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    billingPlan: v.optional(v.string()), // "free" | "usage_based" | "starter" | "pro" | "scale"
    creditBalance: v.optional(v.number()), // prepaid credits in cents
    lastBillingDate: v.optional(v.number()),
    // Payment method fields
    hasPaymentMethod: v.optional(v.boolean()),
    paymentMethodType: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    // Referral fields
    referralCode: v.optional(v.string()), // CLAW-XXXXXX format
    referredBy: v.optional(v.id("workspaces")), // who referred this user
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
    reportedToStripe: v.boolean(),
    stripeUsageRecordId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_date", ["date"])
    .index("by_workspaceId_date", ["workspaceId", "date"])
    .index("by_reportedToStripe", ["reportedToStripe"]),

  // Agent sessions (for MCP server authentication)
  agentSessions: defineTable({
    workspaceId: v.id("workspaces"),
    sessionToken: v.string(),
    fingerprint: v.optional(v.string()), // machine fingerprint
    customName: v.optional(v.string()), // user-defined name
    lastUsedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_workspaceId", ["workspaceId"]),

  // Subagent tracking (tasks spawned by main agent)
  subagents: defineTable({
    workspaceId: v.id("workspaces"),
    subagentId: v.string(), // from X-APIClaw-Subagent header
    name: v.optional(v.string()), // optional display name
    callCount: v.number(),
    firstSeenAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_subagentId", ["workspaceId", "subagentId"])
    .index("by_lastActiveAt", ["lastActiveAt"]),

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
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_stripeConnectId", ["stripeConnectId"])
    .index("by_status", ["status"]),

  // APIs listed by providers (self-service onboarding)
  providerAPIs: defineTable({
    providerId: v.id("providers"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    openApiUrl: v.optional(v.string()),
    docsUrl: v.optional(v.string()),
    pricingModel: v.string(), // free, freemium, paid
    pricingNotes: v.optional(v.string()),
    status: v.string(), // pending, approved, rejected, suspended
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
    // Analytics
    discoveryCount: v.optional(v.number()),
    lastDiscoveredAt: v.optional(v.number()),
  })
    .index("by_providerId", ["providerId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_status_category", ["status", "category"]),

  // APIs listed by providers (for full dashboard)
  apis: defineTable({
    providerId: v.id("providers"),
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
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // API Calls / Usage logs (for analytics)
  apiCalls: defineTable({
    apiId: v.id("apis"),
    providerId: v.id("providers"),
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
    .index("by_agentId", ["agentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_providerId_timestamp", ["providerId", "timestamp"]),

  // Provider Payouts
  payouts: defineTable({
    providerId: v.id("providers"),
    amountUsd: v.number(),
    status: v.string(), // pending, processing, completed, failed
    stripePayoutId: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_providerId", ["providerId"])
    .index("by_status", ["status"]),

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
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_timestamp", ["timestamp"])
    .index("by_provider", ["provider"]),

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

  // Provider Direct Call configuration (master key, limits, pricing)
  providerDirectCall: defineTable({
    providerId: v.id("providers"),
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
    .index("by_apiId", ["apiId"])
    .index("by_status", ["status"]),

  // Actions defined by providers for their Direct Call APIs
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

  // Usage logs for Direct Call actions
  usageLog: defineTable({
    userId: v.string(),
    providerId: v.id("providers"),
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
    subagentId: v.optional(v.string()), // from X-APIClaw-Subagent header
    provider: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    latencyMs: v.number(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"])
    .index("by_subagentId", ["subagentId"]),

  // ============================================
  // WAITLIST (for Direct Call provider leads)
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
});
