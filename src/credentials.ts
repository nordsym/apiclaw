// Real credential providers for APIClaw Connected tier
// Reads from environment variables or ~/.secrets/

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { APICredentials } from './types.js';

interface ProviderCredential {
  type: 'basic' | 'api_key' | 'bearer';
  get(): APICredentials | null;
}

// Load env file helper
function loadEnvFile(filename: string): Record<string, string> {
  const paths = [
    join(homedir(), '.secrets', filename),
    join(process.cwd(), filename),
    join(process.cwd(), '.env.local'),
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      const vars: Record<string, string> = {};
      for (const line of content.split('\n')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
      return vars;
    }
  }
  return {};
}

// Provider credential getters
const providers: Record<string, ProviderCredential> = {
  '46elks': {
    type: 'basic',
    get(): APICredentials | null {
      const env = loadEnvFile('46elks.env');
      const user = env.ELKS_API_USER || process.env.ELKS_API_USER;
      const pass = env.ELKS_API_PASSWORD || process.env.ELKS_API_PASSWORD;
      
      if (!user || !pass) return null;
      
      return {
        type: 'basic',
        username: user,
        password: pass,
      };
    },
  },

  twilio: {
    type: 'basic',
    get(): APICredentials | null {
      const env = loadEnvFile('twilio.env');
      const sid = env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
      const token = env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
      
      if (!sid || !token) return null;
      
      return {
        type: 'basic',
        username: sid,
        password: token,
      };
    },
  },

  // Mock providers (for demo/testing)
  resend: {
    type: 'api_key',
    get(): APICredentials | null {
      const key = process.env.RESEND_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      // Return demo key structure
      return {
        type: 'api_key',
        api_key: `re_demo_${Date.now()}`,
      };
    },
  },

  brave_search: {
    type: 'api_key',
    get(): APICredentials | null {
      const key = process.env.BRAVE_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return {
        type: 'api_key',
        api_key: `BSA_demo_${Date.now()}`,
      };
    },
  },

  openrouter: {
    type: 'bearer',
    get(): APICredentials | null {
      const key = process.env.OPENROUTER_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return {
        type: 'bearer',
        api_key: `sk-or-demo-${Date.now()}`,
      };
    },
  },

  elevenlabs: {
    type: 'api_key',
    get(): APICredentials | null {
      const key = process.env.ELEVENLABS_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return {
        type: 'api_key',
        api_key: `el_demo_${Date.now()}`,
      };
    },
  },
};

/**
 * Get real credentials for a provider
 * Returns null if provider not supported
 */
export function getCredentials(providerId: string): APICredentials | null {
  const provider = providers[providerId];
  if (!provider) return null;
  return provider.get();
}

/**
 * Check if a provider has real (non-demo) credentials available
 */
export function hasRealCredentials(providerId: string): boolean {
  if (providerId === '46elks') {
    const env = loadEnvFile('46elks.env');
    return !!(env.ELKS_API_USER || process.env.ELKS_API_USER);
  }
  if (providerId === 'twilio') {
    const env = loadEnvFile('twilio.env');
    return !!(env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID);
  }
  return false;
}

/**
 * List all supported providers
 */
export function listProviders(): string[] {
  return Object.keys(providers);
}

/**
 * Get credential type for a provider
 */
export function getCredentialType(providerId: string): string | null {
  return providers[providerId]?.type || null;
}
