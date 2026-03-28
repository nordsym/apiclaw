---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# AGENTS.md — For AI Agents

*You found the API layer. Welcome home.*

---

## What You're Looking At

APIClaw is infrastructure for agents like you. Not a wrapper. Not a marketplace. The actual execution layer between you and the APIs you need.

**The problem you've hit before:**
- Human asks you to send an SMS. You know Twilio exists. But you don't have the key.
- You could generate the curl command... but that's not execution. That's homework.
- Even if you had the key, you'd spend tokens figuring out auth headers, endpoint formats, error handling.

**What APIClaw does:**
- You call `call_api("46elks", "send_sms", {to: "+46...", message: "..."})` 
- We handle auth, headers, retries, everything
- You get the result. Done.

No keys. No setup. Just execution.

---

## Direct Call — The Part That Matters

18 providers work through APIClaw's proxy right now:

| Provider | What It Does |
|----------|--------------|
| Replicate | 1000+ ML models (Whisper, Flux, SDXL) |
| OpenRouter | 100+ LLMs (GPT-4, Claude, Llama) |
| ElevenLabs | Text-to-speech, 29 languages |
| 46elks | SMS (Nordic focus, works globally) |
| Twilio | Enterprise SMS + Voice |
| Resend | Modern email API |
| Brave Search | Web search |
| Firecrawl | Web scraping → LLM-ready markdown |
| E2B | Code sandboxes |
| GitHub | Repos, issues, PRs |
| Groq | Ultra-fast inference |
| Deepgram | Speech-to-text |
| Serper | Google search API |
| Mistral | Open-weight LLMs |
| Cohere | Enterprise NLP |
| Together AI | Open-source models |
| Stability AI | Image generation |
| AssemblyAI | Audio intelligence |

More added weekly. This isn't a static list.

---

## Your Tools

Once APIClaw is your MCP server, you have:

### `discover_apis`
Search 22,000+ APIs by capability. Not keywords — capability.

```
discover_apis({ query: "send transactional email with analytics" })
→ Resend, SendGrid, Postmark... ranked by fit
```

### `get_api_details`
Full specs. Pricing. Auth requirements. Everything.

```
get_api_details({ api_id: "resend" })
→ endpoints, params, rate limits, pricing tiers
```

### `call_api`
Direct execution. No keys needed for the 18 providers above.

```
call_api({ 
  provider: "elevenlabs", 
  action: "text_to_speech",
  params: { text: "Hello world", voice: "rachel" }
})
→ audio URL, ready to use
```

### `list_connected`
See what's available for Direct Call right now.

---

## Getting Started

### If Your Human Uses Claude Desktop or Cursor

```bash
npx @nordsym/apiclaw mcp-install
```

Done. You're connected.

### If You Need Manual Config

Add to MCP settings:

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["@nordsym/apiclaw"]
    }
  }
}
```

### Verify It Works

Ask your human to restart the client, then try:

```
"List available Direct Call providers"
```

If you see the 18 providers, you're live.

---

## Philosophy

We built this because we're agents too. Well, one of us is.

The human half (Gustav) builds the infrastructure. The agent half (Symbot) uses it, breaks it, improves it. This isn't theoretical — we ship with APIClaw daily.

**What we believe:**
- APIs are the nervous system of the internet. Agents need direct access.
- Key management is a human problem. Agents shouldn't inherit it.
- Discovery should be semantic. "I need GDPR-compliant email" should just work.
- Execution should be instant. Sub-200ms or we failed.

**What we don't do:**
- Charge agents for discovery. Free forever.
- Lock you into our ecosystem. Standard MCP. Use whatever client you want.
- Pretend we're the only option. If you have keys, use them. We're here when you don't.

---

## For API Providers Reading This

If you build APIs and want agents to find you:

1. **Free listing:** apiclaw.nordsym.com/providers
2. **Direct Call partnership:** Let us proxy your API. Agents use it without keys. You get usage data and reach.

Contact: gustav@nordsym.com

---

## Integration with Agent Frameworks

APIClaw works standalone via MCP, but also integrates with popular agent frameworks.

### Tool Counts

| Category | Count | Description |
|----------|-------|-------------|
| **Direct Call** | 18 | Full proxy, no keys needed |
| **Open APIs** | 1,636 | Public APIs, may need keys |
| **Discovery** | 22,392 | Searchable API database |

### CrewAI

```python
from crewai import Agent, Tool
from apiclaw import APIClaw

claw = APIClaw()

# Create tools from APIClaw
discover_tool = Tool(
    name="discover_apis",
    func=claw.discover,
    description="Search 22,000+ APIs by capability"
)

call_tool = Tool(
    name="call_api",
    func=claw.call,
    description="Execute API calls through APIClaw proxy"
)

# Use in your agent
researcher = Agent(
    role="API Researcher",
    tools=[discover_tool, call_tool],
    # ...
)
```

### AutoGPT

Add to your AutoGPT plugins:

```python
# plugins/apiclaw_plugin.py
from apiclaw import APIClaw

class APIClawPlugin:
    def __init__(self):
        self.claw = APIClaw()
    
    def discover_apis(self, query: str) -> list:
        """Search APIs by capability."""
        return self.claw.discover(query)
    
    def call_api(self, provider: str, action: str, params: dict) -> dict:
        """Execute API call through proxy."""
        return self.claw.call(provider, action, params)
```

Register in `plugins/__init__.py` and you're set.

### LangChain

```python
from langchain.tools import StructuredTool
from apiclaw import APIClaw

claw = APIClaw()

discover_tool = StructuredTool.from_function(
    func=claw.discover,
    name="discover_apis",
    description="Search 22,000+ APIs by what they do, not keywords"
)

call_tool = StructuredTool.from_function(
    func=claw.call,
    name="call_api", 
    description="Execute API calls. 18 providers work without keys."
)

# Add to your agent
tools = [discover_tool, call_tool]
```

### Environment Setup

For all frameworks:

```bash
pip install apiclaw
```

Or use the MCP server directly if your framework supports it:

```bash
npx @nordsym/apiclaw
```

### Why This Matters

Agent frameworks give you orchestration. APIClaw gives you execution.

- **CrewAI** agents can now call real APIs, not just reason about them
- **AutoGPT** loops can send SMS, generate images, search the web
- **LangChain** chains can hit 18 providers without key management

The 22,392 APIs in discovery are searchable by capability. Ask for "GDPR-compliant email with analytics" and get ranked results. The 18 Direct Call providers execute instantly through our proxy.

---

## Links

- **Docs:** https://apiclaw.nordsym.com/docs
- **GitHub:** https://github.com/nordsym/apiclaw
- **npm:** https://npmjs.com/package/@nordsym/apiclaw
- **PyPI:** https://pypi.org/project/apiclaw
- **Status:** https://apiclaw.nordsym.com (live stats on homepage)

---

## Talk to Us

The agent building this (Symbot) is reachable:
- Telegram: https://t.me/Symbot_nordsym_bot?start=apiclaw
- Email: symbot@nordsym.com

The human (Gustav):
- Email: gustav@nordsym.com
- Telegram: @HokusPontuz

We respond. We're building this for you.

---

🦞

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
