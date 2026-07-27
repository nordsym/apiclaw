import { v } from "convex/values";
import {
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { checkEmailAllowedSync } from "./emailGuards";
import { findUsableAgentSession } from "./sessionSecurity";

// ============================================
// CONSTANTS
// ============================================

const ALERT_THRESHOLD = 0.8; // 80% of budget
const APP_URL = "https://apiclaw.cloud";
const EMAIL_FROM = "APIClaw <noreply@apiclaw.cloud>";

// ============================================
// HELPER: Get current month start
// ============================================

function getMonthStart(): number {
  const now = new Date();
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0).getTime();
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Update workspace budget settings
 */
export const updateBudgetSettings = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    budgetCap: v.optional(v.union(v.number(), v.null())), // in USD cents, null = unlimited
    pauseOnBudgetExceeded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.budgetCap !== undefined) {
      updates.budgetCap = args.budgetCap;
      // Reset alert when budget changes
      updates.budgetAlertSentAt = undefined;
    }

    if (args.pauseOnBudgetExceeded !== undefined) {
      updates.pauseOnBudgetExceeded = args.pauseOnBudgetExceeded;
    }

    await ctx.db.patch(args.workspaceId, updates);

    return { success: true };
  },
});

/**
 * Record spend and check budget alerts
 * Called after each successful API execution
 * Returns budget status for response
 */
export const recordSpend = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    amountCents: v.number(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Belt-and-suspenders 2026-05-27: partner + enterprise tiers never get
    // spend alert emails. Pratham/John/Idera workspaces would have triggered
    // had any of them carried a budgetCap, even though nurture-stage filters
    // exist upstream (those classifiers can lag for new partner workspaces).
    const tier = (workspace as any).tier;
    if (tier === "partner" || tier === "enterprise") {
      return {
        success: true,
        currentSpendCents: workspace.monthlySpendCents || 0,
        budgetCapCents: workspace.budgetCap || null,
        budgetPercentage: null,
        shouldSendAlert: false,
        budgetExceeded: false,
        email: workspace.email,
        skippedReason: `tier:${tier}`,
      };
    }

    const monthStart = getMonthStart();
    
    // Reset monthly spend if new month
    let currentSpend = workspace.monthlySpendCents || 0;
    if (!workspace.lastSpendResetAt || workspace.lastSpendResetAt < monthStart) {
      currentSpend = 0;
    }

    // Add new spend
    const newSpend = currentSpend + args.amountCents;

    // Update workspace
    await ctx.db.patch(args.workspaceId, {
      monthlySpendCents: newSpend,
      lastSpendResetAt: monthStart,
      updatedAt: Date.now(),
    });

    // Check if we need to send alert
    const budgetCap = workspace.budgetCap;
    let shouldSendAlert = false;
    let budgetExceeded = false;

    if (budgetCap && budgetCap > 0) {
      const threshold = budgetCap * ALERT_THRESHOLD;
      const alertAlreadySentThisMonth = workspace.budgetAlertSentAt && 
                                         workspace.budgetAlertSentAt >= monthStart;
      
      // Check if at 80% and alert not yet sent
      if (newSpend >= threshold && !alertAlreadySentThisMonth) {
        shouldSendAlert = true;
        await ctx.db.patch(args.workspaceId, {
          budgetAlertSentAt: Date.now(),
        });
      }

      // Check if budget exceeded
      if (newSpend >= budgetCap) {
        budgetExceeded = true;
      }
    }

    return {
      success: true,
      currentSpendCents: newSpend,
      budgetCapCents: budgetCap || null,
      budgetPercentage: budgetCap ? (newSpend / budgetCap) * 100 : null,
      shouldSendAlert,
      budgetExceeded,
      email: workspace.email,
    };
  },
});

/**
 * Check budget before execution
 * Returns { allowed: boolean, reason?: string }
 */
export const checkBudget = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    estimatedCostCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { allowed: false, reason: "Workspace not found" };
    }

    // No budget cap set = unlimited
    if (!workspace.budgetCap || workspace.budgetCap <= 0) {
      return { allowed: true };
    }

    // Check if pause on exceeded is enabled
    if (!workspace.pauseOnBudgetExceeded) {
      return { allowed: true };
    }

    const monthStart = getMonthStart();
    let currentSpend = workspace.monthlySpendCents || 0;
    
    // Reset if new month
    if (!workspace.lastSpendResetAt || workspace.lastSpendResetAt < monthStart) {
      currentSpend = 0;
    }

    const estimatedCost = args.estimatedCostCents || 0;
    const projectedSpend = currentSpend + estimatedCost;

    if (projectedSpend > workspace.budgetCap) {
      const budgetCapUsd = (workspace.budgetCap / 100).toFixed(2);
      const currentSpendUsd = (currentSpend / 100).toFixed(2);
      return {
        allowed: false,
        reason: `Budget exceeded. Monthly cap: $${budgetCapUsd}, current spend: $${currentSpendUsd}. Adjust budget in workspace settings.`,
        currentSpendCents: currentSpend,
        budgetCapCents: workspace.budgetCap,
      };
    }

    return { 
      allowed: true,
      currentSpendCents: currentSpend,
      budgetCapCents: workspace.budgetCap,
      remainingCents: workspace.budgetCap - currentSpend,
    };
  },
});

/**
 * Get budget status for workspace dashboard
 */
export const getBudgetStatus = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }

    const monthStart = getMonthStart();
    let currentSpend = workspace.monthlySpendCents || 0;
    
    // Reset if new month
    if (!workspace.lastSpendResetAt || workspace.lastSpendResetAt < monthStart) {
      currentSpend = 0;
    }

    const budgetCap = workspace.budgetCap || null;
    const budgetPercentage = budgetCap ? (currentSpend / budgetCap) * 100 : null;

    return {
      budgetCapCents: budgetCap,
      budgetCapUsd: budgetCap ? budgetCap / 100 : null,
      currentSpendCents: currentSpend,
      currentSpendUsd: currentSpend / 100,
      remainingCents: budgetCap ? Math.max(0, budgetCap - currentSpend) : null,
      remainingUsd: budgetCap ? Math.max(0, (budgetCap - currentSpend) / 100) : null,
      budgetPercentage: budgetPercentage ? Math.min(100, budgetPercentage) : null,
      pauseOnBudgetExceeded: workspace.pauseOnBudgetExceeded || false,
      isOverBudget: budgetCap ? currentSpend >= budgetCap : false,
      isNearBudget: budgetCap ? currentSpend >= budgetCap * ALERT_THRESHOLD : false,
      alertSentAt: workspace.budgetAlertSentAt || null,
    };
  },
});

/**
 * Get budget status by session token (for dashboard)
 */
export const getBudgetStatusByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return null;
    }

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) {
      return null;
    }

    const monthStart = getMonthStart();
    let currentSpend = workspace.monthlySpendCents || 0;
    
    if (!workspace.lastSpendResetAt || workspace.lastSpendResetAt < monthStart) {
      currentSpend = 0;
    }

    const budgetCap = workspace.budgetCap || null;

    return {
      budgetCapCents: budgetCap,
      budgetCapUsd: budgetCap ? budgetCap / 100 : null,
      currentSpendCents: currentSpend,
      currentSpendUsd: currentSpend / 100,
      remainingCents: budgetCap ? Math.max(0, budgetCap - currentSpend) : null,
      remainingUsd: budgetCap ? Math.max(0, (budgetCap - currentSpend) / 100) : null,
      budgetPercentage: budgetCap ? Math.min(100, (currentSpend / budgetCap) * 100) : null,
      pauseOnBudgetExceeded: workspace.pauseOnBudgetExceeded || false,
      isOverBudget: budgetCap ? currentSpend >= budgetCap : false,
      isNearBudget: budgetCap ? currentSpend >= budgetCap * ALERT_THRESHOLD : false,
    };
  },
});

// ============================================
// EMAIL ACTION
// ============================================

/**
 * Send budget alert email (80% warning)
 */
export const sendBudgetAlertEmail = internalAction({
  args: {
    email: v.string(),
    currentSpendCents: v.number(),
    budgetCapCents: v.number(),
  },
  handler: async (ctx, args) => {
    // Belt-and-suspenders email send guard. Even if computeSpend is bypassed
    // or invoked directly, the address-level blocklist still holds.
    const guard = checkEmailAllowedSync(args.email);
    if (!guard.allowed) {
      console.warn(`[spendAlerts] blocked outbound to ${args.email}: ${guard.reason}`);
      return { success: false, skippedReason: guard.reason };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email not configured" };
    }

    const currentSpendUsd = (args.currentSpendCents / 100).toFixed(2);
    const budgetCapUsd = (args.budgetCapCents / 100).toFixed(2);
    const percentageUsed = Math.round((args.currentSpendCents / args.budgetCapCents) * 100);
    const settingsUrl = `${APP_URL}/dashboard/settings`;

    // Build email HTML
    let html = "<!DOCTYPE html><html><head><meta charset='utf-8'></head>";
    html += "<body style='margin:0;padding:40px;background:#f5f5f5;font-family:Arial,sans-serif;'>";
    html += "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center'>";
    html += "<table width='500' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;'>";
    html += "<tr><td style='padding:32px;text-align:center;'>";
    html += "<div style='font-size:48px;'>🦞</div>";
    html += "<h1 style='margin:16px 0;color:#0a0a0a;'>APIClaw</h1>";
    html += "<h2 style='margin:0 0 16px;font-size:20px;color:#f59e0b;'>⚠️ Budget Alert</h2>";
    html += "<p style='margin:0 0 16px;color:#525252;font-size:16px;'>You've used <strong>" + percentageUsed + "%</strong> of your monthly budget.</p>";
    html += "<div style='background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px;'>";
    html += "<p style='margin:0;color:#92400e;font-size:14px;'><strong>Current spend:</strong> $" + currentSpendUsd + " / $" + budgetCapUsd + "</p>";
    html += "</div>";
    html += "<p style='margin:0 0 24px;color:#525252;font-size:14px;'>If your budget is exceeded, API calls will be paused until the next billing cycle (if pause is enabled).</p>";
    html += "<a href='" + settingsUrl + "' style='display:inline-block;background:#ef4444;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;'>Adjust Budget</a>";
    html += "</td></tr></table>";
    html += "</td></tr></table></body></html>";

    const textContent = `APIClaw Budget Alert\n\nYou've used ${percentageUsed}% of your monthly budget.\nCurrent spend: $${currentSpendUsd} / $${budgetCapUsd}\n\nAdjust your budget: ${settingsUrl}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.email,
        subject: "⚠️ APIClaw: 80% of Monthly Budget Used",
        html: html,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send budget alert email:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  },
});

/**
 * Send budget exceeded email
 */
export const sendBudgetExceededEmail = internalAction({
  args: {
    email: v.string(),
    currentSpendCents: v.number(),
    budgetCapCents: v.number(),
    isPaused: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Belt-and-suspenders email send guard.
    const guard = checkEmailAllowedSync(args.email);
    if (!guard.allowed) {
      console.warn(`[spendAlerts] blocked outbound to ${args.email}: ${guard.reason}`);
      return { success: false, skippedReason: guard.reason };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email not configured" };
    }

    const currentSpendUsd = (args.currentSpendCents / 100).toFixed(2);
    const budgetCapUsd = (args.budgetCapCents / 100).toFixed(2);
    const settingsUrl = `${APP_URL}/dashboard/settings`;

    const pauseMessage = args.isPaused 
      ? "API execution has been paused. Increase your budget or disable pause-on-exceed to continue."
      : "Your agents can still make calls, but you're over budget.";

    let html = "<!DOCTYPE html><html><head><meta charset='utf-8'></head>";
    html += "<body style='margin:0;padding:40px;background:#f5f5f5;font-family:Arial,sans-serif;'>";
    html += "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center'>";
    html += "<table width='500' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;'>";
    html += "<tr><td style='padding:32px;text-align:center;'>";
    html += "<div style='font-size:48px;'>🦞</div>";
    html += "<h1 style='margin:16px 0;color:#0a0a0a;'>APIClaw</h1>";
    html += "<h2 style='margin:0 0 16px;font-size:20px;color:#ef4444;'>🚨 Budget Exceeded</h2>";
    html += "<p style='margin:0 0 16px;color:#525252;font-size:16px;'>Your monthly budget has been exceeded.</p>";
    html += "<div style='background:#fee2e2;border:1px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:24px;'>";
    html += "<p style='margin:0;color:#991b1b;font-size:14px;'><strong>Current spend:</strong> $" + currentSpendUsd + " / $" + budgetCapUsd + "</p>";
    html += "</div>";
    html += "<p style='margin:0 0 24px;color:#525252;font-size:14px;'>" + pauseMessage + "</p>";
    html += "<a href='" + settingsUrl + "' style='display:inline-block;background:#ef4444;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;'>Increase Budget</a>";
    html += "</td></tr></table>";
    html += "</td></tr></table></body></html>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.email,
        subject: "🚨 APIClaw: Monthly Budget Exceeded",
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send budget exceeded email:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  },
});

// ============================================
// CRON: Monthly reset
// ============================================

/**
 * Reset monthly spend for all workspaces (called by cron on 1st of month)
 */
export const resetMonthlySpend = internalMutation({
  args: {},
  handler: async (ctx) => {
    const monthStart = getMonthStart();
    
    // Get all workspaces with spend tracking
    const workspaces = await ctx.db
      .query("workspaces")
      .collect();

    let resetCount = 0;
    for (const workspace of workspaces) {
      if (workspace.monthlySpendCents && workspace.monthlySpendCents > 0) {
        await ctx.db.patch(workspace._id, {
          monthlySpendCents: 0,
          lastSpendResetAt: monthStart,
          budgetAlertSentAt: undefined, // Reset alert flag for new month
          updatedAt: Date.now(),
        });
        resetCount++;
      }
    }

    return { resetCount };
  },
});
