import { NextResponse } from "next/server";

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

interface ModelEntry {
  id: string;
  name: string;
  provider: string;
  context_length: number | null;
  prompt_price: number | null;
  completion_price: number | null;
  direct: boolean;
}

const DIRECT_ROUTED_PREFIXES = [
  "openai/",
  "anthropic/",
  "x-ai/",
  "mistralai/",
  "meta-llama/",
  "qwen/",
  "deepseek/",
  "moonshotai/",
  "google/",
];

const DIRECT_PROVIDER_PATTERNS: { pattern: RegExp }[] = [
  { pattern: /^openai\//i },
  { pattern: /^anthropic\//i },
  { pattern: /^x-ai\/grok-/i },
  { pattern: /^mistralai\//i },
  { pattern: /^meta-llama\//i },
  { pattern: /^qwen\/qwen-?2\.5/i },
  { pattern: /^deepseek\/deepseek-(r1|v3)/i },
  { pattern: /^moonshotai\/kimi/i },
];

function deriveProvider(id: string): string {
  const slash = id.indexOf("/");
  if (slash === -1) return "other";
  const prefix = id.slice(0, slash).toLowerCase();
  if (prefix === "x-ai") return "xai";
  return prefix;
}

function isDirectRouted(id: string): boolean {
  return DIRECT_PROVIDER_PATTERNS.some((p) => p.pattern.test(id));
}

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "openrouter_unavailable", status: res.status },
        { status: 502 }
      );
    }
    const json = (await res.json()) as OpenRouterResponse;

    const models: ModelEntry[] = json.data
      .filter((m) => DIRECT_ROUTED_PREFIXES.some((p) => m.id.startsWith(p)) || m.id.includes("/"))
      .map((m) => {
        const promptPrice = m.pricing?.prompt ? parseFloat(m.pricing.prompt) : null;
        const completionPrice = m.pricing?.completion ? parseFloat(m.pricing.completion) : null;
        return {
          id: m.id,
          name: m.name || m.id,
          provider: deriveProvider(m.id),
          context_length: m.context_length || null,
          prompt_price: promptPrice,
          completion_price: completionPrice,
          direct: isDirectRouted(m.id),
        };
      });

    return NextResponse.json(
      { models, count: models.length, generated_at: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "fetch_failed", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
