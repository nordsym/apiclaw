/**
 * APIClaw Chain Executor
 * 
 * Orchestrates multi-step API chains with:
 * - Sequential execution
 * - Parallel batches
 * - Conditional branching
 * - ForEach loops
 * - Error handling and retry
 * - Full execution trace
 */

import { executeAPICall } from './execute.js';
import {
  ChainContext,
  ChainStep,
  ChainStepUnion,
  ParallelStep,
  ConditionalStep,
  ForEachStep,
  ErrorConfig,
  resolveReferences,
  validateReferences,
  evaluateCondition,
  ReferenceError,
} from './chainResolver.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ChainDefinition {
  id?: string;
  name?: string;
  description?: string;
  steps: ChainStepUnion[];
  inputs?: Record<string, InputDefinition>;
  errorPolicy?: ErrorPolicy;
  limits?: ChainLimits;
  timeout?: number;
}

export interface InputDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  description?: string;
}

export interface ErrorPolicy {
  mode: 'fail-fast' | 'best-effort' | 'transactional';
  rollback?: RollbackStep[];
}

export interface RollbackStep {
  if: string;
  do: ChainStep;
}

export interface ChainLimits {
  maxSteps?: number;
  maxParallel?: number;
  maxCost?: { cents: number };
}

export interface Credentials {
  userId?: string;
  customerKeys?: Record<string, string>;  // providerId → API key
}

export interface ChainOptions {
  dryRun?: boolean;
  verbose?: boolean;
  onStepComplete?: (step: StepTrace) => void;
  onStepStart?: (stepId: string, stepIndex: number) => void;
}

export interface ChainResult {
  success: boolean;
  chainId: string;
  startedAt: string;
  completedAt: string;
  totalLatencyMs: number;
  totalCost: { cents: number };
  
  // Results
  finalResult?: any;
  results: Record<string, any>;
  
  // Error info (if failed)
  error?: ChainError;
  completedSteps: string[];
  failedStep?: StepTrace;
  
  // Full trace
  trace: StepTrace[];
  
  // Resume capability
  canResume: boolean;
  resumeToken?: string;
}

export interface ChainError {
  stepId: string;
  code: string;
  message: string;
  retryAfter?: number;
}

export interface StepTrace {
  stepId: string;
  stepIndex: number;
  provider: string;
  action: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  success: boolean;
  input: Record<string, any>;
  output?: any;
  error?: string;
  errorCode?: string;
  cost?: { cents: number };
  retries?: number;
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

/**
 * Execute a chain of API calls
 */
export async function executeChain(
  chain: ChainDefinition,
  credentials: Credentials,
  inputs?: Record<string, any>,
  options: ChainOptions = {}
): Promise<ChainResult> {
  const chainId = chain.id || generateChainId();
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  
  // Initialize context
  const context: ChainContext = {
    results: {},
    inputs: inputs || {},
    currentIndex: 0,
    startedAt,
    env: process.env as Record<string, string>,
  };
  
  // Initialize result
  const result: ChainResult = {
    success: false,
    chainId,
    startedAt,
    completedAt: '',
    totalLatencyMs: 0,
    totalCost: { cents: 0 },
    results: {},
    completedSteps: [],
    trace: [],
    canResume: false,
  };
  
  try {
    // Validate inputs
    if (chain.inputs) {
      validateInputs(inputs || {}, chain.inputs);
    }
    
    // Validate references before execution
    const validation = validateReferences(chain.steps);
    if (!validation.valid) {
      const errorMsg = validation.errors.map(e => `${e.stepId}: ${e.message}`).join('; ');
      throw new Error(`Reference validation failed: ${errorMsg}`);
    }
    
    // Log warnings
    if (options.verbose && validation.warnings.length > 0) {
      console.log('[Chain] Warnings:', validation.warnings);
    }
    
    // Check limits
    if (chain.limits?.maxSteps && chain.steps.length > chain.limits.maxSteps) {
      throw new Error(`Chain exceeds maxSteps limit (${chain.steps.length} > ${chain.limits.maxSteps})`);
    }
    
    // Execute steps
    let lastStepResult: any;
    
    for (let i = 0; i < chain.steps.length; i++) {
      const step = chain.steps[i];
      context.currentIndex = i;
      
      // Check timeout
      if (chain.timeout && Date.now() - startTime > chain.timeout) {
        throw new TimeoutError(`Chain exceeded timeout of ${chain.timeout}ms`);
      }
      
      // Execute based on step type
      if (isParallelStep(step)) {
        lastStepResult = await executeParallelStep(step, context, credentials, options, result);
      } else if (isConditionalStep(step)) {
        lastStepResult = await executeConditionalStep(step, context, credentials, options, result);
      } else if (isForEachStep(step)) {
        lastStepResult = await executeForEachStep(step, context, credentials, options, result, chain.limits);
      } else {
        lastStepResult = await executeSingleStep(step, context, credentials, options, result, chain.errorPolicy);
      }
    }
    
    // Success!
    result.success = true;
    result.finalResult = lastStepResult;
    result.results = { ...context.results };
    
  } catch (error: any) {
    // Handle failure
    result.success = false;
    result.error = {
      stepId: result.failedStep?.stepId || 'unknown',
      code: error.code || 'CHAIN_ERROR',
      message: error.message,
      retryAfter: error.retryAfter,
    };
    result.results = { ...context.results };
    
    // Handle rollback for transactional mode
    if (chain.errorPolicy?.mode === 'transactional' && chain.errorPolicy.rollback) {
      await executeRollback(chain.errorPolicy.rollback, context, credentials, options, result);
    }
    
    // Can resume if we have completed steps
    result.canResume = result.completedSteps.length > 0;
    if (result.canResume) {
      result.resumeToken = `${chainId}_step_${result.completedSteps.length}`;
    }
  }
  
  // Finalize
  result.completedAt = new Date().toISOString();
  result.totalLatencyMs = Date.now() - startTime;
  
  return result;
}

// ============================================================================
// STEP TYPE GUARDS
// ============================================================================

function isParallelStep(step: ChainStepUnion): step is ParallelStep {
  return 'parallel' in step;
}

function isConditionalStep(step: ChainStepUnion): step is ConditionalStep {
  return 'if' in step;
}

function isForEachStep(step: ChainStepUnion): step is ForEachStep {
  return 'forEach' in step;
}

// ============================================================================
// SINGLE STEP EXECUTION
// ============================================================================

async function executeSingleStep(
  step: ChainStep,
  context: ChainContext,
  credentials: Credentials,
  options: ChainOptions,
  result: ChainResult,
  errorPolicy?: ErrorPolicy
): Promise<any> {
  const stepStart = Date.now();
  const stepTrace: StepTrace = {
    stepId: step.id,
    stepIndex: context.currentIndex,
    provider: step.provider,
    action: step.action,
    startedAt: new Date().toISOString(),
    completedAt: '',
    latencyMs: 0,
    success: false,
    input: {},
  };
  
  options.onStepStart?.(step.id, context.currentIndex);
  
  try {
    // Resolve references in params
    const resolvedParams = step.params ? resolveReferences(step.params, context) : {};
    stepTrace.input = resolvedParams;
    
    // Execute with retry if configured
    const maxRetries = step.onError?.retry?.attempts || 0;
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Get customer key for this provider
        const customerKey = credentials.customerKeys?.[step.provider];
        
        // Execute the API call
        const apiResult = await executeAPICall(
          step.provider,
          step.action,
          resolvedParams,
          credentials.userId,
          customerKey
        );
        
        if (!apiResult.success) {
          throw new StepError(apiResult.error || 'API call failed', apiResult.code || 'PROVIDER_ERROR');
        }
        
        // Success!
        stepTrace.success = true;
        stepTrace.output = apiResult.data;
        stepTrace.cost = apiResult.cost ? { cents: Math.round(apiResult.cost * 100) } : undefined;
        
        // Update context
        context.results[step.id] = apiResult.data;
        context.prevStepId = step.id;
        
        // Update result
        result.completedSteps.push(step.id);
        if (stepTrace.cost) {
          result.totalCost.cents += stepTrace.cost.cents;
        }
        
        return apiResult.data;
        
      } catch (error: any) {
        lastError = error;
        stepTrace.retries = attempt;
        
        if (attempt < maxRetries) {
          // Wait before retry
          const backoff = step.onError?.retry?.backoff?.[attempt] || 1000 * Math.pow(2, attempt);
          await sleep(backoff);
        }
      }
    }
    
    // All retries exhausted
    throw lastError;
    
  } catch (error: any) {
    stepTrace.success = false;
    stepTrace.error = error.message;
    stepTrace.errorCode = error.code;
    
    // Handle error based on policy
    const shouldAbort = step.onError?.abort !== false && errorPolicy?.mode !== 'best-effort';
    
    // Try fallback if configured
    if (step.onError?.fallback && !options.dryRun) {
      try {
        const fallbackResult = await executeSingleStep(
          step.onError.fallback,
          context,
          credentials,
          options,
          result,
          errorPolicy
        );
        
        // Use fallback result as this step's result
        context.results[step.id] = fallbackResult;
        context.prevStepId = step.id;
        stepTrace.success = true;
        stepTrace.output = { fallback: true, result: fallbackResult };
        result.completedSteps.push(step.id);
        
        return fallbackResult;
      } catch (fallbackError: any) {
        // Fallback also failed
        stepTrace.error = `Original: ${error.message}; Fallback: ${fallbackError.message}`;
      }
    }
    
    result.failedStep = stepTrace;
    
    if (shouldAbort) {
      throw error;
    }
    
    // Best-effort mode: continue despite failure
    context.results[step.id] = { error: error.message };
    context.prevStepId = step.id;
    return { error: error.message };
    
  } finally {
    stepTrace.completedAt = new Date().toISOString();
    stepTrace.latencyMs = Date.now() - stepStart;
    result.trace.push(stepTrace);
    options.onStepComplete?.(stepTrace);
  }
}

// ============================================================================
// PARALLEL EXECUTION
// ============================================================================

async function executeParallelStep(
  step: ParallelStep,
  context: ChainContext,
  credentials: Credentials,
  options: ChainOptions,
  result: ChainResult
): Promise<any[]> {
  const parallelResults = await Promise.all(
    step.parallel.map(async (ps, idx) => {
      // Create a copy of context for each parallel step
      const parallelContext: ChainContext = {
        ...context,
        currentIndex: context.currentIndex,
      };
      
      try {
        return await executeSingleStep(ps, parallelContext, credentials, options, result);
      } catch (error) {
        // Return error as result for best-effort
        return { error: (error as Error).message };
      }
    })
  );
  
  // Store parallel results
  context.parallelResults = parallelResults;
  
  // Copy results from parallel steps to main context
  for (let i = 0; i < step.parallel.length; i++) {
    const ps = step.parallel[i];
    context.results[ps.id] = parallelResults[i];
  }
  
  // Last parallel step becomes prev
  context.prevStepId = step.parallel[step.parallel.length - 1].id;
  
  return parallelResults;
}

// ============================================================================
// CONDITIONAL EXECUTION
// ============================================================================

async function executeConditionalStep(
  step: ConditionalStep,
  context: ChainContext,
  credentials: Credentials,
  options: ChainOptions,
  result: ChainResult
): Promise<any> {
  // Evaluate condition
  const conditionResult = evaluateCondition(step.if, context);
  
  // Choose branch
  const branch = conditionResult ? step.then : step.else;
  
  if (!branch) {
    // No else branch and condition is false
    return null;
  }
  
  // Execute branch (can be single step or array)
  const steps = Array.isArray(branch) ? branch : [branch];
  let lastResult: any;
  
  for (const branchStep of steps) {
    lastResult = await executeSingleStep(branchStep, context, credentials, options, result);
  }
  
  return lastResult;
}

// ============================================================================
// FOREACH EXECUTION
// ============================================================================

async function executeForEachStep(
  step: ForEachStep,
  context: ChainContext,
  credentials: Credentials,
  options: ChainOptions,
  result: ChainResult,
  limits?: ChainLimits
): Promise<any[]> {
  // Resolve the array to iterate over
  const arrayRef = step.forEach;
  let items: any[];
  
  // Handle reference vs direct array
  if (arrayRef.startsWith('$')) {
    // It's a reference - resolve it
    const resolved = resolveReferences({ items: arrayRef }, context);
    items = resolved.items;
  } else {
    // Try to parse as JSON array
    try {
      items = JSON.parse(arrayRef);
    } catch {
      throw new Error(`forEach value must be a reference or JSON array: ${arrayRef}`);
    }
  }
  
  if (!Array.isArray(items)) {
    throw new Error(`forEach target must resolve to an array, got: ${typeof items}`);
  }
  
  // Check max iterations
  if (limits?.maxSteps && items.length > limits.maxSteps) {
    throw new Error(`forEach exceeds maxSteps limit (${items.length} iterations)`);
  }
  
  const forEachResults: any[] = [];
  
  for (let i = 0; i < items.length; i++) {
    // Set up forEach context
    context.forEachItem = items[i];
    context.forEachIndex = i;
    context.forEachResults = forEachResults;
    
    // Create step with dynamic ID
    const dynamicStep: ChainStep = {
      ...step.do,
      id: step.do.id.replace(/\$index/g, String(i)),
    };
    
    const itemResult = await executeSingleStep(
      dynamicStep,
      context,
      credentials,
      options,
      result
    );
    
    forEachResults.push(itemResult);
  }
  
  // Clean up forEach context
  delete context.forEachItem;
  delete context.forEachIndex;
  context.forEachResults = forEachResults;
  
  // Store aggregate results
  context.results['$forEach'] = { results: forEachResults };
  
  return forEachResults;
}

// ============================================================================
// ROLLBACK EXECUTION
// ============================================================================

async function executeRollback(
  rollbackSteps: RollbackStep[],
  context: ChainContext,
  credentials: Credentials,
  options: ChainOptions,
  result: ChainResult
): Promise<void> {
  for (const rb of rollbackSteps) {
    try {
      const shouldRollback = evaluateCondition(rb.if, context);
      
      if (shouldRollback) {
        await executeSingleStep(rb.do, context, credentials, { ...options, verbose: false }, result);
      }
    } catch (error) {
      // Log but don't fail on rollback errors
      console.error('[Chain] Rollback failed:', error);
    }
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

function validateInputs(inputs: Record<string, any>, definitions: Record<string, InputDefinition>): void {
  for (const [name, def] of Object.entries(definitions)) {
    const value = inputs[name];
    
    // Check required
    if (def.required && value === undefined) {
      if (def.default !== undefined) {
        inputs[name] = def.default;
      } else {
        throw new Error(`Missing required input: ${name}`);
      }
    }
    
    // Apply default
    if (value === undefined && def.default !== undefined) {
      inputs[name] = def.default;
    }
    
    // Type check (if value provided)
    if (inputs[name] !== undefined) {
      const actualType = Array.isArray(inputs[name]) ? 'array' : typeof inputs[name];
      if (actualType !== def.type) {
        throw new Error(`Input '${name}' must be ${def.type}, got ${actualType}`);
      }
    }
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateChainId(): string {
  return `chain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class StepError extends Error {
  code: string;
  retryAfter?: number;
  
  constructor(message: string, code: string, retryAfter?: number) {
    super(message);
    this.name = 'StepError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export class TimeoutError extends Error {
  code = 'TIMEOUT';
  
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// CHAIN STATUS & RESUME (Stubs for future implementation)
// ============================================================================

// In-memory store for running chains (would be Redis/DB in production)
const runningChains = new Map<string, { status: string; result?: ChainResult }>();

/**
 * Get status of a running or completed chain
 */
export async function getChainStatus(chainId: string): Promise<{
  chainId: string;
  status: 'running' | 'completed' | 'failed' | 'not_found';
  result?: ChainResult;
}> {
  const entry = runningChains.get(chainId);
  
  if (!entry) {
    return { chainId, status: 'not_found' };
  }
  
  return {
    chainId,
    status: entry.status as 'running' | 'completed' | 'failed',
    result: entry.result,
  };
}

/**
 * Resume a failed chain from a resume token
 */
export async function resumeChain(
  resumeToken: string,
  chain: ChainDefinition,
  credentials: Credentials,
  inputs?: Record<string, any>,
  overrides?: Record<string, Record<string, any>>,
  options: ChainOptions = {}
): Promise<ChainResult> {
  // Parse resume token: chain_xyz_step_N
  const match = resumeToken.match(/^(.+)_step_(\d+)$/);
  
  if (!match) {
    throw new Error(`Invalid resume token: ${resumeToken}`);
  }
  
  const [, chainId, stepIndexStr] = match;
  const resumeFromIndex = parseInt(stepIndexStr, 10);
  
  // Create a modified chain starting from the resume point
  const resumedChain: ChainDefinition = {
    ...chain,
    id: chainId,
    steps: chain.steps.slice(resumeFromIndex),
  };
  
  // Apply any overrides to the resumed steps
  if (overrides) {
    for (const step of resumedChain.steps) {
      if ('id' in step && overrides[step.id]) {
        step.params = { ...step.params, ...overrides[step.id] };
      }
    }
  }
  
  // Execute the resumed chain
  // Note: In a real implementation, we'd restore the context from the previous run
  return executeChain(resumedChain, credentials, inputs, options);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  ChainContext,
  ChainStep,
  ChainStepUnion,
  resolveReferences,
  validateReferences,
  evaluateCondition,
} from './chainResolver.js';
