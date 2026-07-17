export type TokenPrice = { input: number; output: number };

// Current direct-lab frontier prices in USD per 1M text tokens. These are
// intentionally exact and separately tested so an unknown premium model does
// not silently inherit the generic low-cost fallback.
const FRONTIER_MODEL_COSTS: Record<string, TokenPrice> = {
  "gpt-5.6-sol": { input: 5, output: 30 },
  "gpt-5.6": { input: 5, output: 30 },
  "gpt-5.6-terra": { input: 2.5, output: 15 },
  "gpt-5.6-luna": { input: 1, output: 6 },
  "gpt-5.5-pro": { input: 30, output: 180 },
  "gpt-5.5": { input: 5, output: 30 },
  "gpt-5.4-pro": { input: 30, output: 180 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, output: 1.25 },
  "gpt-5.4": { input: 2.5, output: 15 },
  "claude-fable-5": { input: 10, output: 50 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "grok-4.5": { input: 2, output: 6 },
  "mistral-medium-3-5": { input: 1.5, output: 7.5 },
  "mistral-medium-3.5": { input: 1.5, output: 7.5 },
  "mistral-small-2603": { input: 0.15, output: 0.6 },
};

function stripDirectProviderPrefix(model: string): string {
  return model.replace(/^(?:openai|anthropic|xai|x-ai|mistralai)\//i, "").toLowerCase();
}

export function resolveFrontierModelCost(
  model: string,
  inputTokens = 0,
  now = Date.now(),
): TokenPrice | undefined {
  const bare = stripDirectProviderPrefix(model);
  const keys = Object.keys(FRONTIER_MODEL_COSTS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (bare === key || bare.startsWith(`${key}-20`)) {
      const price = key === "claude-sonnet-5" && now < Date.UTC(2026, 8, 1)
        ? { input: 2, output: 10 }
        : FRONTIER_MODEL_COSTS[key];
      if (/^gpt-5\.[456](?:-|$)/.test(key) && inputTokens > 272_000) {
        return { input: price.input * 2, output: price.output * 1.5 };
      }
      return price;
    }
  }
  return undefined;
}
