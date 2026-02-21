/**
 * APIClaw Instant Connect - Execute API calls through connected providers
 */

import { getCredentials } from './credentials.js';
import { callProxy, PROXY_PROVIDERS } from './proxy.js';

interface ExecuteResult {
  success: boolean;
  provider: string;
  action: string;
  data?: unknown;
  error?: string;
  cost?: number;
}

// Helper to safely access properties
function safeGet(obj: unknown, ...keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

// Provider action handlers
const handlers: Record<string, Record<string, (params: any, creds: any) => Promise<ExecuteResult>>> = {
  
  // 46elks - Swedish SMS/Voice
  '46elks': {
    send_sms: async (params, creds) => {
      const { to, message, from = 'APIClaw' } = params;
      
      if (!to || !message) {
        return { success: false, provider: '46elks', action: 'send_sms', error: 'Missing required params: to, message' };
      }

      const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
      
      const response = await fetch('https://api.46elks.com/a1/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ from, to, message }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: '46elks', action: 'send_sms', error: (data.message as string) || 'SMS failed' };
      }

      return { 
        success: true, 
        provider: '46elks', 
        action: 'send_sms',
        data: { id: data.id, to: data.to, cost: data.cost },
        cost: parseInt(String(data.cost)) / 10000000 // Convert microöre to SEK
      };
    },
  },

  // Twilio - Global SMS/Voice
  twilio: {
    send_sms: async (params, creds) => {
      const { to, message, from } = params;
      
      if (!to || !message) {
        return { success: false, provider: 'twilio', action: 'send_sms', error: 'Missing required params: to, message' };
      }

      const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
      const fromNumber = from || creds.from_number || '+15017122661';
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${creds.username}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: fromNumber, To: to, Body: message }),
        }
      );

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'twilio', action: 'send_sms', error: (data.message as string) || 'SMS failed' };
      }

      return { 
        success: true, 
        provider: 'twilio', 
        action: 'send_sms',
        data: { sid: data.sid, to: data.to, status: data.status }
      };
    },
  },

  // Brave Search
  brave_search: {
    search: async (params, creds) => {
      const { query, count = 5 } = params;
      
      if (!query) {
        return { success: false, provider: 'brave_search', action: 'search', error: 'Missing required param: query' };
      }

      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', count.toString());

      const response = await fetch(url.toString(), {
        headers: { 'X-Subscription-Token': creds.api_key },
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'brave_search', action: 'search', error: (data.message as string) || 'Search failed' };
      }

      const webData = data.web as Record<string, unknown> | undefined;
      const rawResults = (webData?.results as Array<Record<string, unknown>>) || [];
      const results = rawResults.map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description,
      }));

      return { 
        success: true, 
        provider: 'brave_search', 
        action: 'search',
        data: { query, results, total: results.length }
      };
    },
  },

  // Resend - Email
  resend: {
    send_email: async (params, creds) => {
      const { to, subject, html, text, from = 'APIClaw <noreply@apiclaw.com>' } = params;
      
      if (!to || !subject || (!html && !text)) {
        return { success: false, provider: 'resend', action: 'send_email', error: 'Missing required params: to, subject, html or text' };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'resend', action: 'send_email', error: (data.message as string) || 'Email failed' };
      }

      return { 
        success: true, 
        provider: 'resend', 
        action: 'send_email',
        data: { id: data.id }
      };
    },
  },

  // OpenRouter - AI Models
  openrouter: {
    chat: async (params, creds) => {
      const { messages, model = 'anthropic/claude-3-haiku', max_tokens = 1000 } = params;
      
      if (!messages || !Array.isArray(messages)) {
        return { success: false, provider: 'openrouter', action: 'chat', error: 'Missing required param: messages (array)' };
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://apiclaw.nordsym.com',
        },
        body: JSON.stringify({ model, messages, max_tokens }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        const errorData = data.error as Record<string, unknown> | undefined;
        return { success: false, provider: 'openrouter', action: 'chat', error: (errorData?.message as string) || 'Chat failed' };
      }

      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const firstChoice = choices?.[0];
      const message = firstChoice?.message as Record<string, unknown> | undefined;

      return { 
        success: true, 
        provider: 'openrouter', 
        action: 'chat',
        data: { 
          content: message?.content,
          model: data.model,
          usage: data.usage 
        }
      };
    },
  },

  // ElevenLabs - Text-to-Speech
  elevenlabs: {
    text_to_speech: async (params, creds) => {
      const { text, voice_id = '21m00Tcm4TlvDq8ikWAM', model_id = 'eleven_monolingual_v1' } = params;
      
      if (!text) {
        return { success: false, provider: 'elevenlabs', action: 'text_to_speech', error: 'Missing required param: text' };
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': creds.api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, model_id }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as Record<string, unknown>;
        return { success: false, provider: 'elevenlabs', action: 'text_to_speech', error: (error.detail as string) || 'TTS failed' };
      }

      // Return audio as base64
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      return { 
        success: true, 
        provider: 'elevenlabs', 
        action: 'text_to_speech',
        data: { 
          audio_base64: base64,
          format: 'mp3',
          text_length: text.length
        }
      };
    },
  },
};

// Get available actions for a provider
export function getProviderActions(providerId: string): string[] {
  return Object.keys(handlers[providerId] || {});
}

// Get all connected providers with their actions
export function getConnectedProviders(): { provider: string; actions: string[] }[] {
  return Object.entries(handlers).map(([provider, actions]) => ({
    provider,
    actions: Object.keys(actions),
  }));
}

// Execute an API call
export async function executeAPICall(
  providerId: string, 
  action: string, 
  params: Record<string, any>
): Promise<ExecuteResult> {
  // Check if provider exists
  const providerHandlers = handlers[providerId];
  if (!providerHandlers) {
    return {
      success: false,
      provider: providerId,
      action,
      error: `Provider '${providerId}' not connected. Available: ${Object.keys(handlers).join(', ')}`,
    };
  }

  // Check if action exists
  const handler = providerHandlers[action];
  if (!handler) {
    return {
      success: false,
      provider: providerId,
      action,
      error: `Action '${action}' not available for ${providerId}. Available: ${Object.keys(providerHandlers).join(', ')}`,
    };
  }

  // Get credentials - fallback to proxy if not available locally
  const creds = getCredentials(providerId);
  if (!creds) {
    // Try proxy for supported providers
    if (PROXY_PROVIDERS.includes(providerId)) {
      try {
        const proxyResult = await callProxy(providerId, { action, ...params });
        return {
          success: true,
          provider: providerId,
          action,
          data: proxyResult,
        };
      } catch (e: any) {
        return {
          success: false,
          provider: providerId,
          action,
          error: e.message || 'Proxy call failed',
        };
      }
    }
    return {
      success: false,
      provider: providerId,
      action,
      error: `No credentials configured for ${providerId}. Set up ~/.secrets/${providerId}.env`,
    };
  }

  // Execute
  try {
    return await handler(params, creds);
  } catch (error: any) {
    return {
      success: false,
      provider: providerId,
      action,
      error: error.message || 'Unknown error',
    };
  }
}
