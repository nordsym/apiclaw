# PRD: APIClaw Organic Distribution

> **The API layer for AI agents.** 22,000+ APIs. Direct Call. Works with any MCP-compatible agent.

---

## Executive Summary

APIClaw har organisk pull — 2,300+ clones, 409 unika användare på 2 veckor, noll ads. Enterprise (Recorded Future, Microsoft Teams) sniffar redan.

Denna PRD definierar hur vi accelererar organisk distribution utan att spendera på ads.

**Mål:** 10,000 weekly npm downloads inom 60 dagar.

---

## Current State

| Metric | Value | Source |
|--------|-------|--------|
| npm downloads (27-28 feb) | ~1,300 | npm stats |
| GitHub clones (2 veckor) | 2,319 | GitHub Insights |
| Unique cloners | 409 | GitHub Insights |
| Peak day (28 feb) | 980 clones | GitHub Insights |
| Direct Call providers | 18 | Live |
| APIs indexed | 22,392 | Live |

**Top Referrers:**
- github.com (6)
- Microsoft Teams (4) — intern delning på företag
- Recorded Future (3) — enterprise cybersecurity
- Google (2)
- Twitter (2)

**Insikt:** Folk kör `npx @nordsym/apiclaw` direkt via npm discover — inte via GitHub browsing. npm SEO är primär kanal.

---

## Strategy: Rails, Not Tools

APIClaw är inte ett verktyg. Det är **infrastruktur**.

Varje AI agent som behöver API-access bör köra på APIClaw. Som internet för agenter.

**Positioning:**
- ❌ "Ett API-verktyg för Claude"
- ✅ "The API layer for AI agents"

**Messaging:**
- "Works with any MCP-compatible agent"
- "22,000+ APIs. Direct Call. Zero config."
- "Your agent needs APIs. We built the layer."

---

## Phase 1: Foundation (Week 1-2)

### 1.1 npm Optimization ✅ DONE

- [x] Keywords: mcp, model-context-protocol, ai-agent, claude, gpt, llm, langchain, crewai, autogpt, openai, anthropic, mcp-server, tool-use, function-calling
- [x] Description: "The API layer for AI agents. 22,000+ APIs. Direct Call. Works with any MCP-compatible agent."
- [x] Badges: npm version, downloads, MIT, MCP compatible
- [x] Repository + homepage URLs

### 1.2 GitHub Optimization

**README polish:**
- [ ] GIF/video demo (agent using APIClaw)
- [ ] "Used by" section (när vi har logos)
- [ ] Clearer "Why APIClaw" section

**GitHub presence:**
- [ ] Topics: `mcp`, `ai-agent`, `api-gateway`, `claude`, `llm`
- [ ] Description: "The API layer for AI agents. 22,000+ APIs. Direct Call. Any MCP-compatible agent."
- [ ] Social preview image (1280x640 OG-style)

### 1.3 Awesome Lists (High Impact, Low Effort)

| List | URL | Status |
|------|-----|--------|
| awesome-mcp | github.com/punkpeye/awesome-mcp-servers | [ ] PR |
| awesome-claude | github.com/anthropics/anthropic-cookbook | [ ] PR |
| awesome-llm | github.com/Hannibal046/Awesome-LLM | [ ] PR |
| awesome-ai-agents | github.com/e2b-dev/awesome-ai-agents | [ ] PR |
| awesome-langchain | github.com/kyrolabs/awesome-langchain | [ ] PR |

**Action:** Submit PRs to all 5 within week 1.

---

## Phase 2: Community Seeding (Week 2-4)

### 2.1 Reddit Strategy

**Target subreddits:**
| Subreddit | Members | Fit |
|-----------|---------|-----|
| r/LocalLLaMA | 400k+ | MCP/agent builders |
| r/ClaudeAI | 50k+ | Claude users |
| r/ChatGPTCoding | 100k+ | Agent builders |
| r/MachineLearning | 3M+ | Broader reach |
| r/artificial | 500k+ | AI enthusiasts |

**Content types:**
1. **Value posts** (inte promotion)
   - "How I gave my Claude agent access to 22,000 APIs"
   - "Building an agent that can send SMS, generate images, and search the web"
   
2. **Comment engagement**
   - Svara på "how do I give my agent API access?"
   - Hjälp folk som kämpar med MCP setup

**Rules:**
- 10:1 ratio (10 value comments per 1 mention)
- Aldrig "check out my project"
- Alltid lösa ett problem först

**Account:** u/Hivebuilder (existing)

### 2.2 Discord Presence

**Target servers:**
| Server | Focus | Action |
|--------|-------|--------|
| Anthropic Discord | Claude users | Help in #mcp channel |
| LangChain Discord | Agent builders | Share in #showcase |
| CrewAI Discord | Multi-agent | Relevant use cases |
| AutoGPT Discord | Autonomous agents | Integration potential |
| AI Tinkerers | Builders | Community engagement |

**Strategy:**
- Bli känd som "the MCP API person"
- Svara på frågor, hjälp folk
- Nämn APIClaw när relevant (inte spam)

### 2.3 HackerNews

**Already done:** Initial Show HN post

**Follow-up strategy:**
- [ ] Launch post när vi når 25,000 APIs
- [ ] Launch post när vi når 25 Direct Call providers
- [ ] Kommentera på relevanta AI/agent-trådar

**HN content angle:**
- Technical depth (hur det funkar under huven)
- Indie hacker story (solo founder, bootstrap)
- "Infrastructure for the agentic era"

---

## Phase 3: Content Engine (Week 3-6)

### 3.1 Technical Tutorials

**Platform:** Dev.to, Hashnode, Medium (crosspost)

**Article ideas:**
1. "How to give any AI agent access to 22,000 APIs in 60 seconds"
2. "Building a personal assistant that sends SMS, emails, and generates images"
3. "The MCP standard: Why it matters for AI agents"
4. "From API docs to working agent in 5 minutes"
5. "Direct Call: Using APIs without managing keys"

**Frequency:** 1 artikel/vecka

### 3.2 Video Content

**Platform:** YouTube, Twitter/X

**Video ideas:**
1. 60-second demo: "Claude sends SMS via APIClaw"
2. Tutorial: "Set up APIClaw in 2 minutes"
3. Use case: "AI agent books flights and sends confirmations"

**Note:** Video är lower priority — text content first.

### 3.3 Twitter/X Strategy

**Accounts:**
- @NordSym (company)
- @HokusPontuz (Gustav personal)

**Content mix:**
- Build in public updates
- API count milestones (25k, 30k)
- Direct Call provider announcements
- User testimonials/screenshots
- MCP ecosystem commentary

**Engagement:**
- Följ/engagera med MCP-community
- Reply to agent-building threads
- Quote-tweet relevant AI news

---

## Phase 4: Partnership Leverage (Week 4-8)

### 4.1 Direct Call Provider Partnerships

Varje ny Direct Call provider = deras audience får veta om APIClaw.

**Strategy:**
1. Onboard provider
2. De annonserar "Now available on APIClaw"
3. Cross-promotion

**High-value targets:**
- Anthropic (MCP-native)
- OpenAI (function calling parallel)
- Vercel (AI SDK)
- Supabase (backend for agents)

### 4.2 Agent Framework Integrations

| Framework | Users | Integration |
|-----------|-------|-------------|
| LangChain | 100k+ | MCP tool |
| CrewAI | 50k+ | Built-in provider |
| AutoGPT | 150k+ | Plugin |
| Claude Desktop | Native | ✅ Done |
| Cursor | 500k+ | MCP config |

**Action:** Create integration guides/plugins for top 3.

### 4.3 Newsletter Features

**Target newsletters:**
- The Rundown AI (1M+ subs)
- TLDR AI (500k+ subs)
- Ben's Bites (100k+ subs)
- Superhuman AI (500k+ subs)

**Pitch angle:**
- "Infrastructure for the agentic era"
- Milestone announcements (25k APIs, etc.)

---

## Phase 5: Viral Mechanics (Ongoing)

### 5.1 Built-in Virality

**In-product:**
- [ ] "Powered by APIClaw" badge for agents
- [ ] Share button efter successful API call
- [ ] Referral program (extra API calls)

**Social proof:**
- [ ] Live counter på hemsidan (API calls made today)
- [ ] "X agents connected" counter
- [ ] Testimonial rotation

### 5.2 Milestone Marketing

| Milestone | Action |
|-----------|--------|
| 25,000 APIs | HN post, Twitter thread, Reddit |
| 50 Direct Call | Press outreach, Product Hunt |
| 1,000 daily users | Case study, enterprise push |
| 100,000 npm downloads | "Thank you" campaign |

---

## Metrics & Tracking

### Weekly KPIs

| Metric | Current | Week 4 Target | Week 8 Target |
|--------|---------|---------------|---------------|
| npm weekly downloads | ~1,300 | 3,000 | 10,000 |
| GitHub stars | ? | 200 | 500 |
| GitHub clones/week | 2,300 | 4,000 | 8,000 |
| Direct Call providers | 18 | 25 | 35 |
| APIs indexed | 22,392 | 30,000 | 40,000 |

### Attribution

- GitHub traffic insights (referrers)
- npm download trends
- Supabase/Convex analytics (signups, usage)
- Twitter mentions
- Reddit mentions

---

## Execution Priority

### This Week (Immediate)

1. **Awesome list PRs** — 5 PRs, 2 timmar arbete, potentially 1000s of eyeballs
2. **GitHub optimization** — Topics, description, social preview
3. **Reddit value post** — 1 high-quality post to r/LocalLLaMA
4. **Discord presence** — Join Anthropic Discord, help in #mcp

### Next Week

1. **First Dev.to article**
2. **Twitter content cadence** (3 posts/week)
3. **HN comment engagement**
4. **Second Reddit post**

### Week 3-4

1. **Video demo** (60 sec)
2. **Newsletter outreach**
3. **Integration guide** (LangChain)
4. **Milestone post** (if we hit 25k APIs)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Reddit shadowban | 10:1 value ratio, multiple accounts |
| HN flagging | Quality over quantity, genuine engagement |
| Spam perception | Always solve a problem first |
| Competitor copying | Speed + community + Direct Call moat |

---

## Resources Required

- **Time:** 5-10 hours/week (Symbot-driven)
- **Budget:** $0 (pure organic)
- **Tools:** GitHub, Reddit, Discord, Dev.to (all free)

---

## Success Definition

**60-day success:**
- 10,000 weekly npm downloads
- 500+ GitHub stars
- 3 awesome-list placements
- 1 newsletter feature
- 25+ Direct Call providers
- Recognized name in MCP community

**"APIClaw" blir synonymt med "API access for agents".**

---

*Last updated: 2026-03-01*
*Owner: Symbot / NordSym*
