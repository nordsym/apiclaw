/**
 * Seed: GenPRD as a managed provider under Gustav's workspace
 *
 * Run once against production:
 *   npx convex run seedGenPRD:seedGenPRD --prod
 *
 * What this creates:
 *  - providers record for GenPRD (owned by gustav@nordsym.com workspace)
 *  - providerAPIs record for the /api/generate endpoint
 *  - both marked managed + live so they appear in analytics
 *
 * Idempotent: skips creation if records already exist.
 */
import { mutation } from "./_generated/server";

export const seedGenPRD = mutation({
  args: {},
  handler: async (ctx) => {
    const OWNER_EMAIL = "gustav@nordsym.com";
    const PROVIDER_NAME = "GenPRD";
    const now = Date.now();

    // ── Resolve Gustav's workspace ───────────────────────────────────────────
    const ownerWs = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", OWNER_EMAIL))
      .first();
    if (!ownerWs) throw new Error(`owner workspace not found for ${OWNER_EMAIL}`);

    // ── Upsert provider record ───────────────────────────────────────────────
    const existingProvider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", OWNER_EMAIL))
      .first();

    // Check if there's already a GenPRD provider (by name) linked to this workspace
    const allProviders = await ctx.db.query("providers").collect();
    const genprdProvider = allProviders.find(
      (p) => p.name === PROVIDER_NAME && (p as any).workspaceId === ownerWs._id
    );

    let providerId: any;
    if (genprdProvider) {
      providerId = genprdProvider._id;
    } else {
      providerId = await ctx.db.insert("providers", {
        email: OWNER_EMAIL,
        name: PROVIDER_NAME,
        website: "https://genprd.se",
        status: "approved",
        workspaceId: ownerWs._id,
        createdAt: now,
        updatedAt: now,
        approvedAt: now,
      } as any);
    }

    // ── Upsert providerAPIs record ───────────────────────────────────────────
    // Name MUST be "GenPRD" (slug match: "genprd" === "genprd") so call_api works.
    const existingApis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", ownerWs._id))
      .collect();
    const existingApi = existingApis.find(
      (a) => a.name === "GenPRD" || a.name === "GenPRD — PRD Generator"
    );

    let apiId: any;
    if (existingApi) {
      // Rename to "GenPRD" if it was seeded with the old display name
      if (existingApi.name !== "GenPRD") {
        await ctx.db.patch(existingApi._id, { name: "GenPRD" } as any);
      }
      apiId = existingApi._id;
    } else {
      apiId = await ctx.db.insert("providerAPIs", {
        providerId,
        workspaceId: ownerWs._id,
        name: "GenPRD",
        description:
          "Generate structured Product Requirement Documents from natural language. Returns Markdown PRD with goals, user stories, requirements, and success metrics.",
        category: "ai",
        openApiUrl: "https://genprd.se/.well-known/openapi.json",
        docsUrl: "https://genprd.se",
        baseUrl: "https://genprd.se",
        pricingModel: "per_call",
        pricingNotes: "AI compute cost + 15% APIClaw margin",
        status: "active",
        listingStatus: "live",
        authType: "managed",
        proxyMode: "direct_call",
        healthStatus: "healthy",
        createdAt: now,
        approvedAt: now,
        discoveryCount: 0,
      } as any);
    }

    // ── Upsert providerDirectCall (gateway routing config) ───────────────────
    // encryptedMasterKey is the GENPRD_API_KEY encrypted with AES-256-GCM.
    // Regenerate if re-seeding (idempotent: patch existing).
    const ENCRYPTED_KEY =
      "697ffc0a35791041f1998e1ce9c9418c:c932f555e2f3e96915bcfb6b89901661:85836a376090f5cc7265ef9521465d485f5dc5cda4d71596d7ccdc631e2ee4e3ec188eb7e5827462c97a0f2c1657b8d98c0032d3418e92bcee7a39c64988b440123edaf6860bbf";

    const existingDC = await ctx.db
      .query("providerDirectCall")
      .withIndex("by_apiId", (q) => q.eq("apiId", apiId))
      .first();

    let directCallId: any;
    if (existingDC) {
      directCallId = existingDC._id;
      await ctx.db.patch(existingDC._id, { status: "live", updatedAt: now } as any);
    } else {
      directCallId = await ctx.db.insert("providerDirectCall", {
        providerId,
        workspaceId: ownerWs._id,
        apiId,
        baseUrl: "https://genprd.se",
        authType: "api_key",
        authHeader: "X-GenPRD-Key",
        authPrefix: "",
        encryptedMasterKey: ENCRYPTED_KEY,
        rateLimitPerUser: 60,
        rateLimitPerDay: 500,
        pricePerRequest: 0,
        status: "live",
        allowCustomerKeys: false,
        requireCustomerKeys: false,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      } as any);
    }

    // ── Upsert providerActions (generate_prd → POST /api/generate) ───────────
    const existingActions = await ctx.db
      .query("providerActions")
      .withIndex("by_directCallId", (q) => q.eq("directCallId", directCallId))
      .collect();
    const existingAction = existingActions.find((a) => a.name === "generate_prd");

    if (!existingAction) {
      await ctx.db.insert("providerActions", {
        directCallId,
        name: "generate_prd",
        displayName: "Generate PRD",
        description:
          "Generate a structured Markdown PRD from a product topic, optional audience, and constraints.",
        method: "POST",
        path: "/api/generate",
        params: [
          { name: "topic", type: "string", required: true, description: "What the PRD is about", in: "body", default: undefined },
          { name: "audience", type: "string", required: false, description: "Who the product is for", in: "body", default: undefined },
          { name: "constraints", type: "string", required: false, description: "Hard constraints (timeline, stack, budget)", in: "body", default: undefined },
          { name: "model", type: "string", required: false, description: "OpenRouter model ID override", in: "body", default: "anthropic/claude-sonnet-4-5" },
          { name: "format", type: "string", required: false, description: "lean | standard | detailed", in: "body", default: "standard" },
        ],
        responseMapping: [
          { name: "prd", path: "prd" },
          { name: "model", path: "model" },
          { name: "tokens_input", path: "tokens.input" },
          { name: "tokens_output", path: "tokens.output" },
        ],
        enabled: true,
        requiresConfirmation: false,
        createdAt: now,
        updatedAt: now,
      } as any);
    }

    return {
      ok: true,
      providerId,
      apiId,
      directCallId,
      ownerWorkspaceId: ownerWs._id,
      note: genprdProvider ? "provider already existed — patched" : "created fresh",
    };
  },
});

/**
 * Verify seed result — read-only check.
 * Run: npx convex run seedGenPRD:verifyGenPRD --prod
 */
export const verifyGenPRD = mutation({
  args: {},
  handler: async (ctx) => {
    const OWNER_EMAIL = "gustav@nordsym.com";

    const ws = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", OWNER_EMAIL))
      .first();

    if (!ws) return { ok: false, error: "workspace not found" };

    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", ws._id))
      .collect();

    const genprdApi = apis.find((a) => a.name === "GenPRD");

    const allProviders = await ctx.db.query("providers").collect();
    const genprdProvider = allProviders.find(
      (p) => p.name === "GenPRD" && (p as any).workspaceId === ws._id
    );

    // Count inbound apiLogs for genprd
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_provider", (q) => q.eq("provider", "genprd"))
      .collect();

    return {
      ok: true,
      workspaceId: ws._id,
      providerRecord: genprdProvider
        ? { id: genprdProvider._id, name: genprdProvider.name, status: genprdProvider.status }
        : null,
      apiRecord: genprdApi
        ? { id: genprdApi._id, name: genprdApi.name, listingStatus: (genprdApi as any).listingStatus }
        : null,
      totalMissionLogs: logs.length,
    };
  },
});
