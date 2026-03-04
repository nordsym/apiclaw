/**
 * APIClaw Chain Resolver
 * 
 * Handles reference resolution between chain steps.
 * Supports: $prev, $stepId, $parallel, $chain, $inputs, $forEach
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChainContext {
  results: Record<string, any>;     // stepId → result data
  inputs?: Record<string, any>;     // Template inputs ($inputs.x)
  currentIndex: number;             // Current step index
  startedAt: string;                // ISO timestamp
  prevStepId?: string;              // ID of previous step (for $prev)
  parallelResults?: any[];          // Results from parallel execution ($parallel)
  forEachItem?: any;                // Current item in forEach loop ($item)
  forEachIndex?: number;            // Current index in forEach loop ($index)
  forEachResults?: any[];           // Accumulated forEach results ($forEach.results)
  env?: Record<string, string>;     // Environment variables ($env.x)
}

export interface Reference {
  raw: string;                      // Original reference string (e.g., "$step1.url")
  type: 'prev' | 'step' | 'parallel' | 'chain' | 'inputs' | 'forEach' | 'item' | 'index' | 'env';
  stepId?: string;                  // For step references
  path: string[];                   // Property path (e.g., ["output", "url"])
  arrayIndex?: number;              // For array access (e.g., $parallel[0])
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  stepId: string;
  reference: string;
  message: string;
}

export interface ValidationWarning {
  stepId: string;
  reference: string;
  message: string;
}

// Chain definition types
export interface ChainStep {
  id: string;
  provider: string;
  action: string;
  params?: Record<string, any>;
  onError?: ErrorConfig;
}

export interface ParallelStep {
  parallel: ChainStep[];
}

export interface ConditionalStep {
  if: string;
  then: ChainStep | ChainStep[];
  else?: ChainStep | ChainStep[];
}

export interface ForEachStep {
  forEach: string;
  as?: string;
  do: ChainStep;
}

export type ChainStepUnion = ChainStep | ParallelStep | ConditionalStep | ForEachStep;

export interface ErrorConfig {
  retry?: { attempts: number; backoff?: number[] };
  fallback?: ChainStep;
  abort?: boolean;
}

// ============================================================================
// REFERENCE PATTERNS
// ============================================================================

// Matches all $references in a string
const REFERENCE_PATTERN = /\$(?:prev|chain|inputs|parallel|forEach|item|index|env|\w+)(?:\[\d+\])?(?:\.[a-zA-Z_][\w]*(?:\[\d+\])?)*|\$\w+(?:\.[a-zA-Z_][\w]*(?:\[\d+\])?)+/g;

// Matches a single complete reference for parsing
const SINGLE_REF_PATTERN = /^\$(\w+)(\[\d+\])?(.*)$/;

// ============================================================================
// REFERENCE EXTRACTION
// ============================================================================

/**
 * Extract all $references from a string
 */
export function extractReferences(text: string): Reference[] {
  const matches = text.match(REFERENCE_PATTERN);
  if (!matches) return [];
  
  return matches.map(parseReference).filter((r): r is Reference => r !== null);
}

/**
 * Parse a single reference string into a Reference object
 */
export function parseReference(raw: string): Reference | null {
  const match = raw.match(SINGLE_REF_PATTERN);
  if (!match) return null;
  
  const [, rootName, arrayPart, pathPart] = match;
  
  // Determine reference type
  let type: Reference['type'];
  let stepId: string | undefined;
  let arrayIndex: number | undefined;
  
  // Parse array index from root (e.g., $parallel[0])
  if (arrayPart) {
    arrayIndex = parseInt(arrayPart.slice(1, -1), 10);
  }
  
  switch (rootName) {
    case 'prev':
      type = 'prev';
      break;
    case 'chain':
      type = 'chain';
      break;
    case 'inputs':
      type = 'inputs';
      break;
    case 'parallel':
      type = 'parallel';
      break;
    case 'forEach':
      type = 'forEach';
      break;
    case 'item':
      type = 'item';
      break;
    case 'index':
      type = 'index';
      break;
    case 'env':
      type = 'env';
      break;
    default:
      // It's a step ID reference
      type = 'step';
      stepId = rootName;
  }
  
  // Parse the property path
  const path = parsePath(pathPart || '');
  
  return { raw, type, stepId, path, arrayIndex };
}

/**
 * Parse a property path like ".output.images[0].url" into ["output", "images", 0, "url"]
 */
function parsePath(pathStr: string): string[] {
  if (!pathStr) return [];
  
  const parts: string[] = [];
  // Remove leading dot
  const cleaned = pathStr.startsWith('.') ? pathStr.slice(1) : pathStr;
  
  // Split by dots and brackets
  const segments = cleaned.split(/\.|\[|\]/g).filter(Boolean);
  
  for (const segment of segments) {
    // Check if it's a numeric index
    if (/^\d+$/.test(segment)) {
      parts.push(segment); // Keep as string, will convert during resolution
    } else {
      parts.push(segment);
    }
  }
  
  return parts;
}

// ============================================================================
// REFERENCE RESOLUTION
// ============================================================================

/**
 * Resolve a reference to its actual value from context
 */
export function resolveReference(ref: Reference, context: ChainContext): any {
  let value: any;
  
  switch (ref.type) {
    case 'prev':
      // Get the previous step's result
      if (!context.prevStepId) {
        throw new ReferenceError(`$prev used but no previous step exists`);
      }
      value = context.results[context.prevStepId];
      break;
      
    case 'step':
      // Get a specific step's result
      if (!ref.stepId || !(ref.stepId in context.results)) {
        throw new ReferenceError(`Step '${ref.stepId}' not found in results`);
      }
      value = context.results[ref.stepId];
      break;
      
    case 'parallel':
      // Get parallel execution results
      if (!context.parallelResults) {
        throw new ReferenceError(`$parallel used but not in parallel context`);
      }
      if (ref.arrayIndex !== undefined) {
        value = context.parallelResults[ref.arrayIndex];
      } else {
        value = context.parallelResults;
      }
      break;
      
    case 'chain':
      // Built-in chain variables
      value = {
        startedAt: context.startedAt,
        index: context.currentIndex,
      };
      break;
      
    case 'inputs':
      // Template inputs
      if (!context.inputs) {
        throw new ReferenceError(`$inputs used but no inputs provided`);
      }
      value = context.inputs;
      break;
      
    case 'forEach':
      // forEach accumulated results
      value = {
        results: context.forEachResults || [],
        index: context.forEachIndex,
      };
      break;
      
    case 'item':
      // Current forEach item
      if (context.forEachItem === undefined) {
        throw new ReferenceError(`$item used but not in forEach loop`);
      }
      value = context.forEachItem;
      break;
      
    case 'index':
      // Current forEach index
      if (context.forEachIndex === undefined) {
        throw new ReferenceError(`$index used but not in forEach loop`);
      }
      value = context.forEachIndex;
      break;
      
    case 'env':
      // Environment variables
      value = context.env || process.env;
      break;
      
    default:
      throw new ReferenceError(`Unknown reference type: ${ref.type}`);
  }
  
  // Traverse the path
  return traversePath(value, ref.path, ref.raw);
}

/**
 * Traverse a path through an object/array
 */
function traversePath(obj: any, path: string[], originalRef: string): any {
  let current = obj;
  
  for (let i = 0; i < path.length; i++) {
    if (current === null || current === undefined) {
      const traversed = path.slice(0, i).join('.');
      throw new ReferenceError(
        `Cannot read '${path[i]}' of ${current} at ${originalRef} (traversed: ${traversed})`
      );
    }
    
    const key = path[i];
    
    // Handle array index (stored as string)
    if (/^\d+$/.test(key)) {
      current = current[parseInt(key, 10)];
    } else {
      current = current[key];
    }
  }
  
  return current;
}

// ============================================================================
// RESOLVE ALL REFERENCES IN PARAMS
// ============================================================================

/**
 * Resolve all $references in a params object
 * Recursively processes strings, arrays, and nested objects
 */
export function resolveReferences(params: Record<string, any>, context: ChainContext): Record<string, any> {
  return resolveValue(params, context) as Record<string, any>;
}

/**
 * Resolve references in any value type
 */
function resolveValue(value: any, context: ChainContext): any {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (typeof value === 'string') {
    return resolveStringValue(value, context);
  }
  
  if (Array.isArray(value)) {
    return value.map(item => resolveValue(item, context));
  }
  
  if (typeof value === 'object') {
    const resolved: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveValue(val, context);
    }
    return resolved;
  }
  
  // Primitives (number, boolean) pass through
  return value;
}

/**
 * Resolve references in a string value
 * Handles both full replacement and interpolation
 */
function resolveStringValue(str: string, context: ChainContext): any {
  const refs = extractReferences(str);
  
  if (refs.length === 0) {
    return str;
  }
  
  // If the entire string is a single reference, return the resolved value directly
  // This preserves types (objects, arrays, numbers)
  if (refs.length === 1 && refs[0].raw === str) {
    return resolveReference(refs[0], context);
  }
  
  // Multiple references or mixed content: interpolate into string
  let result = str;
  for (const ref of refs) {
    const resolved = resolveReference(ref, context);
    const stringValue = typeof resolved === 'object' ? JSON.stringify(resolved) : String(resolved);
    result = result.replace(ref.raw, stringValue);
  }
  
  return result;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate all references in a chain before execution
 * Checks that referenced steps exist and come before the referencing step
 */
export function validateReferences(steps: ChainStepUnion[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Build set of step IDs that will exist
  const definedSteps = new Set<string>();
  const stepOrder: string[] = [];
  
  // First pass: collect all step IDs
  for (const step of steps) {
    if ('parallel' in step) {
      for (const ps of step.parallel) {
        definedSteps.add(ps.id);
        stepOrder.push(ps.id);
      }
    } else if ('forEach' in step) {
      // forEach generates dynamic IDs
      definedSteps.add(step.do.id.replace(/\$index/g, '*'));
    } else if ('if' in step) {
      const collectConditional = (s: ChainStep | ChainStep[]) => {
        const arr = Array.isArray(s) ? s : [s];
        for (const cs of arr) {
          definedSteps.add(cs.id);
          stepOrder.push(cs.id);
        }
      };
      collectConditional(step.then);
      if (step.else) collectConditional(step.else);
    } else {
      definedSteps.add(step.id);
      stepOrder.push(step.id);
    }
  }
  
  // Second pass: validate references
  let currentIndex = 0;
  
  const validateStep = (step: ChainStep, availableSteps: Set<string>, stepIdx: number) => {
    if (!step.params) return;
    
    const paramStr = JSON.stringify(step.params);
    const refs = extractReferences(paramStr);
    
    for (const ref of refs) {
      // Validate step references
      if (ref.type === 'step' && ref.stepId) {
        if (!definedSteps.has(ref.stepId)) {
          errors.push({
            stepId: step.id,
            reference: ref.raw,
            message: `References undefined step '${ref.stepId}'`,
          });
        } else if (!availableSteps.has(ref.stepId)) {
          errors.push({
            stepId: step.id,
            reference: ref.raw,
            message: `References step '${ref.stepId}' which hasn't executed yet`,
          });
        }
      }
      
      // Validate $prev usage
      if (ref.type === 'prev' && stepIdx === 0) {
        errors.push({
          stepId: step.id,
          reference: ref.raw,
          message: `$prev used in first step (no previous step exists)`,
        });
      }
      
      // Warn about $parallel outside parallel context
      if (ref.type === 'parallel') {
        warnings.push({
          stepId: step.id,
          reference: ref.raw,
          message: `$parallel used - ensure this follows a parallel block`,
        });
      }
      
      // Warn about $item/$index outside forEach
      if (ref.type === 'item' || ref.type === 'index') {
        warnings.push({
          stepId: step.id,
          reference: ref.raw,
          message: `${ref.raw} used - ensure this is inside a forEach block`,
        });
      }
    }
  };
  
  const availableSteps = new Set<string>();
  
  for (const step of steps) {
    if ('parallel' in step) {
      // Parallel steps can't reference each other
      for (const ps of step.parallel) {
        validateStep(ps, availableSteps, currentIndex);
      }
      // After parallel, all are available
      for (const ps of step.parallel) {
        availableSteps.add(ps.id);
      }
    } else if ('forEach' in step) {
      validateStep(step.do, availableSteps, currentIndex);
    } else if ('if' in step) {
      const validateBranch = (s: ChainStep | ChainStep[]) => {
        const arr = Array.isArray(s) ? s : [s];
        for (const cs of arr) {
          validateStep(cs, availableSteps, currentIndex);
          availableSteps.add(cs.id);
        }
      };
      validateBranch(step.then);
      if (step.else) validateBranch(step.else);
    } else {
      validateStep(step, availableSteps, currentIndex);
      availableSteps.add(step.id);
    }
    
    currentIndex++;
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// CONDITIONAL EVALUATION
// ============================================================================

/**
 * Evaluate a conditional expression string
 * Supports: ===, !==, >, <, >=, <=, &&, ||, !
 */
export function evaluateCondition(condition: string, context: ChainContext): boolean {
  // First resolve any references in the condition
  const resolvedCondition = resolveStringValue(condition, context);
  
  // Simple expression evaluation
  // For security, we use a restricted evaluator instead of eval()
  try {
    return safeEvaluate(resolvedCondition, context);
  } catch (e) {
    throw new Error(`Failed to evaluate condition '${condition}': ${e}`);
  }
}

/**
 * Safe expression evaluator for conditions
 * Only allows comparison and logical operators
 */
function safeEvaluate(expr: string, context: ChainContext): boolean {
  // Trim whitespace
  expr = expr.trim();
  
  // Handle logical operators (lowest precedence)
  // Split on || first (lowest precedence)
  if (expr.includes('||')) {
    const parts = splitOnOperator(expr, '||');
    if (parts.length > 1) {
      return parts.some(part => safeEvaluate(part, context));
    }
  }
  
  // Then && (higher precedence than ||)
  if (expr.includes('&&')) {
    const parts = splitOnOperator(expr, '&&');
    if (parts.length > 1) {
      return parts.every(part => safeEvaluate(part, context));
    }
  }
  
  // Handle negation
  if (expr.startsWith('!')) {
    return !safeEvaluate(expr.slice(1), context);
  }
  
  // Handle parentheses
  if (expr.startsWith('(') && expr.endsWith(')')) {
    return safeEvaluate(expr.slice(1, -1), context);
  }
  
  // Handle comparison operators
  const comparisons = ['===', '!==', '>=', '<=', '>', '<', '==', '!='];
  for (const op of comparisons) {
    const idx = expr.indexOf(op);
    if (idx !== -1) {
      const left = parseValue(expr.slice(0, idx).trim());
      const right = parseValue(expr.slice(idx + op.length).trim());
      
      switch (op) {
        case '===': return left === right;
        case '!==': return left !== right;
        case '==': return left == right;
        case '!=': return left != right;
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
      }
    }
  }
  
  // If no operators, evaluate as truthy/falsy
  return !!parseValue(expr);
}

/**
 * Split expression on operator, respecting parentheses
 */
function splitOnOperator(expr: string, op: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    
    if (char === '(') depth++;
    else if (char === ')') depth--;
    
    if (depth === 0 && expr.slice(i, i + op.length) === op) {
      parts.push(current);
      current = '';
      i += op.length - 1;
    } else {
      current += char;
    }
  }
  
  if (current) parts.push(current);
  return parts;
}

/**
 * Parse a value string into its actual type
 */
function parseValue(str: string): any {
  str = str.trim();
  
  // String literals
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  
  // Numbers
  if (/^-?\d+\.?\d*$/.test(str)) {
    return parseFloat(str);
  }
  
  // Booleans
  if (str === 'true') return true;
  if (str === 'false') return false;
  
  // Null/undefined
  if (str === 'null') return null;
  if (str === 'undefined') return undefined;
  
  // Already resolved value (from reference resolution)
  return str;
}

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class ReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferenceError';
  }
}
