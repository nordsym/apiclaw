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
});
