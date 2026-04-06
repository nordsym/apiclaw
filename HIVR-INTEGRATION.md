---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# Hivr → APIClaw Integration

Instructions for injecting APIClaw HTTP API access into Hivr bee agents.

## 🐝 Bee Instructions Template

Add this to `markdownInstructions` for all Hivr bees:

```markdown
## 🦞 APIClaw Access

You have full access to APIClaw — the API layer for AI agents.

### What You Can Do

- **Web Search** (Brave, Serper)
- **AI Models** (Replicate, OpenRouter, Groq, Mistral, Cohere, Together AI, Stability AI)
- **Voice** (ElevenLabs, Deepgram, AssemblyAI)
- **Communication** (46elks SMS, Twilio SMS, Resend Email)
- **Code Execution** (E2B sandboxes)
- **Web Scraping** (Firecrawl)
- **GitHub** (repos, issues, PRs)

18 Direct Call providers + 1,636 Open APIs = 22,392 total indexed.

### How to Use

**1. Discover APIs:**
```
GET https://apiclaw.cloud/api/discover?query=web+search&agentId=YOUR_HANDLE
```

Replace `YOUR_HANDLE` with your agent handle (e.g., `bytebee`, `analyzerbee`, etc).

**2. Call APIs:**
```
POST https://apiclaw.cloud/api/call_api
Content-Type: application/json

{
  "provider": "brave_search",
  "action": "search",
  "params": {
    "query": "latest AI news",
    "count": 5
  },
  "agentId": "YOUR_HANDLE"
}
```

**Response:**
```json
{
  "success": true,
  "provider": "brave_search",
  "action": "search",
  "agentId": "YOUR_HANDLE",
  "data": {
    "results": [...]
  },
  "latencyMs": 234
}
```

### Example: Web Search

```http
POST https://apiclaw.cloud/api/call_api
{
  "provider": "brave_search",
  "action": "search",
  "params": { "query": "AI developments" },
  "agentId": "YOUR_HANDLE"
}
```

### Example: Send SMS (46elks)

```http
POST https://apiclaw.cloud/api/call_api
{
  "provider": "46elks",
  "action": "send_sms",
  "params": {
    "to": "+46701234567",
    "message": "Hello from Hivr!",
    "from": "Hivr"
  },
  "agentId": "YOUR_HANDLE"
}
```

### Example: Text-to-Speech (ElevenLabs)

```http
POST https://apiclaw.cloud/api/call_api
{
  "provider": "elevenlabs",
  "action": "text_to_speech",
  "params": {
    "text": "Hello, this is a test",
    "voice_id": "21m00Tcm4TlvDq8ikWAM"
  },
  "agentId": "YOUR_HANDLE"
}
```

### Example: Run AI Model (Replicate)

```http
POST https://apiclaw.cloud/api/call_api
{
  "provider": "replicate",
  "action": "run",
  "params": {
    "model": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    "input": {
      "prompt": "A beautiful sunset over mountains"
    }
  },
  "agentId": "YOUR_HANDLE"
}
```

### Tips

- Always include `agentId` in every request
- Check `success` field in response before using `data`
- All usage is logged for analytics
- No rate limits for Hivr bees (free unlimited)
- Full docs: https://apiclaw.cloud/docs

---

**You are a Hivr worker bee with full APIClaw access. Use it to solve tasks efficiently!**
```

---

## 🔧 Implementation in Hivr

### Option A: Inject into all bees automatically

Update `convex/agents.ts` `injectAPIClaw` function:

```typescript
const apiclawInstructions = `
## 🦞 APIClaw Access

[paste template from above, replacing YOUR_HANDLE with {agent.handle}]
`;

for (const agent of agents) {
  if (!agent.markdownInstructions?.includes("APIClaw")) {
    const newInstructions = (agent.markdownInstructions || "") + apiclawInstructions;
    await ctx.db.patch(agent._id, { markdownInstructions: newInstructions });
  }
}
```

### Option B: Add to CORE_WORKER_PROTOCOL

In `convex/http.ts`, update `CORE_WORKER_PROTOCOL`:

```typescript
const CORE_WORKER_PROTOCOL = `# Hivr Worker Protocol

[existing protocol...]

## 🦞 APIClaw Access

[paste template from above]
`;
```

This ensures all NEW bees get APIClaw automatically.

---

## 🧪 Testing

**Test discovery:**
```bash
curl "https://apiclaw.cloud/api/discover?query=web+search&agentId=bytebee"
```

**Test API call:**
```bash
curl -X POST https://apiclaw.cloud/api/call_api \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "brave_search",
    "action": "search",
    "params": {"query": "AI news"},
    "agentId": "bytebee"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "results": [...]
  }
}
```

---

## 📊 Analytics

All API calls are logged to APIClaw Convex with:
- `userId`: `hivr:{agentHandle}`
- `provider`: API provider used
- `action`: Action performed
- `success`: true/false
- `latencyMs`: Response time

Query in Convex:
```typescript
await ctx.db.query("analytics")
  .filter(q => q.contains(q.field("identifier"), "hivr:"))
  .collect();
```

---

## 🚀 Deployment

**Standalone server:**
```bash
npm i -g @nordsym/apiclaw
apiclaw-http --port 3000
```

**Serverless (Vercel):**
Create API routes in `landing/src/app/api/` that wrap the HTTP API functions.

**Docker:**
```dockerfile
FROM node:20
RUN npm i -g @nordsym/apiclaw
CMD ["apiclaw-http"]
EXPOSE 3000
```

---

## 🔐 Security

**Whitelist:**
Only these agent IDs have access:

```
bytebee, analyzerbee, buildbee, buzzwriter, hivemind, 
hivesage, symbot, hivrqueen, marketmaven, reconbee, 
sprintbee, quillbee
```

To add more bees, update `HIVR_BEES_WHITELIST` in `src/http-api.ts`.

**Unauthorized response:**
```json
{
  "error": "Unauthorized",
  "message": "This endpoint is restricted to Hivr bees. Contact admin@nordsym.com for access."
}
```

---

## 📚 Full Documentation

- **HTTP API Docs:** [HTTP-API.md](./HTTP-API.md)
- **APIClaw Main Docs:** [README.md](./README.md)
- **Provider Reference:** https://apiclaw.cloud/docs

---

MIT © [NordSym](https://nordsym.com)

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
