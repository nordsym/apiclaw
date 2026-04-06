/**
 * Doctor Command
 * Health check for APIClaw installation and MCP client configurations
 */

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { getAllClients, getClientConfig, MCPClient } from '../../utils/paths.js';
import { readConfig, hasApiclawConfig } from '../../utils/config.js';
import { detectOS, getOSDisplayName } from '../../utils/os.js';
import { getApiUrl, readEnvConfig, ENV_VARS } from '../../enterprise/env.js';

export interface DoctorResult {
  healthy: boolean;
  checks: CheckResult[];
  summary: string;
}

export interface CheckResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  details?: string;
}

/**
 * Check Node.js availability and version
 */
function checkNode(): CheckResult {
  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0], 10);
    
    if (major < 18) {
      return {
        category: 'System',
        name: 'Node.js',
        status: 'warn',
        message: `${version} (recommend v18+)`,
      };
    }
    
    return {
      category: 'System',
      name: 'Node.js',
      status: 'pass',
      message: version,
    };
  } catch {
    return {
      category: 'System',
      name: 'Node.js',
      status: 'fail',
      message: 'Not found',
      details: 'Node.js is required. Install from https://nodejs.org',
    };
  }
}

/**
 * Check npm availability
 */
function checkNpm(): CheckResult {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    return {
      category: 'System',
      name: 'npm',
      status: 'pass',
      message: `v${version}`,
    };
  } catch {
    return {
      category: 'System',
      name: 'npm',
      status: 'fail',
      message: 'Not found',
      details: 'npm is required for npx to work',
    };
  }
}

/**
 * Check npx availability
 */
function checkNpx(): CheckResult {
  try {
    execSync('npx --version', { encoding: 'utf-8', stdio: 'pipe' });
    return {
      category: 'System',
      name: 'npx',
      status: 'pass',
      message: 'Available',
    };
  } catch {
    return {
      category: 'System',
      name: 'npx',
      status: 'fail',
      message: 'Not found',
      details: 'npx is required for MCP server execution',
    };
  }
}

/**
 * Check MCP client configuration
 */
function checkClient(client: MCPClient, serverName = 'apiclaw'): CheckResult {
  const config = getClientConfig(client);
  const configPath = config.configPath;
  
  // Check if config file exists
  if (!existsSync(configPath)) {
    // Check if config directory exists (client might be installed but not configured)
    const dirExists = existsSync(config.configDir);
    
    if (dirExists) {
      return {
        category: 'MCP Clients',
        name: config.displayName,
        status: 'warn',
        message: 'Installed but not configured',
        details: `Config file: ${configPath}`,
      };
    }
    
    return {
      category: 'MCP Clients',
      name: config.displayName,
      status: 'skip',
      message: 'Not installed',
    };
  }
  
  // Read and check config
  const readResult = readConfig(configPath);
  
  if (!readResult.success) {
    return {
      category: 'MCP Clients',
      name: config.displayName,
      status: 'fail',
      message: 'Invalid config',
      details: readResult.error,
    };
  }
  
  // Check if APIClaw is configured
  if (readResult.config && hasApiclawConfig(readResult.config, serverName)) {
    return {
      category: 'MCP Clients',
      name: config.displayName,
      status: 'pass',
      message: 'Configured',
    };
  }
  
  return {
    category: 'MCP Clients',
    name: config.displayName,
    status: 'warn',
    message: 'APIClaw not configured',
    details: `Run: npx @nordsym/apiclaw setup --client ${client}`,
  };
}

/**
 * Check API connectivity
 */
async function checkConnectivity(): Promise<CheckResult> {
  const apiUrl = getApiUrl();
  const convexUrl = process.env.CONVEX_URL || 'https://brilliant-puffin-712.eu-west-1.convex.cloud';
  const candidates = [
    `${apiUrl}/health`,
    'https://apiclaw.cloud',
    `${convexUrl.replace('.cloud', '.site')}/workspace/poll`,
  ];
  const failures: string[] = [];

  for (const testUrl of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Any HTTP response proves network + host reachability.
      if (response.ok) {
        return {
          category: 'Connectivity',
          name: 'API Server',
          status: 'pass',
          message: `${testUrl} reachable`,
        };
      }

      if (testUrl.includes('/workspace/poll') && response.status === 400) {
        return {
          category: 'Connectivity',
          name: 'API Server',
          status: 'pass',
          message: `${testUrl} reachable (auth endpoint responding)`,
        };
      }

      failures.push(`${testUrl} -> HTTP ${response.status}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      failures.push(`${testUrl} -> ${reason}`);
    }
  }

  return {
    category: 'Connectivity',
    name: 'API Server',
    status: 'skip',
    message: 'Could not reach API (offline or DNS/TLS issue?)',
    details: failures.join(' | '),
  };
}

/**
 * Check environment variables
 */
function checkEnvVars(): CheckResult[] {
  const envConfig = readEnvConfig();
  const results: CheckResult[] = [];
  
  if (envConfig.workspace) {
    results.push({
      category: 'Environment',
      name: ENV_VARS.WORKSPACE,
      status: 'pass',
      message: envConfig.workspace,
    });
  }
  
  if (envConfig.apiUrl) {
    results.push({
      category: 'Environment',
      name: ENV_VARS.API_URL,
      status: 'pass',
      message: envConfig.apiUrl,
    });
  }
  
  if (envConfig.disableTelemetry) {
    results.push({
      category: 'Environment',
      name: ENV_VARS.DISABLE_TELEMETRY,
      status: 'pass',
      message: 'true',
    });
  }
  
  return results;
}

/**
 * Run all health checks
 */
export async function runDoctor(options: { serverName?: string } = {}): Promise<DoctorResult> {
  const checks: CheckResult[] = [];
  const serverName = options.serverName || 'apiclaw';
  
  // System checks
  checks.push(checkNode());
  checks.push(checkNpm());
  checks.push(checkNpx());
  
  // Client checks
  for (const client of getAllClients()) {
    checks.push(checkClient(client, serverName));
  }
  
  // Connectivity check
  checks.push(await checkConnectivity());
  
  // Environment checks
  checks.push(...checkEnvVars());
  
  // Calculate health status
  const failures = checks.filter(c => c.status === 'fail');
  const warnings = checks.filter(c => c.status === 'warn');
  const passes = checks.filter(c => c.status === 'pass');
  
  let healthy = failures.length === 0;
  let summary: string;
  
  if (failures.length > 0) {
    summary = `${failures.length} issue(s) found`;
  } else if (warnings.length > 0) {
    summary = `All systems operational (${warnings.length} warning(s))`;
  } else {
    summary = 'All systems operational ✓';
  }
  
  return { healthy, checks, summary };
}

/**
 * Format doctor results for display
 */
export function formatDoctorOutput(result: DoctorResult): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('🔍 APIClaw Health Check');
  lines.push('========================');
  lines.push('');
  
  // Group checks by category
  const categories = new Map<string, CheckResult[]>();
  
  for (const check of result.checks) {
    const existing = categories.get(check.category) || [];
    existing.push(check);
    categories.set(check.category, existing);
  }
  
  // Format each category
  for (const [category, checks] of categories) {
    // Skip empty categories
    if (checks.length === 0) continue;
    
    lines.push(`${category}:`);
    
    for (const check of checks) {
      const icon = getStatusIcon(check.status);
      lines.push(`  ${icon} ${check.name} - ${check.message}`);
      
      if (check.details && (check.status === 'fail' || check.status === 'warn')) {
        lines.push(`      ${check.details}`);
      }
    }
    
    lines.push('');
  }
  
  // Summary
  lines.push(`Status: ${result.summary}`);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Get icon for status
 */
function getStatusIcon(status: CheckResult['status']): string {
  switch (status) {
    case 'pass': return '✓';
    case 'fail': return '✗';
    case 'warn': return '⚠';
    case 'skip': return '○';
  }
}

/**
 * Doctor command handler
 */
export async function doctorCommand(options: { serverName?: string; json?: boolean } = {}): Promise<void> {
  const result = await runDoctor(options);
  
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatDoctorOutput(result));
  }
  
  // Exit with error code if unhealthy
  if (!result.healthy) {
    process.exit(1);
  }
}
