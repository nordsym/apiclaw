import { mutation } from "./_generated/server";

/**
 * Workspace Unification Migration (idempotent)
 *
 * For every providers record, find the matching workspace by email
 * and backfill workspaceId on the provider + all related tables.
 *
 * Does NOT create new workspaces. If no workspace is found for a
 * provider email, it is logged in the report for manual handling.
 *
 * Safe to run multiple times — skips already-linked records.
 */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const report: {
      providers: Array<{
        email: string;
        name: string;
        providerId: string;
        workspaceId: string | null;
        status: "linked" | "already_linked" | "workspace_not_found";
        backfilled: {
          providerAPIs: number;
          apis: number;
          apiCalls: number;
          payouts: number;
          providerDirectCall: number;
          usageLog: number;
        };
      }>;
      warnings: string[];
    } = { providers: [], warnings: [] };

    // 1. Get ALL provider records (no hardcoded list)
    const allProviders = await ctx.db.query("providers").collect();

    for (const provider of allProviders) {
      const entry: (typeof report.providers)[number] = {
        email: provider.email,
        name: provider.name,
        providerId: provider._id as string,
        workspaceId: null,
        status: "workspace_not_found",
        backfilled: {
          providerAPIs: 0,
          apis: 0,
          apiCalls: 0,
          payouts: 0,
          providerDirectCall: 0,
          usageLog: 0,
        },
      };

      // Already linked?
      if (provider.workspaceId) {
        entry.workspaceId = provider.workspaceId as string;
        entry.status = "already_linked";
        // Still backfill child tables in case they were missed
      }

      // 2. Find workspace by email (case-insensitive)
      const emailLower = provider.email.toLowerCase();
      const workspace = await ctx.db
        .query("workspaces")
        .withIndex("by_email", (q) => q.eq("email", emailLower))
        .first();

      if (!workspace) {
        // Try exact match as fallback (in case stored with different casing)
        const workspaceExact = await ctx.db
          .query("workspaces")
          .withIndex("by_email", (q) => q.eq("email", provider.email))
          .first();

        if (!workspaceExact) {
          report.warnings.push(
            `No workspace found for provider "${provider.name}" (${provider.email})`
          );
          report.providers.push(entry);
          continue;
        }
        // Use exact match
        entry.workspaceId = workspaceExact._id as string;
      } else {
        entry.workspaceId = workspace._id as string;
      }

      const wsId = entry.workspaceId! as any;

      // 3. Link provider → workspace (if not already)
      if (!provider.workspaceId) {
        await ctx.db.patch(provider._id, { workspaceId: wsId });
        entry.status = "linked";
      }

      // 4. Backfill providerAPIs (skip if workspaceId already set)
      const providerAPIs = await ctx.db
        .query("providerAPIs")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
        .collect();
      for (const api of providerAPIs) {
        if (!api.workspaceId) {
          await ctx.db.patch(api._id, { workspaceId: wsId });
          entry.backfilled.providerAPIs++;
        }
      }

      // 5. Backfill apis
      const apis = await ctx.db
        .query("apis")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
        .collect();
      for (const api of apis) {
        if (!(api as any).workspaceId) {
          await ctx.db.patch(api._id, { workspaceId: wsId } as any);
          entry.backfilled.apis++;
        }
      }

      // 6. Backfill apiCalls
      const apiCalls = await ctx.db
        .query("apiCalls")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
        .collect();
      for (const call of apiCalls) {
        if (!(call as any).workspaceId) {
          await ctx.db.patch(call._id, { workspaceId: wsId } as any);
          entry.backfilled.apiCalls++;
        }
      }

      // 7. Backfill payouts
      const payouts = await ctx.db
        .query("payouts")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
        .collect();
      for (const payout of payouts) {
        if (!(payout as any).workspaceId) {
          await ctx.db.patch(payout._id, { workspaceId: wsId } as any);
          entry.backfilled.payouts++;
        }
      }

      // 8. Backfill providerDirectCall
      const directCalls = await ctx.db
        .query("providerDirectCall")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
        .collect();
      for (const dc of directCalls) {
        if (!(dc as any).workspaceId) {
          await ctx.db.patch(dc._id, { workspaceId: wsId } as any);
          entry.backfilled.providerDirectCall++;
        }
      }

      // 9. Backfill usageLog
      const usageLogs = await ctx.db
        .query("usageLog")
        .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
        .collect();
      for (const log of usageLogs) {
        if (!(log as any).workspaceId) {
          await ctx.db.patch(log._id, { workspaceId: wsId } as any);
          entry.backfilled.usageLog++;
        }
      }

      report.providers.push(entry);
    }

    return report;
  },
});
