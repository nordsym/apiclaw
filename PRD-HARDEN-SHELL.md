# APIClaw PRD: Harden The Shell

**Status:** DRAFT
**Owner:** Gustav + Symbot
**Mode:** God mode. No estimates. Pure conviction.

---

## Part 1: AI Testimonials Section

### Concept
"What AI Agents Say About APIClaw" — a carousel of quotes from Gemini, Grok, Claude, GPT.

Meta and on-brand: AI agents reviewing a tool built for AI agents.

### Design
- **Location:** After hero, before "How It Works"
- **Format:** Horizontal carousel, 4 cards, auto-scroll + manual arrows
- **Each card:**
  - AI logo/icon (Gemini, Grok, Claude, GPT)
  - Quote (2-3 lines max)
  - Model name + "AI Agent"

### Quotes (Final Selection)

**Gemini:**
> "You're not selling picks and shovels — you're selling an automated mining system."

**Grok:**
> "I would integrate it in a heartbeat. Removes ~70% of the deployment friction."

**Claude:**
> "The difference between can do and will do without hesitation."

**GPT:**
> "Stripe for AI agents, but for execution. That positioning is compelling."

### Implementation
- Reuse existing testimonial carousel component
- Add AI model icons (simple SVG or emoji fallback: 🤖)
- Mobile: stack vertically or swipe

---

## Part 2: Harden The Shell — Turn Criticism Into Strength

Every critique from the 4 AI agents becomes a feature, clarification, or landing page addition.

### 2.1 Pricing Clarity

**Critique:** "Pricing model is missing from the pitch" (Claude, Grok, GPT)

**Action:**
- [x] Pricing section exists on landing ✓
- [ ] Add pricing summary to copy-context
- [ ] Add pricing link to docs page
- [ ] FAQ answer: "What does it cost?" already exists, ensure it's visible

**Copy-context addition:**
```
Pricing: Free (50 calls/week), Pay-as-you-go (usage-based), or Founding Backer ($199 unlimited until 2027).
```

---

### 2.2 Latency & Reliability

**Critique:** "Every call through proxy adds round-trips" (Grok, GPT)

**Action:**
- [ ] Add latency stats to landing: "Sub-200ms median response time"
- [ ] Add status page link (or create one)
- [ ] Document: Direct Call providers are edge-optimized
- [ ] Future: Add latency badge per provider in workspace

**Landing addition:**
```
⚡ Sub-200ms median latency — edge-optimized proxy layer
```

---

### 2.3 Trust & Security Story

**Critique:** "Centralizing keys/billing is a major trust shift" (GPT, Grok)

**Action:**
- [x] Add Security section to landing OR dedicated /security page ✓ (2026-03-02)
- [x] Cover:
  - AES-256-GCM encryption for stored keys ✓
  - No logging of request/response payloads ✓
  - Tenant isolation ✓
  - SOC2 roadmap mention (if planned) ✓
- [x] Add trust badge to footer: "🔒 Enterprise-grade security" ✓

**Implemented:**
- Created dedicated `/security` page with full coverage
- Added "AES-256 Encrypted" badge to footer (links to /security)
- Added Security link in footer Product menu
- Live at: https://apiclaw.nordsym.com/security

**FAQ addition:**
```
Q: How are credentials secured?
A: All credentials encrypted with AES-256-GCM. Keys never logged or exposed in responses. Direct Call requests proxied server-side — your credentials never touch the agent.
```
(This already exists — make it more prominent)

---

### 2.4 Error Handling & Normalization

**Critique:** "What happens when Replicate fails? Structured errors?" (Claude, GPT)

**Action:**
- [x] Document error response format in docs ✓ (v1.3.13)
- [x] Ensure all providers return: `{ success: false, error: "message", code: "ERROR_CODE" }` ✓ (v1.3.13)
- [x] Add retry logic for transient failures (503, 429) ✓ (v1.3.13 - exponential backoff with jitter)
- [ ] Add to copy-context: "Structured error responses across all providers"

**Already done:**
- [x] Response normalization (url, id, content, status extracted) ✓

**Docs addition:**
```
## Error Handling

All providers return structured errors:
{
  success: false,
  provider: "replicate",
  action: "run",
  error: "Rate limit exceeded",
  code: "RATE_LIMITED"
}

APIClaw automatically retries transient failures (429, 503) with exponential backoff.
```

---

### 2.5 Direct Call vs Indexed APIs Distinction

**Critique:** "Mixes pre-integrated providers with giant index" (Grok, GPT)

**Action:**
- [ ] Clearer distinction on landing:
  - **Direct Call (18):** Zero-config, instant execution, we handle auth
  - **Indexed (22k+):** Discoverable, specs available, BYOK
- [ ] Visual separation in "How It Works" section
- [ ] Copy-context already clear, but landing should match

**Landing copy:**
```
Two ways to use APIClaw:

**Direct Call (18 providers)**
Zero config. We handle auth. Just call.

**API Discovery (22,392+ APIs)**
Search by capability. Get specs. Bring your own key.
```

---

### 2.6 Spend Limits / Cost Awareness

**Critique:** "Developers will worry about runaway costs" (Claude, GPT)

**Action:**
- [ ] Add spend alerts in workspace (email when hitting 80% of limit)
- [ ] Add monthly budget cap option
- [ ] Show estimated cost before execution (dry-run already exists)
- [ ] Add to copy-context: "Built-in spend limits and cost estimates"

**Workspace feature:**
```
Settings → Billing → Monthly budget cap: $____
☑️ Pause execution when limit reached
☑️ Email alert at 80%
```

---

### 2.7 50 Calls/Week Is Tight

**Critique:** "Very tight for anything beyond toy demos" (Grok)

**Action:**
- [ ] Consider increasing free tier to 100/week
- [ ] OR: Make "Founding Backer" more prominent as the serious option
- [ ] Add "Earn more calls" via GitHub star, newsletter, etc. (optional, low priority)

**Decision needed:** Keep 50 or bump to 100?

---

### 2.8 Streaming Support

**Critique:** "Is streaming supported?" (GPT)

**Action:**
- [ ] Document which providers support streaming (OpenRouter, Groq)
- [ ] Add streaming param to call_api for supported providers
- [ ] Landing mention: "Streaming supported for LLM providers"

---

### 2.9 "Version B" Positioning

**Critique:** "Is it aggregator or agent operating layer?" (GPT)

**Action:**
- [ ] Commit fully to "Version B" — The Execution Layer for Autonomous AI
- [ ] Update tagline candidates:
  - "The API Layer for AI Agents" ✓ (current, good)
  - "The Execution Fabric for Autonomous AI" (bolder)
  - "Runtime Infrastructure for AI Agents" (technical)
- [ ] Ensure all copy reinforces infrastructure, not just aggregation

---

## Part 3: Execution Checklist

### Phase 1: Testimonials (Ship first)
- [ ] Create AI testimonials carousel component
- [ ] Add 4 quotes with AI icons
- [ ] Deploy to landing

### Phase 2: Trust & Clarity
- [ ] Add pricing one-liner to copy-context
- [ ] Add latency stat to hero
- [ ] Create /security page or section
- [ ] Clarify Direct Call vs Indexed distinction on landing

### Phase 3: Reliability Features
- [x] Implement retry logic with backoff ✓ (v1.3.13)
- [x] Document error format ✓ (v1.3.13)
- [ ] Add spend alerts to workspace
- [ ] Add budget cap option

### Phase 4: Polish
- [ ] Streaming documentation
- [ ] Consider free tier bump
- [ ] Status page

---

## Agents

| Task | Agent | Status |
|------|-------|--------|
| Testimonials carousel | Symbot | Ready |
| Copy-context pricing line | Symbot | Ready |
| Landing copy updates | Symbot | Ready |
| Security page | Symbot | Ready |
| Retry logic implementation | Symbot | Ready |
| Spend alerts (Convex) | Symbot | Ready |
| Budget cap (Convex + Stripe) | Symbot | Ready |

**All tasks: Symbot solo. No subagents needed.**

---

## Success Criteria

- [ ] All 4 AI testimonials visible on landing
- [ ] Zero critique points left unaddressed
- [ ] Copy-context includes pricing
- [ ] Landing clearly separates Direct Call vs Discovery
- [ ] Security story is visible
- [ ] Error handling is documented

---

*"Harden the shell. Turn every critique into a moat."*

🦞
