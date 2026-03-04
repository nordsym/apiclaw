import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

type ChainStatus = "pending" | "running" | "completed" | "failed" | "paused";
type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface ChainStep {
  id: string;
  provider: string;
  action: string;
  params: Record<string, unknown>;
  onError?: {
    retry?: { attempts: number; backoff?: number[] };
    fallback?: ChainStep;
    abort?: boolean;
  };
  parallel?: ChainStep[];
}

interface ChainError {
  stepId: string;
  code: string;
  message: string;
  retryAfter?: number;
}

// ============================================
// HELPER: Generate resume token
// ============================================

function generateResumeToken(chainId: string, stepIndex: number): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `chain_${chainId.slice(-8)}_step_${stepIndex}_${random}`;
}

// ============================================
// DASHBOARD QUERIES (for workspace chains page)
// ============================================

/**
 * Get chain executions for a workspace (authenticated via session token)
 */
export const getChainExecutions = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get chains for workspace
    const allChains = await ctx.db
      .query("chains")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .order("desc")
      .collect();
    
    // Filter by status if provided
    let filteredChains = allChains;
    if (args.status && args.status !== "all") {
      filteredChains = allChains.filter((c) => c.status === args.status);
    }

    // Apply limit
    const limit = args.limit || 50;
    const chains = filteredChains.slice(0, limit);

    // For each chain, get step count from chainExecutions
    const chainsWithStepCount = await Promise.all(
      chains.map(async (chain) => {
        const steps = await ctx.db
          .query("chainExecutions")
          .withIndex("by_chainId", (q) => q.eq("chainId", chain._id))
          .collect();

        return {
          _id: chain._id,
          status: chain.status,
          currentStep: chain.currentStep,
          stepsCount: steps.length || chain.steps?.length || 0,
          totalCostCents: chain.totalCostCents || 0,
          totalLatencyMs: chain.totalLatencyMs || 0,
          error: chain.error,
          canResume: chain.canResume,
          resumeToken: chain.resumeToken,
          createdAt: chain.createdAt,
          startedAt: chain.startedAt,
          completedAt: chain.completedAt,
        };
      })
    );

    return chainsWithStepCount;
  },
});

/**
 * Get full trace for a single chain (authenticated via session token)
 */
export const getChainTraceAuth = query({
  args: {
    token: v.string(),
    chainId: v.id("chains"),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get the chain
    const chain = await ctx.db.get(args.chainId);
    if (!chain || chain.workspaceId !== session.workspaceId) {
      return { error: "Chain not found" };
    }

    // Get all step executions
    const executions = await ctx.db
      .query("chainExecutions")
      .withIndex("by_chainId", (q) => q.eq("chainId", args.chainId))
      .collect();

    // Sort by stepIndex
    executions.sort((a, b) => a.stepIndex - b.stepIndex);

    // Calculate total tokens saved (estimate: ~400 tokens per step avoided)
    const completedSteps = executions.filter((e) => e.status === "completed");
    const tokensSaved = completedSteps.length > 1 ? (completedSteps.length - 1) * 400 : 0;

    return {
      chain: {
        _id: chain._id,
        status: chain.status,
        currentStep: chain.currentStep,
        steps: chain.steps,
        results: chain.results,
        error: chain.error,
        continueOnError: chain.continueOnError,
        timeout: chain.timeout,
        canResume: chain.canResume,
        resumeToken: chain.resumeToken,
        totalCostCents: chain.totalCostCents || 0,
        totalLatencyMs: chain.totalLatencyMs || 0,
        createdAt: chain.createdAt,
        startedAt: chain.startedAt,
        completedAt: chain.completedAt,
      },
      executions: executions.map((e) => ({
        _id: e._id,
        stepId: e.stepId,
        stepIndex: e.stepIndex,
        status: e.status,
        input: e.input,
        output: e.output,
        latencyMs: e.latencyMs,
        costCents: e.costCents,
        error: e.error,
        parallelGroup: e.parallelGroup,
        createdAt: e.createdAt,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
      })),
      tokensSaved,
    };
  },
});

/**
 * Resume a failed/paused chain (authenticated via session token)
 */
export const resumeChainAuth = mutation({
  args: {
    token: v.string(),
    chainId: v.id("chains"),
    overrides: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get the chain
    const chain = await ctx.db.get(args.chainId);
    if (!chain || chain.workspaceId !== session.workspaceId) {
      return { error: "Chain not found" };
    }

    if (!chain.canResume) {
      return { error: "Chain cannot be resumed" };
    }

    // Update chain status to pending (orchestrator will pick it up)
    await ctx.db.patch(args.chainId, {
      status: "pending",
      error: undefined,
    });

    return { success: true, chainId: args.chainId };
  },
});

/**
 * Get chain statistics for workspace (authenticated via session token)
 */
export const getChainStatsAuth = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { error: "Invalid session" };
    }

    const chains = await ctx.db
      .query("chains")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    const total = chains.length;
    const completed = chains.filter((c) => c.status === "completed").length;
    const failed = chains.filter((c) => c.status === "failed").length;
    const running = chains.filter((c) => c.status === "running").length;
    const paused = chains.filter((c) => c.status === "paused").length;

    const totalCostCents = chains.reduce((acc, c) => acc + (c.totalCostCents || 0), 0);
    const totalLatencyMs = chains.reduce((acc, c) => acc + (c.totalLatencyMs || 0), 0);

    // Count total steps across all chains
    const allExecutions = await Promise.all(
      chains.map((c) =>
        ctx.db
          .query("chainExecutions")
          .withIndex("by_chainId", (q) => q.eq("chainId", c._id))
          .collect()
      )
    );
    const totalSteps = allExecutions.flat().length;

    return {
      total,
      completed,
      failed,
      running,
      paused,
      totalCostCents,
      totalLatencyMs,
      totalSteps,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new chain execution record (internal)
 */
export const createChainInternal = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    steps: v.array(v.any()),
    continueOnError: v.optional(v.boolean()),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate steps have required fields
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i] as ChainStep;
      
      if (step.parallel) {
        for (const pStep of step.parallel) {
          if (!pStep.id || !pStep.provider || !pStep.action) {
            throw new Error(`Parallel step at index ${i} missing required fields (id, provider, action)`);
          }
        }
      } else if (!step.id || !step.provider || !step.action) {
        throw new Error(`Step at index ${i} missing required fields (id, provider, action)`);
      }
    }

    // Create chain record
    const chainId = await ctx.db.insert("chains", {
      workspaceId: args.workspaceId,
      steps: args.steps,
      status: "pending",
      currentStep: 0,
      results: {},
      continueOnError: args.continueOnError ?? false,
      timeout: args.timeout,
      totalCostCents: 0,
      totalLatencyMs: 0,
      createdAt: now,
    });

    // Create execution records for each step
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i] as ChainStep;
      
      if (step.parallel) {
        const parallelGroup = `parallel_${i}_${Date.now()}`;
        for (const pStep of step.parallel) {
          await ctx.db.insert("chainExecutions", {
            chainId,
            stepId: pStep.id,
            stepIndex: i,
            status: "pending",
            parallelGroup,
            createdAt: now,
          });
        }
      } else {
        await ctx.db.insert("chainExecutions", {
          chainId,
          stepId: step.id,
          stepIndex: i,
          status: "pending",
          createdAt: now,
        });
      }
    }

    return chainId;
  },
});

/**
 * Create a new chain execution record (public API)
 */
export const createChain = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    steps: v.array(v.any()),
    continueOnError: v.optional(v.boolean()),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate steps
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i] as ChainStep;
      
      if (step.parallel) {
        for (const pStep of step.parallel) {
          if (!pStep.id || !pStep.provider || !pStep.action) {
            throw new Error(`Parallel step at index ${i} missing required fields (id, provider, action)`);
          }
        }
      } else if (!step.id || !step.provider || !step.action) {
        throw new Error(`Step at index ${i} missing required fields (id, provider, action)`);
      }
    }

    const chainId = await ctx.db.insert("chains", {
      workspaceId: args.workspaceId,
      steps: args.steps,
      status: "pending",
      currentStep: 0,
      results: {},
      continueOnError: args.continueOnError ?? false,
      timeout: args.timeout,
      totalCostCents: 0,
      totalLatencyMs: 0,
      createdAt: now,
    });

    // Create execution records
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i] as ChainStep;
      
      if (step.parallel) {
        const parallelGroup = `parallel_${i}_${Date.now()}`;
        for (const pStep of step.parallel) {
          await ctx.db.insert("chainExecutions", {
            chainId,
            stepId: pStep.id,
            stepIndex: i,
            status: "pending",
            parallelGroup,
            createdAt: now,
          });
        }
      } else {
        await ctx.db.insert("chainExecutions", {
          chainId,
          stepId: step.id,
          stepIndex: i,
          status: "pending",
          createdAt: now,
        });
      }
    }

    return chainId;
  },
});

/**
 * Create chain from template
 */
export const createChainFromTemplate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    templateName: v.string(),
    inputs: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("chainTemplates")
      .withIndex("by_name", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("name", args.templateName)
      )
      .first();

    if (!template) {
      throw new Error(`Template '${args.templateName}' not found`);
    }

    const now = Date.now();

    const chainId = await ctx.db.insert("chains", {
      workspaceId: args.workspaceId,
      steps: template.chain,
      status: "pending",
      currentStep: 0,
      results: {},
      totalCostCents: 0,
      totalLatencyMs: 0,
      createdAt: now,
    });

    for (let i = 0; i < template.chain.length; i++) {
      const step = template.chain[i] as ChainStep;
      
      if (step.parallel) {
        const parallelGroup = `parallel_${i}_${Date.now()}`;
        for (const pStep of step.parallel) {
          await ctx.db.insert("chainExecutions", {
            chainId,
            stepId: pStep.id,
            stepIndex: i,
            status: "pending",
            parallelGroup,
            createdAt: now,
          });
        }
      } else {
        await ctx.db.insert("chainExecutions", {
          chainId,
          stepId: step.id,
          stepIndex: i,
          status: "pending",
          createdAt: now,
        });
      }
    }

    await ctx.db.patch(template._id, {
      useCount: (template.useCount || 0) + 1,
      lastUsedAt: now,
    });

    return chainId;
  },
});

/**
 * Execute a single step and store the result
 */
export const executeStep = internalMutation({
  args: {
    chainId: v.id("chains"),
    stepId: v.string(),
    stepIndex: v.number(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const execution = await ctx.db
      .query("chainExecutions")
      .withIndex("by_chainId_stepId", (q) => 
        q.eq("chainId", args.chainId).eq("stepId", args.stepId)
      )
      .first();

    if (!execution) {
      throw new Error(`No execution record found for step ${args.stepId}`);
    }

    await ctx.db.patch(execution._id, {
      status: "running",
      input: args.input,
      startedAt: now,
    });

    const chain = await ctx.db.get(args.chainId);
    if (chain && chain.status === "pending") {
      await ctx.db.patch(args.chainId, {
        status: "running",
        startedAt: now,
      });
    }

    return execution._id;
  },
});

/**
 * Record step completion with result
 */
export const completeStep = internalMutation({
  args: {
    chainId: v.id("chains"),
    stepId: v.string(),
    output: v.any(),
    latencyMs: v.number(),
    costCents: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const execution = await ctx.db
      .query("chainExecutions")
      .withIndex("by_chainId_stepId", (q) => 
        q.eq("chainId", args.chainId).eq("stepId", args.stepId)
      )
      .first();

    if (!execution) {
      throw new Error(`No execution record found for step ${args.stepId}`);
    }

    await ctx.db.patch(execution._id, {
      status: "completed",
      output: args.output,
      latencyMs: args.latencyMs,
      costCents: args.costCents,
      completedAt: now,
    });

    const chain = await ctx.db.get(args.chainId);
    if (chain) {
      const results = { ...(chain.results || {}), [args.stepId]: args.output };
      const totalCost = (chain.totalCostCents || 0) + args.costCents;
      const totalLatency = (chain.totalLatencyMs || 0) + args.latencyMs;

      await ctx.db.patch(args.chainId, {
        results,
        totalCostCents: totalCost,
        totalLatencyMs: totalLatency,
      });
    }

    return { success: true };
  },
});

/**
 * Advance chain to next step
 */
export const advanceChain = internalMutation({
  args: {
    chainId: v.id("chains"),
  },
  handler: async (ctx, args) => {
    const chain = await ctx.db.get(args.chainId);
    if (!chain) {
      throw new Error("Chain not found");
    }

    const nextStep = chain.currentStep + 1;

    if (nextStep >= chain.steps.length) {
      return { complete: true, nextStep: null };
    }

    await ctx.db.patch(args.chainId, {
      currentStep: nextStep,
    });

    const resumeToken = generateResumeToken(args.chainId, nextStep);
    await ctx.db.patch(args.chainId, {
      resumeToken,
      canResume: true,
    });

    return { 
      complete: false, 
      nextStep,
      nextStepDef: chain.steps[nextStep],
    };
  },
});

/**
 * Handle chain failure
 */
export const failChain = internalMutation({
  args: {
    chainId: v.id("chains"),
    stepId: v.string(),
    error: v.object({
      code: v.string(),
      message: v.string(),
      retryAfter: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const execution = await ctx.db
      .query("chainExecutions")
      .withIndex("by_chainId_stepId", (q) => 
        q.eq("chainId", args.chainId).eq("stepId", args.stepId)
      )
      .first();

    if (execution) {
      await ctx.db.patch(execution._id, {
        status: "failed",
        error: {
          code: args.error.code,
          message: args.error.message,
        },
        completedAt: now,
      });
    }

    const chain = await ctx.db.get(args.chainId);
    if (!chain) {
      throw new Error("Chain not found");
    }

    const resumeToken = generateResumeToken(args.chainId, chain.currentStep);

    await ctx.db.patch(args.chainId, {
      status: "failed",
      error: {
        stepId: args.stepId,
        ...args.error,
      },
      resumeToken,
      canResume: true,
      completedAt: now,
    });

    return {
      resumeToken,
      partialResults: chain.results,
    };
  },
});

/**
 * Resume chain from failed step (public mutation)
 */
export const resumeChain = mutation({
  args: {
    resumeToken: v.string(),
    overrides: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const chain = await ctx.db
      .query("chains")
      .withIndex("by_resumeToken", (q) => q.eq("resumeToken", args.resumeToken))
      .first();

    if (!chain) {
      throw new Error("Invalid or expired resume token");
    }

    if (!chain.canResume) {
      throw new Error("Chain cannot be resumed");
    }

    const executions = await ctx.db
      .query("chainExecutions")
      .withIndex("by_chainId_stepIndex", (q) => 
        q.eq("chainId", chain._id).eq("stepIndex", chain.currentStep)
      )
      .collect();

    for (const exec of executions) {
      if (exec.status === "failed") {
        await ctx.db.patch(exec._id, {
          status: "pending",
          error: undefined,
          startedAt: undefined,
          completedAt: undefined,
        });
      }
    }

    await ctx.db.patch(chain._id, {
      status: "pending",
      error: undefined,
      resumeToken: undefined,
      canResume: false,
    });

    return {
      chainId: chain._id,
      resumeFromStep: chain.currentStep,
      steps: chain.steps,
      results: chain.results,
      overrides: args.overrides,
    };
  },
});

/**
 * Mark chain as completed
 */
export const completeChain = internalMutation({
  args: {
    chainId: v.id("chains"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const chain = await ctx.db.get(args.chainId);

    if (!chain) {
      throw new Error("Chain not found");
    }

    await ctx.db.patch(args.chainId, {
      status: "completed",
      canResume: false,
      resumeToken: undefined,
      completedAt: now,
    });

    return {
      success: true,
      results: chain.results,
      totalCostCents: chain.totalCostCents,
      totalLatencyMs: chain.totalLatencyMs,
    };
  },
});

/**
 * Pause chain execution
 */
export const pauseChain = mutation({
  args: {
    chainId: v.id("chains"),
  },
  handler: async (ctx, args) => {
    const chain = await ctx.db.get(args.chainId);
    if (!chain) {
      throw new Error("Chain not found");
    }

    if (chain.status !== "running") {
      throw new Error("Can only pause running chains");
    }

    const resumeToken = generateResumeToken(args.chainId, chain.currentStep);

    await ctx.db.patch(args.chainId, {
      status: "paused",
      resumeToken,
      canResume: true,
    });

    return { resumeToken };
  },
});

// ============================================
// CHAIN TEMPLATE MUTATIONS
// ============================================

export const saveChainTemplate = mutation({
  args: {
    id: v.optional(v.id("chainTemplates")),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    inputs: v.optional(v.any()),
    chain: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.id) {
      await ctx.db.patch(args.id, {
        name: args.name,
        description: args.description,
        inputs: args.inputs,
        chain: args.chain,
        updatedAt: now,
      });
      return args.id;
    }

    return await ctx.db.insert("chainTemplates", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      inputs: args.inputs,
      chain: args.chain,
      useCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteChainTemplate = mutation({
  args: {
    id: v.id("chainTemplates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================
// QUERIES
// ============================================

export const getChain = query({
  args: {
    chainId: v.id("chains"),
  },
  handler: async (ctx, args) => {
    const chain = await ctx.db.get(args.chainId);
    if (!chain) {
      return null;
    }

    return {
      id: chain._id,
      status: chain.status,
      currentStep: chain.currentStep,
      totalSteps: chain.steps.length,
      results: chain.results,
      error: chain.error,
      canResume: chain.canResume,
      resumeToken: chain.resumeToken,
      totalCostCents: chain.totalCostCents,
      totalLatencyMs: chain.totalLatencyMs,
      createdAt: chain.createdAt,
      startedAt: chain.startedAt,
      completedAt: chain.completedAt,
    };
  },
});

export const getChainTrace = query({
  args: {
    chainId: v.id("chains"),
  },
  handler: async (ctx, args) => {
    const chain = await ctx.db.get(args.chainId);
    if (!chain) {
      return null;
    }

    const executions = await ctx.db
      .query("chainExecutions")
      .withIndex("by_chainId", (q) => q.eq("chainId", args.chainId))
      .collect();

    executions.sort((a, b) => a.stepIndex - b.stepIndex);

    const trace = executions.map((exec) => ({
      stepId: exec.stepId,
      stepIndex: exec.stepIndex,
      status: exec.status,
      parallelGroup: exec.parallelGroup,
      input: exec.input,
      output: exec.output,
      latencyMs: exec.latencyMs,
      costCents: exec.costCents,
      error: exec.error,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
    }));

    const completedSteps = executions.filter((e) => e.status === "completed");
    const tokensSaved = completedSteps.length > 1 ? (completedSteps.length - 1) * 400 : 0;

    return {
      chainId: chain._id,
      workspaceId: chain.workspaceId,
      status: chain.status,
      steps: chain.steps,
      currentStep: chain.currentStep,
      results: chain.results,
      error: chain.error,
      trace,
      totalCostCents: chain.totalCostCents,
      totalLatencyMs: chain.totalLatencyMs,
      tokensSaved,
      canResume: chain.canResume,
      resumeToken: chain.resumeToken,
      createdAt: chain.createdAt,
      startedAt: chain.startedAt,
      completedAt: chain.completedAt,
    };
  },
});

export const listChains = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const chains = await ctx.db
      .query("chains")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(limit);

    let filtered = chains;
    if (args.status && args.status !== "all") {
      filtered = chains.filter((c) => c.status === args.status);
    }

    return filtered.map((chain) => ({
      id: chain._id,
      status: chain.status,
      stepsCount: chain.steps.length,
      currentStep: chain.currentStep,
      totalCostCents: chain.totalCostCents,
      totalLatencyMs: chain.totalLatencyMs,
      error: chain.error,
      canResume: chain.canResume,
      createdAt: chain.createdAt,
      completedAt: chain.completedAt,
    }));
  },
});

export const listChainTemplates = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chainTemplates")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const getChainTemplate = query({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chainTemplates")
      .withIndex("by_name", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("name", args.name)
      )
      .first();
  },
});

export const getChainStats = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const chains = await ctx.db
      .query("chains")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const total = chains.length;
    const completed = chains.filter((c) => c.status === "completed").length;
    const failed = chains.filter((c) => c.status === "failed").length;
    const running = chains.filter((c) => c.status === "running").length;
    const paused = chains.filter((c) => c.status === "paused").length;

    const totalCostCents = chains.reduce((acc, c) => acc + (c.totalCostCents || 0), 0);
    const totalLatencyMs = chains.reduce((acc, c) => acc + (c.totalLatencyMs || 0), 0);

    const allExecutions = await Promise.all(
      chains.map((c) =>
        ctx.db
          .query("chainExecutions")
          .withIndex("by_chainId", (q) => q.eq("chainId", c._id))
          .collect()
      )
    );
    const totalSteps = allExecutions.flat().length;

    return {
      total,
      completed,
      failed,
      running,
      paused,
      totalCostCents,
      totalLatencyMs,
      totalSteps,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});

// ============================================
// ACTIONS (Orchestration Logic)
// ============================================

export const runChain = action({
  args: {
    workspaceId: v.id("workspaces"),
    steps: v.array(v.any()),
    continueOnError: v.optional(v.boolean()),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    chainId: Id<"chains">;
    results?: Record<string, unknown>;
    completedSteps?: string[];
    failedStep?: { id: string; error: string; code: string };
    partialResults?: Record<string, unknown>;
    canResume?: boolean;
    resumeToken?: string;
    totalCostCents?: number;
    totalLatencyMs?: number;
  }> => {
    const startTime = Date.now();
    const timeout = args.timeout || 30000;

    const chainId = await ctx.runMutation(internal.chains.createChainInternal, {
      workspaceId: args.workspaceId,
      steps: args.steps,
      continueOnError: args.continueOnError,
      timeout: args.timeout,
    });

    const completedSteps: string[] = [];
    let currentResults: Record<string, unknown> = {};

    try {
      for (let i = 0; i < args.steps.length; i++) {
        if (Date.now() - startTime > timeout) {
          throw new Error("TIMEOUT: Chain execution exceeded timeout");
        }

        const step = args.steps[i] as ChainStep;

        if (step.parallel && step.parallel.length > 0) {
          const parallelResults = await ctx.runAction(internal.chains.runParallelSteps, {
            chainId,
            steps: step.parallel,
            stepIndex: i,
          });

          for (const [stepId, result] of Object.entries(parallelResults)) {
            currentResults[stepId] = result;
            completedSteps.push(stepId);
          }
        } else {
          await ctx.runMutation(internal.chains.executeStep, {
            chainId,
            stepId: step.id,
            stepIndex: i,
            input: step.params,
          });

          const stepStartTime = Date.now();
          const result = await executeProviderCall(ctx, step);
          const latencyMs = Date.now() - stepStartTime;

          await ctx.runMutation(internal.chains.completeStep, {
            chainId,
            stepId: step.id,
            output: result,
            latencyMs,
            costCents: result.costCents || 0,
          });

          currentResults[step.id] = result;
          completedSteps.push(step.id);
        }

        await ctx.runMutation(internal.chains.advanceChain, { chainId });
      }

      const finalResult = await ctx.runMutation(internal.chains.completeChain, { chainId });

      return {
        success: true,
        chainId,
        results: currentResults,
        completedSteps,
        totalCostCents: finalResult.totalCostCents,
        totalLatencyMs: finalResult.totalLatencyMs,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorCode = errorMessage.startsWith("TIMEOUT") ? "TIMEOUT" : "EXECUTION_ERROR";
      
      const currentStep = args.steps[completedSteps.length] as ChainStep | undefined;
      const failedStepId = currentStep?.id || "unknown";

      const failureResult = await ctx.runMutation(internal.chains.failChain, {
        chainId,
        stepId: failedStepId,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      });

      return {
        success: false,
        chainId,
        completedSteps,
        failedStep: {
          id: failedStepId,
          error: errorMessage,
          code: errorCode,
        },
        partialResults: failureResult.partialResults,
        canResume: true,
        resumeToken: failureResult.resumeToken,
      };
    }
  },
});

export const runParallelSteps = internalAction({
  args: {
    chainId: v.id("chains"),
    steps: v.array(v.any()),
    stepIndex: v.number(),
  },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    const results: Record<string, unknown> = {};

    for (const step of args.steps as ChainStep[]) {
      await ctx.runMutation(internal.chains.executeStep, {
        chainId: args.chainId,
        stepId: step.id,
        stepIndex: args.stepIndex,
        input: step.params,
      });
    }

    const promises = (args.steps as ChainStep[]).map(async (step) => {
      const startTime = Date.now();
      
      try {
        const result = await executeProviderCall(ctx, step);
        const latencyMs = Date.now() - startTime;

        await ctx.runMutation(internal.chains.completeStep, {
          chainId: args.chainId,
          stepId: step.id,
          output: result,
          latencyMs,
          costCents: result.costCents || 0,
        });

        return { stepId: step.id, result };
      } catch (error) {
        throw new Error(`Step ${step.id} failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    });

    const settledResults = await Promise.all(promises);

    for (const { stepId, result } of settledResults) {
      results[stepId] = result;
    }

    return results;
  },
});

// ============================================
// HELPER: Execute provider call (placeholder)
// ============================================

async function executeProviderCall(
  ctx: any, 
  step: ChainStep
): Promise<{ success: boolean; data?: unknown; costCents?: number }> {
  // Simulate latency
  await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
  
  return {
    success: true,
    data: {
      stepId: step.id,
      provider: step.provider,
      action: step.action,
      params: step.params,
      mockResult: `Executed ${step.action} on ${step.provider}`,
      timestamp: Date.now(),
    },
    costCents: Math.ceil(Math.random() * 5),
  };
}
