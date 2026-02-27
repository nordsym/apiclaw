/**
 * APIClaw Direct Call - Execute API calls through connected providers
 */

import { getCredentials } from './credentials.js';
import { callProxy, PROXY_PROVIDERS } from './proxy.js';
import { executeDynamicAction, hasDynamicConfig, listDynamicActions } from './execute-dynamic.js';

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
      const { to, subject, html, text, from = 'APIClaw <noreply@apiclaw.nordsym.com>' } = params;
      
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

  // Replicate - Run any AI model (images, audio, video, text)
  replicate: {
    run: async (params, creds) => {
      const { model, input } = params;
      
      if (!model) {
        return { success: false, provider: 'replicate', action: 'run', error: 'Missing required param: model (e.g., "stability-ai/sdxl:...")' };
      }
      if (!input) {
        return { success: false, provider: 'replicate', action: 'run', error: 'Missing required param: input (object with model inputs)' };
      }

      // Parse model into owner/name and version
      const [modelPath, version] = model.split(':');
      
      // Create prediction
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: version || undefined,
          model: version ? undefined : modelPath,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as Record<string, unknown>;
        return { success: false, provider: 'replicate', action: 'run', error: (error.detail as string) || 'Prediction failed' };
      }

      const prediction = await response.json() as Record<string, unknown>;
      
      // Poll for completion (max 60 seconds)
      let result = prediction;
      const startTime = Date.now();
      while (result.status === 'starting' || result.status === 'processing') {
        if (Date.now() - startTime > 60000) {
          return { 
            success: true, 
            provider: 'replicate', 
            action: 'run',
            data: { 
              status: 'pending',
              prediction_id: result.id,
              message: 'Prediction still running. Use prediction_id to check status.',
              urls: result.urls
            }
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch((result.urls as Record<string, string>)?.get || `https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { 'Authorization': `Bearer ${creds.api_key}` },
        });
        result = await pollResponse.json() as Record<string, unknown>;
      }

      if (result.status === 'failed') {
        return { success: false, provider: 'replicate', action: 'run', error: (result.error as string) || 'Prediction failed' };
      }

      return { 
        success: true, 
        provider: 'replicate', 
        action: 'run',
        data: { 
          status: result.status,
          output: result.output,
          model: modelPath,
          metrics: result.metrics
        }
      };
    },

    list_models: async (_params, creds) => {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: { 'Authorization': `Bearer ${creds.api_key}` },
      });

      if (!response.ok) {
        return { success: false, provider: 'replicate', action: 'list_models', error: 'Failed to list models' };
      }

      const data = await response.json() as Record<string, unknown>;
      
      return { 
        success: true, 
        provider: 'replicate', 
        action: 'list_models',
        data: { 
          models: data.results,
          message: 'Use model owner/name with run action. Popular: stability-ai/sdxl, meta/llama-2-70b-chat, openai/whisper'
        }
      };
    },
  },

  // Firecrawl - Web scraping and crawling
  firecrawl: {
    scrape: async (params, creds) => {
      const { url, formats = ['markdown'] } = params;
      
      if (!url) {
        return { success: false, provider: 'firecrawl', action: 'scrape', error: 'Missing required param: url' };
      }

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, formats }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok || !data.success) {
        return { success: false, provider: 'firecrawl', action: 'scrape', error: (data.error as string) || 'Scrape failed' };
      }

      return { 
        success: true, 
        provider: 'firecrawl', 
        action: 'scrape',
        data: data.data,
      };
    },

    crawl: async (params, creds) => {
      const { url, limit = 10 } = params;
      
      if (!url) {
        return { success: false, provider: 'firecrawl', action: 'crawl', error: 'Missing required param: url' };
      }

      const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, limit }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok || !data.success) {
        return { success: false, provider: 'firecrawl', action: 'crawl', error: (data.error as string) || 'Crawl failed' };
      }

      return { 
        success: true, 
        provider: 'firecrawl', 
        action: 'crawl',
        data: { id: data.id, status: 'started', message: 'Crawl job started. Poll status with crawl_status action.' },
      };
    },

    map: async (params, creds) => {
      const { url } = params;
      
      if (!url) {
        return { success: false, provider: 'firecrawl', action: 'map', error: 'Missing required param: url' };
      }

      const response = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok || !data.success) {
        return { success: false, provider: 'firecrawl', action: 'map', error: (data.error as string) || 'Map failed' };
      }

      return { 
        success: true, 
        provider: 'firecrawl', 
        action: 'map',
        data: { links: data.links },
      };
    },
  },

  // GitHub - Code & Repos
  github: {
    search_repos: async (params, creds) => {
      const { query, sort = 'stars', limit = 10 } = params;
      
      if (!query) {
        return { success: false, provider: 'github', action: 'search_repos', error: 'Missing required param: query' };
      }

      const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'github', action: 'search_repos', error: (data.message as string) || 'Search failed' };
      }

      const items = (data.items as any[]) || [];
      return { 
        success: true, 
        provider: 'github', 
        action: 'search_repos',
        data: { 
          total: data.total_count,
          repos: items.slice(0, limit).map(r => ({
            name: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            url: r.html_url,
            language: r.language,
          }))
        },
      };
    },

    get_repo: async (params, creds) => {
      const { owner, repo } = params;
      
      if (!owner || !repo) {
        return { success: false, provider: 'github', action: 'get_repo', error: 'Missing required params: owner, repo' };
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'github', action: 'get_repo', error: (data.message as string) || 'Get repo failed' };
      }

      return { 
        success: true, 
        provider: 'github', 
        action: 'get_repo',
        data: {
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          url: data.html_url,
          created: data.created_at,
          updated: data.updated_at,
        },
      };
    },

    list_issues: async (params, creds) => {
      const { owner, repo, state = 'open', limit = 10 } = params;
      
      if (!owner || !repo) {
        return { success: false, provider: 'github', action: 'list_issues', error: 'Missing required params: owner, repo' };
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${limit}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      });

      const data = await response.json() as unknown[];
      
      if (!response.ok) {
        return { success: false, provider: 'github', action: 'list_issues', error: 'List issues failed' };
      }

      return { 
        success: true, 
        provider: 'github', 
        action: 'list_issues',
        data: { 
          issues: (data as any[]).map(i => ({
            number: i.number,
            title: i.title,
            state: i.state,
            user: i.user?.login,
            url: i.html_url,
            created: i.created_at,
          }))
        },
      };
    },

    create_issue: async (params, creds) => {
      const { owner, repo, title, body = '' } = params;
      
      if (!owner || !repo || !title) {
        return { success: false, provider: 'github', action: 'create_issue', error: 'Missing required params: owner, repo, title' };
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'github', action: 'create_issue', error: (data.message as string) || 'Create issue failed' };
      }

      return { 
        success: true, 
        provider: 'github', 
        action: 'create_issue',
        data: { 
          number: data.number,
          url: data.html_url,
        },
      };
    },

    get_file: async (params, creds) => {
      const { owner, repo, path } = params;
      
      if (!owner || !repo || !path) {
        return { success: false, provider: 'github', action: 'get_file', error: 'Missing required params: owner, repo, path' };
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Authorization': `Bearer ${creds.token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'APIClaw',
        },
      });

      const data = await response.json() as Record<string, unknown>;
      
      if (!response.ok) {
        return { success: false, provider: 'github', action: 'get_file', error: (data.message as string) || 'Get file failed' };
      }

      // Decode base64 content
      const content = data.content ? Buffer.from(data.content as string, 'base64').toString('utf-8') : null;

      return { 
        success: true, 
        provider: 'github', 
        action: 'get_file',
        data: { 
          name: data.name,
          path: data.path,
          size: data.size,
          content,
        },
      };
    },
  },

  // E2B - Code Sandbox for AI Agents
  // Uses @e2b/code-interpreter SDK
  e2b: {
    run_code: async (params, creds) => {
      const { code, language = 'python' } = params;
      
      if (!code) {
        return { success: false, provider: 'e2b', action: 'run_code', error: 'Missing required param: code' };
      }

      try {
        // Dynamic import to avoid issues if SDK not installed
        const { Sandbox } = await import('@e2b/code-interpreter');
        
        // Set API key via env (SDK reads from E2B_API_KEY)
        process.env.E2B_API_KEY = creds.api_key;
        
        const sandbox = await Sandbox.create();
        
        try {
          const execution = await sandbox.runCode(code);
          
          return { 
            success: true, 
            provider: 'e2b', 
            action: 'run_code',
            data: { 
              text: execution.text,
              logs: execution.logs,
              results: execution.results,
            },
          };
        } finally {
          await sandbox.kill().catch(() => {});
        }
      } catch (error: any) {
        return { 
          success: false, 
          provider: 'e2b', 
          action: 'run_code', 
          error: error.message || 'Code execution failed' 
        };
      }
    },

    run_shell: async (params, creds) => {
      const { command } = params;
      
      if (!command) {
        return { success: false, provider: 'e2b', action: 'run_shell', error: 'Missing required param: command' };
      }

      try {
        const { Sandbox } = await import('@e2b/code-interpreter');
        
        process.env.E2B_API_KEY = creds.api_key;
        
        const sandbox = await Sandbox.create();
        
        try {
          const result = await sandbox.commands.run(command);
          
          return { 
            success: true, 
            provider: 'e2b', 
            action: 'run_shell',
            data: { 
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode,
            },
          };
        } finally {
          await sandbox.kill().catch(() => {});
        }
      } catch (error: any) {
        return { 
          success: false, 
          provider: 'e2b', 
          action: 'run_shell', 
          error: error.message || 'Shell execution failed' 
        };
      }
    },
  },

  // Frankfurter API - Free currency conversion (no API key needed!)
  // Source: European Central Bank rates
  exchangerate: {
    convert: async (params, _creds) => {
      const { from = 'SEK', to = 'USD', amount = 1 } = params;
      
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${from}&to=${to}&amount=${amount}`
      );
      const data = await response.json() as Record<string, unknown>;
      
      if (!data.rates) {
        return { success: false, provider: 'exchangerate', action: 'convert', error: 'Conversion failed' };
      }
      
      const rates = data.rates as Record<string, number>;
      const result = rates[to];
      
      return {
        success: true,
        provider: 'exchangerate',
        action: 'convert',
        data: {
          from,
          to,
          amount: data.amount,
          result,
          rate: result / (amount as number),
          date: data.date,
        },
      };
    },

    latest: async (params, _creds) => {
      const { base = 'SEK', symbols } = params;
      
      let url = `https://api.frankfurter.app/latest?from=${base}`;
      if (symbols) {
        url += `&to=${symbols}`;
      }
      
      const response = await fetch(url);
      const data = await response.json() as Record<string, unknown>;
      
      if (!data.rates) {
        return { success: false, provider: 'exchangerate', action: 'latest', error: 'Failed to fetch rates' };
      }
      
      return {
        success: true,
        provider: 'exchangerate',
        action: 'latest',
        data: {
          base: data.base,
          date: data.date,
          rates: data.rates,
        },
      };
    },

    historical: async (params, _creds) => {
      const { date, base = 'SEK', symbols } = params;
      
      if (!date) {
        return { success: false, provider: 'exchangerate', action: 'historical', error: 'Missing required param: date (YYYY-MM-DD)' };
      }
      
      let url = `https://api.frankfurter.app/${date}?from=${base}`;
      if (symbols) {
        url += `&to=${symbols}`;
      }
      
      const response = await fetch(url);
      const data = await response.json() as Record<string, unknown>;
      
      if (!data.rates) {
        return { success: false, provider: 'exchangerate', action: 'historical', error: 'Failed to fetch historical rates' };
      }
      
      return {
        success: true,
        provider: 'exchangerate',
        action: 'historical',
        data: {
          base: data.base,
          date: data.date,
          rates: data.rates,
        },
      };
    },

    currencies: async (_params, _creds) => {
      const response = await fetch('https://api.frankfurter.app/currencies');
      const data = await response.json() as Record<string, string>;
      
      return {
        success: true,
        provider: 'exchangerate',
        action: 'currencies',
        data: {
          currencies: data,
        },
      };
    },
  },
};

// Get available actions for a provider (static handlers only)
export function getProviderActions(providerId: string): string[] {
  return Object.keys(handlers[providerId] || {});
}

// Get available actions for a provider (includes dynamic providers)
export async function getProviderActionsAsync(providerId: string): Promise<string[]> {
  // First check static handlers
  const staticActions = Object.keys(handlers[providerId] || {});
  if (staticActions.length > 0) {
    return staticActions;
  }
  
  // Then check dynamic providers
  return listDynamicActions(providerId);
}

// Get all connected providers with their actions (static handlers only)
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
  params: Record<string, any>,
  userId?: string,
  customerKey?: string
): Promise<ExecuteResult> {
  // Check for dynamic (self-service) provider config first
  if (userId) {
    const isDynamic = await hasDynamicConfig(providerId);
    if (isDynamic) {
      return executeDynamicAction(providerId, action, params, userId, customerKey);
    }
  }
  
  // Fall back to hardcoded handlers
  // Check if provider exists
  const providerHandlers = handlers[providerId];
  if (!providerHandlers) {
    // Check if it might be a dynamic provider without userId
    const dynamicActions = await listDynamicActions(providerId);
    if (dynamicActions.length > 0) {
      return {
        success: false,
        provider: providerId,
        action,
        error: `Provider '${providerId}' requires userId for dynamic execution. Available actions: ${dynamicActions.join(', ')}`,
      };
    }
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

  // Providers that don't require credentials (free/open APIs)
  const NO_CREDS_PROVIDERS = ['exchangerate', 'coingecko'];
  
  // Get credentials - customer key takes priority, then local secrets, then proxy
  // Set both apiKey and token so it works with different handler patterns (most use apiKey, GitHub uses token)
  let creds = customerKey ? { apiKey: customerKey, api_key: customerKey, token: customerKey, apiSecret: '' } : getCredentials(providerId);
  const usingCustomerKey = !!customerKey;
  
  // For providers that don't need credentials, use empty creds
  if (!creds && NO_CREDS_PROVIDERS.includes(providerId)) {
    creds = { apiKey: '', api_key: '', token: '', apiSecret: '' };
  }
  
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
