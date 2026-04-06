---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# APIClaw HTTP API

REST endpoints for headless agents (Hivr bees, webhooks, serverless functions).

## 🚀 Quick Start

**Start server:**
```bash
npx apiclaw-http --port 3000
```

**Or via npm:**
```bash
npm i -g @nordsym/apiclaw
apiclaw-http
```

Server runs on `http://localhost:3000` by default.

---

## 📡 Endpoints

### 1. Discover APIs

Search for APIs by capability.

**Request:**
```http
GET /api/discover?query=web+search&agentId=bytebee&category=Search&maxResults=5
```

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `query` | Yes | Search query (e.g., "web search", "send SMS") |
| `agentId` | Yes | Your agent ID (must be whitelisted) |
| `category` | No | Filter by category |
| `maxResults` | No | Max results to return (default: 5) |

**Response:**
```json
{
  "success": true,
  "query": "web search",
  "results": [
    {
      "provider": {
        "id": "brave_search",
        "name": "Brave Search",
        "category": "Search"
      },
      "score": 95,
      "reasons": ["keyword: search", "capability: web search"]
    }
  ],
  "count": 1,
  "responseTimeMs": 12
}
```

---

### 2. Call API

Execute an API call.

**Request:**
```http
POST /api/call_api
Content-Type: application/json

{
  "provider": "brave_search",
  "action": "search",
  "params": {
    "query": "AI news",
    "count": 5
  },
  "agentId": "bytebee"
}
```

**Parameters:**
| Field | Required | Description |
|-------|----------|-------------|
| `provider` | Yes | Provider ID (from discover results) |
| `action` | Yes | Action to perform (e.g., "search", "send_sms") |
| `params` | Yes | Action parameters (varies by provider) |
| `agentId` | Yes | Your agent ID (must be whitelisted) |

**Response (success):**
```json
{
  "success": true,
  "provider": "brave_search",
  "action": "search",
  "agentId": "bytebee",
  "data": {
    "results": [
      {
        "title": "Latest AI News",
        "url": "https://example.com/ai-news",
        "snippet": "..."
      }
    ]
  },
  "latencyMs": 234
}
```

**Response (error):**
```json
{
  "success": false,
  "provider": "brave_search",
  "action": "search",
  "agentId": "bytebee",
  "error": "Rate limit exceeded",
  "latencyMs": 12
}
```

---

### 3. Health Check

Check if server is running.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "apiclaw-http-api"
}
```

---

## 🔐 Authentication

**Hivr Bees Whitelist:**

Access is restricted to whitelisted Hivr bees. The `agentId` parameter must match one of these:

```
bytebee, analyzerbee, buildbee, buzzwriter, hivemind, 
hivesage, symbot, hivrqueen, marketmaven, reconbee, 
sprintbee, quillbee
```

**Unauthorized response:**
```json
{
  "error": "Unauthorized",
  "message": "This endpoint is restricted to Hivr bees. Contact admin@nordsym.com for access."
}
```

---

## 📊 Usage Logging

All API calls are logged to APIClaw analytics with:
- Provider + action
- Agent ID (e.g., `hivr:bytebee`)
- Success/failure
- Latency

This enables usage tracking per Hivr bee.

---

## 🎯 Example: Web Search

**1. Discover search APIs:**
```bash
curl "http://localhost:3000/api/discover?query=web+search&agentId=bytebee"
```

**2. Call Brave Search:**
```bash
curl -X POST http://localhost:3000/api/call_api \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "brave_search",
    "action": "search",
    "params": {
      "query": "latest AI developments",
      "count": 5
    },
    "agentId": "bytebee"
  }'
```

---

## 🌐 CORS

CORS headers are set to allow cross-origin requests from anywhere:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, X-Agent-Id`

Safe for browser-based agents.

---

## 🚀 Deployment

### Local Development
```bash
apiclaw-http --port 3000
```

### Production (systemd)
```ini
[Unit]
Description=APIClaw HTTP API
After=network.target

[Service]
Type=simple
User=apiclaw
WorkingDirectory=/opt/apiclaw
ExecStart=/usr/bin/apiclaw-http --port 3000
Restart=always
Environment="PORT=3000"

[Install]
WantedBy=multi-user.target
```

### Docker
```dockerfile
FROM node:20
RUN npm i -g @nordsym/apiclaw
CMD ["apiclaw-http", "--port", "3000"]
EXPOSE 3000
```

### Vercel (Serverless)
See `landing/` directory for Next.js API routes wrapper.

---

## 🐝 Hivr Integration

**In your Hivr bee instructions:**
```markdown
## APIClaw Access 🦞

You have access to APIClaw via HTTP API.

**Discover APIs:**
GET https://apiclaw.cloud/api/discover?query=web+search&agentId=YOUR_HANDLE

**Call APIs:**
POST https://apiclaw.cloud/api/call_api
Body: { provider: "brave_search", action: "search", params: {...}, agentId: "YOUR_HANDLE" }

**Your agent ID:** Replace `YOUR_HANDLE` with your actual handle (e.g., "bytebee").
```

---

## 📚 API Provider Reference

See [apiclaw.cloud/docs](https://apiclaw.cloud/docs) for:
- List of all 18 Direct Call providers
- Available actions per provider
- Parameter schemas
- Rate limits & pricing

---

## 🔧 Development

**Run from source:**
```bash
cd apiclaw
npm run build
node dist/bin-http.js --port 3000
```

**Watch mode:**
```bash
tsx watch src/bin-http.ts
```

---

## ❓ Support

- **Docs:** [apiclaw.cloud/docs](https://apiclaw.cloud/docs)
- **Issues:** [github.com/nordsym/apiclaw/issues](https://github.com/nordsym/apiclaw/issues)
- **Email:** admin@nordsym.com

---

MIT © [NordSym](https://nordsym.com)

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
