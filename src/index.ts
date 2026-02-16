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
import { 
  getAgentCredits, 
  addCredits, 
  purchaseAPIAccess, 
  getBalanceSummary,
  getAgentPurchases 
} from './credits.js';

// Default agent ID for MVP (in production, this would come from auth)
const DEFAULT_AGENT_ID = 'agent_default';

// Tool definitions
const tools: Tool[] = [
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
      case 'discover_apis': {
        const query = args?.query as string;
        const category = args?.category as string | undefined;
        const maxResults = (args?.max_results as number) || 5;
        const region = args?.region as string | undefined;

        const results = discoverAPIs(query, { category, maxResults, region });

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
                  status: result.purchase!.status
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
                active_purchases: summary.active_purchases.map(p => ({
                  id: p.id,
                  provider: p.provider_id,
                  credits_remaining: p.credits_purchased, // Would track actual usage in production
                  status: p.status
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
  console.error('APIvault MCP server running on stdio');
}

main().catch(console.error);
