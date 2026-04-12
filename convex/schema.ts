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
    // Budget & Spend Alerts (PRD 2.6)
    budgetCap: v.optional(v.number()), // Monthly budget cap in USD cents (null = unlimited)
    budgetAlertSentAt: v.optional(v.number()), // When 80% alert was last sent (resets monthly)
    pauseOnBudgetExceeded: v.optional(v.boolean()), // If true, block execution when budget exceeded
    monthlySpendCents: v.optional(v.number()), // Current month's spend in cents
    lastSpendResetAt: v.optional(v.number()), // When monthly spend was last reset
    // Activity tracking
    lastActiveAt: v.optional(v.number()), // Last API call timestamp (main agent)
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
    fingerprint: v.optional(v.string()), // machine fingerprint
    customName: v.optional(v.string()), // user-defined name
    lastUsedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_workspaceId", ["workspaceId"]),

  // Agents — one per unique (fingerprint, mcpClient) pair
  // An agent = an MCP client installation, NOT a login session
  agents: defineTable({
    fingerprint: v.string(), // hostname:username
    mcpClient: v.string(), // "claude-desktop" | "claude-code" | "cursor" | "windsurf" | "cline" | "continue" | "unknown"
    workspaceId: v.id("workspaces"), // always linked — auto-created on first call
    name: v.optional(v.string()), // auto-generated or user-set
    aiBackend: v.optional(v.string()), // "claude-3-opus" etc
    platform: v.optional(v.string()), // "darwin" | "linux" | "win32"
    callCount: v.number(),
    firstSeenAt: v.number(),
    lastActiveAt: v.number(),
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
    pricingModel: v.string(), // free, freemium, paid
    pricingNotes: v.optional(v.string()),
    status: v.string(), // active, paused
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
    .index("by_status_category", ["status", "category"]),

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
    workspaceId: v.optional(v.id("workspaces")), // Claimed workspace (null = anonymous)
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_timestamp", ["timestamp"])
    .index("by_provider", ["provider"])
    .index("by_workspaceId", ["workspaceId"])
    .index("by_identifier", ["identifier"]),

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
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workspaceId_createdAt", ["workspaceId", "createdAt"])
    .index("by_subagentId", ["subagentId"])
    .index("by_provider", ["provider"]),

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
    maxPricePerMTokens: v.optional(v.float64()), // max $/million tokens, null = no limit
    monthlyBudgetLimit: v.optional(v.float64()), // monthly budget in USD, null = no limit
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
});
