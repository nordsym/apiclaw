---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# APIClaw: Orchestration Layer

**Status:** SPEC
**Philosophy:** Agents don't call APIs. They express intent. APIClaw executes.

---

## Core Truth

An agent that needs to:
1. Generate an image
2. Upload it somewhere
3. Email the link to someone

Should not think about this as three separate operations. It's one intent: *"Create and deliver an image."*

APIClaw is the layer that translates intent into execution.

---

## The Interface

```typescript
call_api({
  intent: "generate_and_deliver_image",
  
  // Or explicit chain:
  chain: [
    {
      id: "generate",
      provider: "replicate",
      action: "run",
      params: {
        model: "stability-ai/sdxl",
        prompt: "A sunset over mountains"
      }
    },
    {
      id: "upload",
      provider: "cloudinary",
      action: "upload",
      params: {
        url: "$generate.url"
      }
    },
    {
      id: "notify",
      provider: "resend",
      action: "send",
      params: {
        to: "client@example.com",
        subject: "Your image",
        html: "<img src='$upload.secure_url' />"
      }
    }
  ],

  // Execution modifiers
  parallel: ["generate_alt_1", "generate_alt_2"],  // Run these in parallel
  continueOnError: false,                           // Stop on first failure
  timeout: 30000,                                   // Max execution time
  retry: { maxAttempts: 3, backoff: "exponential" } // Retry policy
})
```

---

## Reference System

Steps reference each other by ID. Full JSONPath support.

```typescript
// Direct reference
"$stepId.property"

// Nested access  
"$generate.output.images[0].url"

// Previous step shorthand
"$prev.url"

// Array from parallel execution
"$parallel[0].url"

// Conditional reference
"$generate.success ? $generate.url : $fallback.url"
```

### Built-in Variables

```typescript
"$chain.startedAt"      // ISO timestamp
"$chain.workspace"      // Workspace ID
"$chain.index"          // Current step index
"$env.CUSTOM_VAR"       // Workspace environment variables
```

---

## Execution Modes

### Sequential (Default)
```typescript
chain: [A, B, C]  // A → B → C
```

### Parallel
```typescript
chain: [
  {
    parallel: [
      { id: "img1", provider: "replicate", ... },
      { id: "img2", provider: "replicate", ... },
      { id: "img3", provider: "replicate", ... }
    ]
  },
  {
    id: "combine",
    provider: "cloudinary",
    action: "create_collage",
    params: {
      images: ["$img1.url", "$img2.url", "$img3.url"]
    }
  }
]
```

### Conditional
```typescript
chain: [
  { id: "analyze", provider: "openrouter", action: "chat", ... },
  {
    if: "$analyze.intent === 'image'",
    then: { id: "gen", provider: "replicate", ... },
    else: { id: "search", provider: "brave", ... }
  },
  { id: "deliver", provider: "resend", params: { content: "$prev.result" } }
]
```

### Loop
```typescript
chain: [
  { id: "get_urls", provider: "brave", action: "search", ... },
  {
    forEach: "$get_urls.results",
    as: "result",
    do: {
      id: "scrape_$index",
      provider: "firecrawl",
      action: "scrape",
      params: { url: "$result.url" }
    }
  },
  {
    id: "summarize",
    provider: "openrouter",
    action: "chat",
    params: { content: "$forEach.results" }
  }
]
```

### Map-Reduce
```typescript
chain: [
  {
    map: {
      input: "$urls",
      fn: { provider: "firecrawl", action: "scrape", params: { url: "$item" } }
    }
  },
  {
    reduce: {
      input: "$map.results",
      fn: { provider: "openrouter", action: "chat", params: { summarize: "$items" } }
    }
  }
]
```

---

## Error Handling

### Per-Step Configuration
```typescript
{
  id: "critical_step",
  provider: "stripe",
  action: "charge",
  params: { ... },
  
  onError: {
    retry: { attempts: 3, backoff: [1000, 2000, 4000] },
    fallback: { id: "fallback_step", ... },
    abort: false  // Continue chain even if this fails
  }
}
```

### Chain-Level Policies
```typescript
chain: [...],
errorPolicy: {
  mode: "fail-fast" | "best-effort" | "transactional",
  
  // Transactional mode: rollback on failure
  rollback: [
    { if: "stripe.charge.success", do: { provider: "stripe", action: "refund", ... } }
  ]
}
```

### Error Response
```typescript
{
  success: false,
  completedSteps: ["generate", "upload"],
  failedStep: {
    id: "notify",
    error: "Rate limited",
    code: "RATE_LIMITED",
    retryAfter: 30
  },
  partialResults: {
    generate: { url: "https://..." },
    upload: { secure_url: "https://..." }
  },
  canResume: true,
  resumeToken: "chain_abc123_step_3"
}
```

---

## Resumable Chains

Long-running or failed chains can be resumed:

```typescript
call_api({
  resume: "chain_abc123_step_3",
  // Optional: override params for the failed step
  overrides: {
    notify: { to: "different@email.com" }
  }
})
```

---

## Stored Chains (Templates)

Save chains as reusable templates:

```typescript
// Define once
call_api({
  defineChain: {
    name: "content_pipeline",
    description: "Generate, optimize, publish, notify",
    inputs: {
      prompt: { type: "string", required: true },
      email: { type: "string", required: true }
    },
    chain: [
      { provider: "replicate", params: { prompt: "$inputs.prompt" } },
      { provider: "cloudinary", params: { url: "$prev.url" } },
      { provider: "ghost", params: { image: "$prev.secure_url" } },
      { provider: "resend", params: { to: "$inputs.email", content: "$prev.url" } }
    ]
  }
})

// Use anywhere
call_api({
  useChain: "content_pipeline",
  inputs: {
    prompt: "A cyberpunk cityscape",
    email: "client@example.com"
  }
})
```

---

## Webhooks & Async

For long-running chains:

```typescript
call_api({
  chain: [...],
  async: true,
  webhook: "https://your-server.com/chain-complete",
  // Or poll:
  pollInterval: 5000
})

// Response:
{
  chainId: "chain_xyz",
  status: "running",
  estimatedCompletion: "2026-03-02T01:15:00Z",
  statusUrl: "https://apiclaw.com/api/chain/chain_xyz/status"
}
```

---

## Observability

Every chain execution is fully traced:

```typescript
{
  chainId: "chain_xyz",
  trace: [
    {
      stepId: "generate",
      startedAt: "...",
      completedAt: "...",
      latencyMs: 2340,
      provider: "replicate",
      cost: { cents: 2 },
      input: { ... },
      output: { ... }
    },
    // ...
  ],
  totalLatencyMs: 4521,
  totalCost: { cents: 5 },
  tokensSaved: 1600  // vs discrete calls
}
```

Dashboard shows:
- Chain execution timeline (Gantt-style)
- Cost breakdown per step
- Error rates per provider
- Most-used chain templates

---

## Security

### Credential Isolation
Each step runs with only the credentials it needs. Step B cannot access Step A's provider credentials.

### Input Validation
References are validated before execution:
- `$nonexistent.url` → Error before any step runs
- Type mismatches caught early

### Rate Limiting
Chain-level rate limits prevent runaway execution:
```typescript
chain: [...],
limits: {
  maxSteps: 20,
  maxParallel: 5,
  maxCost: { cents: 100 }
}
```

---

## Pricing

**Chain execution = sum of step costs.**

No orchestration fee. Chaining is a feature, not a product.

Why: Chains reduce our compute overhead (1 request vs N). We pass savings to users.

---

## The Complete Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT                                   │
│                                                                 │
│  "Generate 3 variations, pick the best, publish, notify team"  │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      call_api({ chain: [...] })                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       APICLAW ORCHESTRATOR                      │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │ Parse   │→ │Validate │→ │ Plan    │                         │
│  │ Chain   │  │ Refs    │  │ Exec    │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
│                                │                                │
│                                ▼                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    EXECUTION ENGINE                       │  │
│  │                                                           │  │
│  │   ┌─────┐    ┌─────┐    ┌─────┐                          │  │
│  │   │ A   │───→│ B   │───→│ C   │  Sequential              │  │
│  │   └─────┘    └─────┘    └─────┘                          │  │
│  │                                                           │  │
│  │   ┌─────┐                                                 │  │
│  │   │ A   │─┐                                               │  │
│  │   └─────┘ │  ┌─────┐                                      │  │
│  │   ┌─────┐ ├─→│ D   │  Parallel + Join                    │  │
│  │   │ B   │─┤  └─────┘                                      │  │
│  │   └─────┘ │                                               │  │
│  │   ┌─────┐ │                                               │  │
│  │   │ C   │─┘                                               │  │
│  │   └─────┘                                                 │  │
│  │                                                           │  │
│  │   ┌─────┐    ┌─────┐                                      │  │
│  │   │ A   │───→│ B?  │───→ B₁ or B₂  Conditional           │  │
│  │   └─────┘    └─────┘                                      │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                │                                │
│                                ▼                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Replicate │ Cloudinary │ Resend │ Stripe │ ... 18 more   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT                                   │
│                                                                 │
│  { success: true, finalResult: { publishedUrl: "..." } }       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What This Enables

### Self-Orchestrating Agents
Agent receives a complex task → breaks it into chain → executes atomically → reports result.

No human writing glue code. No n8n. No Zapier. The agent IS the orchestrator, APIClaw is the executor.

### Compound Actions
"Research this company and draft an outreach email" becomes one chain:
```
Brave → Firecrawl (×3) → OpenRouter (analyze) → OpenRouter (draft) → Resend (preview)
```

### Agent-to-Agent Workflows
Agent A triggers a chain that includes calling Agent B's endpoint, which triggers its own chain.

Recursive. Distributed. Autonomous.

---

## The Positioning

> "APIClaw is not an API aggregator. It's the execution layer for autonomous AI."

> "Agents don't integrate APIs. They declare intent. APIClaw handles the rest."

> "From tool-calling to orchestration. From 10 round-trips to 1."

---

*"A chain of three call_api calls with no context switching."*

*Three? Try thirty. Try three hundred.*

*No switching. No waiting. No glue code.*

*Just execution.*

🦞

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
