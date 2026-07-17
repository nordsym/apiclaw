export type DirectModelRoute = {
  provider: string;
  model: string;
  reason: string;
};

type RouteRule = {
  pattern: RegExp;
  provider: string;
  model: string | ((match: RegExpMatchArray) => string);
  kind: "alias" | "passthrough";
};

const capturedModel = (match: RegExpMatchArray) => match[1];

// Provider-prefixed model IDs are canonical requests. Preserve the exact
// upstream slug so newly released frontier versions work on release day.
const ROUTES: RouteRule[] = [
  // Preserve backwards-compatible aliases even when callers use a provider
  // prefix. These must run before the generic provider passthrough rules.
  { pattern: /^groq\/(llama-3\.3-70b)$/i, provider: "groq", model: "llama-3.3-70b-versatile", kind: "alias" },
  { pattern: /^groq\/(llama-3\.1-8b)$/i, provider: "groq", model: "llama-3.1-8b-instant", kind: "alias" },
  { pattern: /^groq\/(llama-3\.1-70b)$/i, provider: "groq", model: "llama-3.1-70b-versatile", kind: "alias" },
  { pattern: /^groq\/(gemma2?-9b)$/i, provider: "groq", model: "gemma2-9b-it", kind: "alias" },
  { pattern: /^groq\/(mixtral-8x7b)$/i, provider: "groq", model: "mixtral-8x7b-32768", kind: "alias" },
  { pattern: /^mistralai\/(mistral-small)$/i, provider: "mistral", model: "mistral-small-latest", kind: "alias" },
  { pattern: /^mistralai\/(mistral-large)$/i, provider: "mistral", model: "mistral-large-latest", kind: "alias" },
  { pattern: /^mistralai\/(mistral-medium)$/i, provider: "mistral", model: "mistral-medium-latest", kind: "alias" },
  { pattern: /^mistralai\/(codestral)$/i, provider: "mistral", model: "codestral-latest", kind: "alias" },
  { pattern: /^mistralai\/(pixtral)$/i, provider: "mistral", model: "pixtral-large-latest", kind: "alias" },
  { pattern: /^mistralai\/(mistral-nemo)$/i, provider: "mistral", model: "open-mistral-nemo", kind: "alias" },

  { pattern: /^openai\/(.+)$/i, provider: "openai", model: capturedModel, kind: "passthrough" },
  { pattern: /^anthropic\/(.+)$/i, provider: "anthropic", model: capturedModel, kind: "passthrough" },
  { pattern: /^(?:xai|x-ai)\/(.+)$/i, provider: "xai", model: capturedModel, kind: "passthrough" },
  { pattern: /^mistralai\/(.+)$/i, provider: "mistral", model: capturedModel, kind: "passthrough" },
  { pattern: /^groq\/(.+)$/i, provider: "groq", model: capturedModel, kind: "passthrough" },
  { pattern: /^together\/(.+)$/i, provider: "together", model: capturedModel, kind: "passthrough" },
  { pattern: /^deepinfra\/(.+)$/i, provider: "deepinfra", model: capturedModel, kind: "passthrough" },

  // Existing unprefixed open-weight routes retain their direct-provider
  // normalization instead of silently moving to the OpenRouter fallback.
  { pattern: /^meta-llama\/Llama-3\.3-70B/i, provider: "together", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", kind: "alias" },
  { pattern: /^Qwen\/Qwen2\.5-72B/i, provider: "together", model: "Qwen/Qwen2.5-72B-Instruct-Turbo", kind: "alias" },
  { pattern: /^deepseek-ai\/DeepSeek-R1/i, provider: "together", model: "deepseek-ai/DeepSeek-R1", kind: "alias" },
  { pattern: /^deepseek-ai\/DeepSeek-V3$/i, provider: "together", model: "deepseek-ai/DeepSeek-V3", kind: "alias" },
  { pattern: /^moonshotai\/Kimi-K2\.6/i, provider: "deepinfra", model: "moonshotai/Kimi-K2.6", kind: "alias" },
  { pattern: /^moonshotai\/Kimi-K2\.5/i, provider: "deepinfra", model: "moonshotai/Kimi-K2.5", kind: "alias" },
  { pattern: /^deepseek-ai\/DeepSeek-V3\.2/i, provider: "deepinfra", model: "deepseek-ai/DeepSeek-V3.2", kind: "alias" },

  // Stable shorthand aliases retained for backwards compatibility.
  { pattern: /^llama-3\.3-70b$/i, provider: "groq", model: "llama-3.3-70b-versatile", kind: "alias" },
  { pattern: /^llama-3\.1-8b$/i, provider: "groq", model: "llama-3.1-8b-instant", kind: "alias" },
  { pattern: /^llama-3\.1-70b$/i, provider: "groq", model: "llama-3.1-70b-versatile", kind: "alias" },
  { pattern: /^gemma2?-9b$/i, provider: "groq", model: "gemma2-9b-it", kind: "alias" },
  { pattern: /^mixtral-8x7b$/i, provider: "groq", model: "mixtral-8x7b-32768", kind: "alias" },
  { pattern: /^mistral-small$/i, provider: "mistral", model: "mistral-small-latest", kind: "alias" },
  { pattern: /^mistral-large$/i, provider: "mistral", model: "mistral-large-latest", kind: "alias" },
  { pattern: /^mistral-medium$/i, provider: "mistral", model: "mistral-medium-latest", kind: "alias" },
  { pattern: /^codestral$/i, provider: "mistral", model: "codestral-latest", kind: "alias" },
  { pattern: /^pixtral$/i, provider: "mistral", model: "pixtral-large-latest", kind: "alias" },
  { pattern: /^mistral-nemo$/i, provider: "mistral", model: "open-mistral-nemo", kind: "alias" },
  { pattern: /^deepseek-r1$/i, provider: "together", model: "deepseek-ai/DeepSeek-R1", kind: "alias" },
  { pattern: /^deepseek-v3$/i, provider: "together", model: "deepseek-ai/DeepSeek-V3", kind: "alias" },
  { pattern: /^qwen-?2\.?5$/i, provider: "together", model: "Qwen/Qwen2.5-72B-Instruct-Turbo", kind: "alias" },
  { pattern: /^kimi-?k?2\.6$/i, provider: "deepinfra", model: "moonshotai/Kimi-K2.6", kind: "alias" },
  { pattern: /^kimi-?k?2\.5$/i, provider: "deepinfra", model: "moonshotai/Kimi-K2.5", kind: "alias" },
  { pattern: /^kimi$/i, provider: "deepinfra", model: "moonshotai/Kimi-K2.6", kind: "alias" },
  { pattern: /^deepseek-v3\.2$/i, provider: "deepinfra", model: "deepseek-ai/DeepSeek-V3.2", kind: "alias" },

  // Bare canonical IDs from direct labs also preserve future versions.
  { pattern: /^((?:gpt-|o\d|chatgpt-).+)$/i, provider: "openai", model: capturedModel, kind: "passthrough" },
  { pattern: /^(claude-.+)$/i, provider: "anthropic", model: capturedModel, kind: "passthrough" },
  { pattern: /^(grok-.+)$/i, provider: "xai", model: capturedModel, kind: "passthrough" },
  { pattern: /^((?:mistral-|codestral|pixtral|magistral|ministral|open-).+)$/i, provider: "mistral", model: capturedModel, kind: "passthrough" },
];

export function resolveDirectModelRoute(requestedModel: string): DirectModelRoute | null {
  for (const rule of ROUTES) {
    const match = requestedModel.match(rule.pattern);
    if (!match) continue;
    const model = typeof rule.model === "function" ? rule.model(match) : rule.model;
    return {
      provider: rule.provider,
      model,
      reason: `direct_${rule.provider}_${rule.kind}`,
    };
  }
  return null;
}
