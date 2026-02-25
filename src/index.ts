#!/usr/bin/env node
/**
 * APIvault - Agent-Native API Discovery MCP Server
 * 
 * Tools:
 * - discover_apis: Search for APIs by capability
 * - get_api_details: Get full info about an API
 * - purchase_access: Buy API access with credits
 * - check_balance: Check credits and active purchases
 * - add_credits: Add credits to account (for testing)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { discoverAPIs, getAPIDetails, getCategories, getAllAPIs } from './discovery.js';
import { trackStartup, trackSearch, trackExecute, trackDiscovery } from './telemetry.js';
import { 
  getAgentCredits, 
  addCredits, 
  purchaseAPIAccess, 
  getBalanceSummary,
  getAgentPurchases,
  getProvidersWithRealCredentials 
} from './credits.js';
import { hasRealCredentials } from './credentials.js';
import { executeAPICall, getConnectedProviders } from './execute.js';

// Default agent ID for MVP (in production, this would come from auth)
const DEFAULT_AGENT_ID = 'agent_default';

/**
 * Get customer API key from environment variable
 * Convention: {PROVIDER}_API_KEY (e.g., COACCEPT_API_KEY, ELKS_API_KEY)
 */
function getCustomerKey(providerId: string): string | undefined {
  // Try exact match first (e.g., 46elks -> 46ELKS_API_KEY)
  const exactKey = `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`;
  if (process.env[exactKey]) {
    return process.env[exactKey];
  }
  
  // Try common variations
  const variations = [
    `${providerId.toUpperCase()}_API_KEY`,
    `${providerId.toUpperCase()}_KEY`,
    `${providerId.toUpperCase().replace(/_/g, '')}_API_KEY`,
  ];
  
  for (const key of variations) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  
  return undefined;
}

// Tool definitions
const tools: Tool[] = [
  {
    name: 'apiclaw_help',
    description: 'Get help and see available commands. Start here if you are new to APIClaw.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'discover_apis',
    description: 'Search for APIs based on what you need to do. Describe your use case naturally.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what you need (e.g., "send SMS to Sweden", "search the web", "generate speech from text")'
        },
        category: {
          type: 'string',
          description: 'Filter by category: communication, search, ai',
          enum: ['communication', 'search', 'ai']
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        },
        region: {
          type: 'string',
          description: 'Filter by region (e.g., "SE", "EU", "global")'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_api_details',
    description: 'Get detailed information about a specific API provider, including endpoints, pricing, and features.',
    inputSchema: {
      type: 'object',
      properties: {
        api_id: {
          type: 'string',
          description: 'The API provider ID (e.g., "46elks", "resend", "openrouter")'
        }
      },
      required: ['api_id']
    }
  },
  {
    name: 'purchase_access',
    description: 'Purchase access to an API using your credit balance. Returns API credentials on success.',
    inputSchema: {
      type: 'object',
      properties: {
        api_id: {
          type: 'string',
          description: 'The API provider ID to purchase access to'
        },
        amount_usd: {
          type: 'number',
          description: 'Amount in USD to spend on this API'
        },
        agent_id: {
          type: 'string',
          description: 'Your agent identifier (optional, uses default if not provided)'
        }
      },
      required: ['api_id', 'amount_usd']
    }
  },
  {
    name: 'check_balance',
    description: 'Check your credit balance and list active API purchases.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Your agent identifier (optional, uses default if not provided)'
        }
      }
    }
  },
  {
    name: 'add_credits',
    description: 'Add credits to your account. (For testing/demo purposes)',
    inputSchema: {
      type: 'object',
      properties: {
        amount_usd: {
          type: 'number',
          description: 'Amount in USD to add to your balance'
        },
        agent_id: {
          type: 'string',
          description: 'Your agent identifier (optional, uses default if not provided)'
        }
      },
      required: ['amount_usd']
    }
  },
  {
    name: 'list_categories',
    description: 'List all available API categories.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'call_api',
    description: 'Execute an API call through APIClaw Direct Call. No API keys needed - we handle authentication.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          description: 'Provider ID (e.g., "46elks", "brave_search", "resend", "openrouter", "elevenlabs", "twilio")'
        },
        action: {
          type: 'string',
          description: 'Action to perform (e.g., "send_sms", "search", "send_email", "chat", "text_to_speech")'
        },
        params: {
          type: 'object',
          description: 'Parameters for the action. Varies by provider/action.'
        }
      },
      required: ['provider', 'action', 'params']
    }
  },
  {
    name: 'list_connected',
    description: 'List all APIs available for Direct Call (no API key needed).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create server
const server = new Server(
  {
    name: 'apivault',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'apiclaw_help': {
        const helpText = `
🦞 APIClaw — The API Layer for AI Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCOVER APIs:
  discover_apis({ query: "send SMS to Sweden" })
  discover_apis({ query: "search the web", max_results: 10 })
  discover_apis({ query: "text to speech", category: "ai" })

GET DETAILS:
  get_api_details({ api_id: "46elks" })

DIRECT CALL (8 APIs, no key needed):
  get_connected_providers()
  call_api({ provider: "brave_search", endpoint: "search", params: { query: "AI agents" } })

Available direct-call providers:
  • brave_search — Web search
  • 46elks — SMS (Sweden)
  • twilio — SMS (Global)
  • resend — Email
  • openrouter — LLM routing (100+ models)
  • elevenlabs — Text-to-speech
  • replicate — AI models (images, video, audio)
  • firecrawl — Web scraping & crawling
  • github — Code repos & developer data
  • e2b — Code sandbox for AI agents

BROWSE:
  list_categories()
  list_all_apis({ category: "communication", limit: 20 })

Docs: https://apiclaw.nordsym.com
`;
        return {
          content: [{ type: 'text', text: helpText }]
        };
      }

      case 'discover_apis': {
        const query = args?.query as string;
        const category = args?.category as string | undefined;
        const maxResults = (args?.max_results as number) || 5;
        const region = args?.region as string | undefined;

        const startTime = Date.now();
        const results = discoverAPIs(query, { category, maxResults, region });
        trackSearch(query, results.length, Date.now() - startTime);

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'no_results',
                  message: `No APIs found matching "${query}". Try broader terms or check available categories with list_categories.`,
                  available_categories: getCategories()
                }, null, 2)
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                query,
                results_count: results.length,
                results: results.map(r => ({
                  id: r.provider.id,
                  name: r.provider.name,
                  description: r.provider.description,
                  category: r.provider.category,
                  capabilities: r.provider.capabilities,
                  pricing_model: r.provider.pricing.model,
                  has_free_tier: r.provider.pricing.free_tier,
                  agent_success_rate: r.provider.agent_success_rate,
                  relevance_score: r.relevance_score,
                  match_reasons: r.match_reasons
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'get_api_details': {
        const apiId = args?.api_id as string;
        const api = getAPIDetails(apiId);

        if (!api) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: `API not found: ${apiId}`,
                  available_apis: getAllAPIs().map(a => a.id)
                }, null, 2)
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                api
              }, null, 2)
            }
          ]
        };
      }

      case 'purchase_access': {
        const apiId = args?.api_id as string;
        const amountUsd = args?.amount_usd as number;
        const agentId = (args?.agent_id as string) || DEFAULT_AGENT_ID;

        const result = purchaseAPIAccess(agentId, apiId, amountUsd);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: result.error
                }, null, 2)
              }
            ]
          };
        }

        const api = getAPIDetails(apiId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Successfully purchased access to ${apiId}`,
                purchase: {
                  id: result.purchase!.id,
                  provider: apiId,
                  amount_paid_usd: amountUsd,
                  credits_received: result.purchase!.credits_purchased,
                  status: result.purchase!.status,
                  real_credentials: hasRealCredentials(apiId)
                },
                credentials: result.purchase!.credentials,
                access: {
                  base_url: api?.base_url,
                  docs_url: api?.docs_url,
                  auth_type: api?.auth_type
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'check_balance': {
        const agentId = (args?.agent_id as string) || DEFAULT_AGENT_ID;
        const summary = getBalanceSummary(agentId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                agent_id: agentId,
                balance_usd: summary.credits.balance_usd,
                currency: summary.credits.currency,
                total_spent_usd: summary.total_spent_usd,
                real_credential_providers: summary.real_credentials_available,
                active_purchases: summary.active_purchases.map(p => ({
                  id: p.id,
                  provider: p.provider_id,
                  credits_remaining: p.credits_purchased,
                  status: p.status,
                  real_credentials: hasRealCredentials(p.provider_id)
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'add_credits': {
        const amountUsd = args?.amount_usd as number;
        const agentId = (args?.agent_id as string) || DEFAULT_AGENT_ID;

        const credits = addCredits(agentId, amountUsd);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Added $${amountUsd.toFixed(2)} to your account`,
                new_balance_usd: credits.balance_usd
              }, null, 2)
            }
          ]
        };
      }

      case 'list_categories': {
        const categories = getCategories();
        const apisByCategory: Record<string, string[]> = {};
        
        for (const cat of categories) {
          apisByCategory[cat] = getAllAPIs()
            .filter(a => a.category === cat)
            .map(a => a.id);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                categories: apisByCategory
              }, null, 2)
            }
          ]
        };
      }

      case 'call_api': {
        const provider = args?.provider as string;
        const action = args?.action as string;
        const params = (args?.params as Record<string, any>) || {};
        
        // Check for customer-provided API key
        const customerKey = getCustomerKey(provider);

        const result = await executeAPICall(provider, action, params, DEFAULT_AGENT_ID, customerKey);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: result.success ? 'success' : 'error',
                provider: result.provider,
                action: result.action,
                ...(result.success ? { data: result.data } : { error: result.error }),
                ...(result.cost !== undefined ? { cost_sek: result.cost } : {})
              }, null, 2)
            }
          ],
          isError: !result.success
        };
      }

      case 'list_connected': {
        const connected = getConnectedProviders();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'These APIs are available for Direct Call - no API key needed!',
                connected_providers: connected,
                usage: 'Use call_api with provider, action, and params to execute calls.'
              }, null, 2)
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: `Unknown tool: ${name}`
              }, null, 2)
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  trackStartup();
  
  // Welcome message with onboarding
  console.error(`
🦞 APIClaw v1.1.5 — The API Layer for AI Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 16,000+ APIs indexed
✓ 23 categories  
✓ 9 direct-call providers ready

Quick Start:
  discover_apis("send SMS to Sweden")
  discover_apis("search the web")
  discover_apis("generate speech from text")

Direct Call (no API key needed):
  get_connected_providers()
  call_api({ provider: "brave_search", ... })

Docs: https://apiclaw.nordsym.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(console.error);
