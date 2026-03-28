/**
 * Access Control System
 * Controls which products/agents can access which providers
 * 
 * Rules format:
 * - Wildcard: "hivr:*" = all Hivr agents
 * - Specific: "hivr:bytebee" = only ByteBee
 * - Product-level: "nordsym:*" = all NordSym agents
 * 
 * Provider wildcards:
 * - "*" = all providers
 * - "brave_*" = all Brave providers
 * - Specific: ["brave_search", "groq"]
 */

interface AccessRule {
  agentPattern: string;
  allowedProviders: string[];
  description?: string;
}

// Default access rules
// These can be moved to Convex table for dynamic updates
const DEFAULT_RULES: AccessRule[] = [
  {
    agentPattern: 'hivr:*',
    allowedProviders: ['*'], // Hivr gets everything
    description: 'All Hivr bees get full access',
  },
  {
    agentPattern: 'nordsym:*',
    allowedProviders: ['brave_search', 'groq', 'replicate'],
    description: 'NordSym team gets selected providers',
  },
  // Add more rules as needed
];

// Cache for compiled rules
let compiledRules: {
  pattern: RegExp;
  providers: string[];
}[] | null = null;

/**
 * Compile agentPattern to RegExp
 */
function compilePattern(pattern: string): RegExp {
  // Convert wildcard pattern to regex
  // "hivr:*" → /^hivr:.+$/
  // "hivr:byte*" → /^hivr:byte.+$/
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex chars
    .replace(/\*/g, '.+'); // Replace * with .+
  
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Compile all rules (cache for performance)
 */
function compileRules(): void {
  compiledRules = DEFAULT_RULES.map(rule => ({
    pattern: compilePattern(rule.agentPattern),
    providers: rule.allowedProviders,
  }));
}

/**
 * Check if provider matches pattern
 */
function matchesProvider(provider: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return provider.startsWith(prefix);
  }
  return provider === pattern;
}

/**
 * Check if agentId is allowed to access provider
 */
export function canAccessProvider(agentId: string, provider: string): boolean {
  if (!compiledRules) {
    compileRules();
  }
  
  const normalized = agentId.toLowerCase().trim();
  const normalizedProvider = provider.toLowerCase().trim();
  
  // Find matching rule
  for (const rule of compiledRules!) {
    if (rule.pattern.test(normalized)) {
      // Check if provider is allowed
      for (const providerPattern of rule.providers) {
        if (matchesProvider(normalizedProvider, providerPattern)) {
          return true;
        }
      }
      // Rule matched but provider not in allowlist
      return false;
    }
  }
  
  // No rule matched = deny by default
  console.warn(`[Access Control] No rule for ${normalized}`);
  return false;
}

/**
 * Get allowed providers for agentId
 */
export function getAllowedProviders(agentId: string): string[] {
  if (!compiledRules) {
    compileRules();
  }
  
  const normalized = agentId.toLowerCase().trim();
  
  // Find matching rule
  for (const rule of compiledRules!) {
    if (rule.pattern.test(normalized)) {
      return rule.providers;
    }
  }
  
  return [];
}

/**
 * Add new access rule (runtime)
 */
export function addAccessRule(rule: AccessRule): void {
  DEFAULT_RULES.push(rule);
  compiledRules = null; // Force recompile
  console.log(`[Access Control] Added rule for ${rule.agentPattern}`);
}

/**
 * Get all access rules (for debugging/admin)
 */
export function getAccessRules(): AccessRule[] {
  return [...DEFAULT_RULES];
}

/**
 * Check if agentId + provider combination is allowed
 * Combines whitelist check + access control
 */
export async function isAllowed(
  agentId: string | undefined,
  provider: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!agentId) {
    return { allowed: false, reason: 'No agentId provided' };
  }
  
  // First check: Is agent whitelisted?
  const { isAuthorized } = await import('./product-whitelist.js');
  const whitelisted = await isAuthorized(agentId);
  
  if (!whitelisted) {
    return { allowed: false, reason: 'Agent not whitelisted' };
  }
  
  // Second check: Does agent have access to this provider?
  const hasAccess = canAccessProvider(agentId, provider);
  
  if (!hasAccess) {
    return { allowed: false, reason: 'Provider not in access list' };
  }
  
  return { allowed: true };
}
