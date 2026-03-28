---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# Subagent Naming Convention

**Principle:** Names describe FUNCTION, not implementation.

---

## Format

```
{function}[-{qualifier}]
```

## Examples

| Good ✅ | Bad ❌ | Why |
|---------|--------|-----|
| `audio-transcriber` | `deepgram-agent` | API-agnostic |
| `image-generator` | `replicate-flux` | Can switch models |
| `sms-sender` | `46elks-sms` | Provider may change |
| `email-drafter` | `gpt4-email` | Model-agnostic |
| `web-researcher` | `brave-search-bot` | Search engine agnostic |

## Categories

### Content
- `content-writer`
- `content-editor`
- `content-translator`

### Media
- `audio-transcriber`
- `image-generator`
- `video-processor`
- `voice-synthesizer`

### Communication
- `sms-sender`
- `email-sender`
- `email-drafter`
- `notification-sender`

### Data
- `data-analyzer`
- `data-extractor`
- `data-formatter`
- `web-scraper`

### Research
- `web-researcher`
- `competitor-analyzer`
- `market-scanner`

### Code
- `code-reviewer`
- `code-generator`
- `test-writer`

## Qualifiers (optional)

Add specificity when needed:

```
audio-transcriber-meeting     # For meeting recordings
image-generator-thumbnail     # For thumbnails
email-sender-marketing        # For marketing emails
sms-sender-otp               # For OTP codes
```

## At Scale (3M+ agents)

This taxonomy enables:

1. **Grouping** — All `audio-*` agents together
2. **Search** — Find all `*-sender` agents
3. **Analytics** — "How many transcription calls across all workspaces?"
4. **Billing** — Category-based pricing possible
5. **Recommendations** — "Users with `audio-transcriber` often add `content-writer`"

## Anti-patterns

❌ `my-agent` — Not descriptive
❌ `test-agent` — Not production-ready
❌ `agent-1` — No meaning
❌ `gpt4-turbo-agent` — Model-specific
❌ `johns-transcriber` — User-specific (workspace handles ownership)

## Implementation

When spawning subagent:
```
X-APIClaw-Subagent: audio-transcriber
```

APIClaw auto-creates entry with this ID. No manual registration needed.

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
