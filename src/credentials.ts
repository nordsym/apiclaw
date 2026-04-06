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

  // Real credential providers
  resend: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('resend.env');
      const key = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  brave_search: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('brave.env');
      const key = env.BRAVE_API_KEY || process.env.BRAVE_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  openrouter: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('openrouter.env');
      const key = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
    },
  },

  elevenlabs: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('elevenlabs.env');
      const key = env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  replicate: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('replicate.env');
      const key = env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
    },
  },

  firecrawl: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('firecrawl.env');
      const key = env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
    },
  },

  github: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('github.env');
      const key = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
      if (key) {
        return { type: 'bearer', token: key };
      }
      return null;
    },
  },

  e2b: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('e2b.env');
      const key = env.E2B_API_KEY || process.env.E2B_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  apilayer: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('apilayer.env');
      const legacy = loadEnvFile('apilayer-legacy.env');
      
      // Merge unified + legacy keys
      const keys: Record<string, string> = {};
      
      // Unified APILayer keys (APILAYER_*)
      for (const [k, v] of Object.entries(env)) {
        if (k.startsWith('APILAYER_') && v) {
          keys[k] = v;
        }
      }
      
      // Legacy keys (separate API domains)
      for (const [k, v] of Object.entries(legacy)) {
        if (v && k.endsWith('_API_KEY')) {
          keys[k] = v;
        }
      }
      
      if (Object.keys(keys).length === 0) return null;
      return { type: 'api_key', api_key: keys.APILAYER_EXCHANGERATE_KEY || '', ...keys } as any;
    },
  },

  groq: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('groq.env');
      const key = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
    },
  },

  deepgram: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('deepgram.env');
      const key = env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
    },
  },

  mistral: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('mistral.env');
      const key = env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  cohere: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('cohere.env');
      const key = env.COHERE_API_KEY || process.env.COHERE_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  serper: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('serpapi.env');
      const key = env.SERPAPI_API_KEY || process.env.SERPER_API_KEY || process.env.SERPAPI_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  stability: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('stability.env');
      const key = env.STABILITY_API_KEY || process.env.STABILITY_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  together: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('together.env');
      const key = env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
    },
  },

  assemblyai: {
    type: 'api_key',
    get(): APICredentials | null {
      const env = loadEnvFile('assemblyai.env');
      const key = env.ASSEMBLYAI_API_KEY || process.env.ASSEMBLYAI_API_KEY;
      if (key) {
        return { type: 'api_key', api_key: key };
      }
      return null;
    },
  },

  voyage: {
    type: 'bearer',
    get(): APICredentials | null {
      const env = loadEnvFile('voyage.env');
      const key = env.VOYAGE_API_KEY || process.env.VOYAGE_API_KEY;
      if (key) {
        return { type: 'bearer', api_key: key };
      }
      return null;
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
  if (providerId === 'resend') {
    const env = loadEnvFile('resend.env');
    return !!(env.RESEND_API_KEY || process.env.RESEND_API_KEY);
  }
  if (providerId === 'brave_search') {
    const env = loadEnvFile('brave.env');
    return !!(env.BRAVE_API_KEY || process.env.BRAVE_API_KEY);
  }
  if (providerId === 'openrouter') {
    const env = loadEnvFile('openrouter.env');
    return !!(env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY);
  }
  if (providerId === 'elevenlabs') {
    const env = loadEnvFile('elevenlabs.env');
    return !!(env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY);
  }
  if (providerId === 'replicate') {
    const env = loadEnvFile('replicate.env');
    return !!(env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN);
  }
  if (providerId === 'e2b') {
    const env = loadEnvFile('e2b.env');
    return !!(env.E2B_API_KEY || process.env.E2B_API_KEY);
  }
  if (providerId === 'firecrawl') {
    const env = loadEnvFile('firecrawl.env');
    return !!(env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY);
  }
  if (providerId === 'github') {
    const env = loadEnvFile('github.env');
    return !!(env.GITHUB_TOKEN || process.env.GITHUB_TOKEN);
  }
  if (providerId === 'apilayer') {
    const env = loadEnvFile('apilayer.env');
    const legacy = loadEnvFile('apilayer-legacy.env');
    return !!(
      env.APILAYER_EXCHANGERATE_KEY || 
      process.env.APILAYER_EXCHANGERATE_KEY ||
      Object.keys(legacy).length > 0
    );
  }
  if (providerId === 'groq') {
    const env = loadEnvFile('groq.env');
    return !!(env.GROQ_API_KEY || process.env.GROQ_API_KEY);
  }
  if (providerId === 'mistral') {
    const env = loadEnvFile('mistral.env');
    return !!(env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY);
  }
  if (providerId === 'cohere') {
    const env = loadEnvFile('cohere.env');
    return !!(env.COHERE_API_KEY || process.env.COHERE_API_KEY);
  }
  if (providerId === 'together') {
    const env = loadEnvFile('together.env');
    return !!(env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY);
  }
  if (providerId === 'stability') {
    const env = loadEnvFile('stability.env');
    return !!(env.STABILITY_API_KEY || process.env.STABILITY_API_KEY);
  }
  if (providerId === 'deepgram') {
    const env = loadEnvFile('deepgram.env');
    return !!(env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY);
  }
  if (providerId === 'assemblyai') {
    const env = loadEnvFile('assemblyai.env');
    return !!(env.ASSEMBLYAI_API_KEY || process.env.ASSEMBLYAI_API_KEY);
  }
  if (providerId === 'voyage') {
    const env = loadEnvFile('voyage.env');
    return !!(env.VOYAGE_API_KEY || process.env.VOYAGE_API_KEY);
  }
  if (providerId === 'serper') {
    const env = loadEnvFile('serper.env');
    const envAlt = loadEnvFile('serpapi.env');
    return !!(env.SERPER_API_KEY || envAlt.SERPAPI_API_KEY || envAlt.SERPER_API_KEY || process.env.SERPER_API_KEY);
  }
  if (providerId === 'groq') {
    const env = loadEnvFile('groq.env');
    return !!(env.GROQ_API_KEY || process.env.GROQ_API_KEY);
  }
  if (providerId === 'deepgram') {
    const env = loadEnvFile('deepgram.env');
    return !!(env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY);
  }
  if (providerId === 'mistral') {
    const env = loadEnvFile('mistral.env');
    return !!(env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY);
  }
  if (providerId === 'cohere') {
    const env = loadEnvFile('cohere.env');
    return !!(env.COHERE_API_KEY || process.env.COHERE_API_KEY);
  }
  if (providerId === 'serper') {
    const env = loadEnvFile('serpapi.env');
    return !!(env.SERPAPI_API_KEY || process.env.SERPER_API_KEY || process.env.SERPAPI_API_KEY);
  }
  if (providerId === 'stability') {
    const env = loadEnvFile('stability.env');
    return !!(env.STABILITY_API_KEY || process.env.STABILITY_API_KEY);
  }
  if (providerId === 'together') {
    const env = loadEnvFile('together.env');
    return !!(env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY);
  }
  if (providerId === 'assemblyai') {
    const env = loadEnvFile('assemblyai.env');
    return !!(env.ASSEMBLYAI_API_KEY || process.env.ASSEMBLYAI_API_KEY);
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
