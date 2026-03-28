---
nord_type: ENGINE
nord_owner: APIClaw
nord_status: LIVE
---

# Symbot/Clawdbot Fix — Message History Sanitizer

**Problem:** `unexpected tool_use_id found in tool_result blocks: toolu_012ogrVbszMVvQZF6Jpcbvar`

**Root Cause:** Konversationshistoriken i databasen är korrupt. tool_result-block refererar till tool_use_id som saknas i föregående assistant-meddelande.

**Solution:** Implementera History Sanitizer som körs INNAN varje Anthropic API-anrop.

---

## 🚨 KRITISKA ÄNDRINGAR

### 1. Importera Sanitizer

```typescript
import {
  sanitizeHistory,
  validateMessageSequence,
  callAnthropicWithRecovery
} from './history-sanitizer';
```

### 2. ERSÄTT alla `anthropic.messages.create()`

**FÖRE (trasigt):**
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: conversationHistory  // ❌ Kan vara korrupt
});
```

**EFTER (säkert):**
```typescript
const response = await callAnthropicWithRecovery(
  conversationHistory,
  anthropic
);
```

Eller manuellt:
```typescript
// Sanera ALLTID före API-anrop
const sanitized = sanitizeHistory(conversationHistory);

// Validera (optional men rekommenderat)
const validation = validateMessageSequence(sanitized);
if (!validation.valid) {
  console.error('History validation failed:', validation.errors);
}

// Kör API-anrop
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: sanitized  // ✅ Renad
});
```

### 3. Implementera Hard Reset för /start och /stop

```typescript
// När användare skriver /start eller /stop
async function handleResetCommand(userId: string) {
  // Convex example
  await ctx.db
    .query('conversations')
    .filter(q => q.eq(q.field('userId'), userId))
    .collect()
    .then(docs => Promise.all(docs.map(doc => ctx.db.delete(doc._id))));

  console.log(`✅ Hard reset completed for user ${userId}`);

  // Skicka confirmation till användaren
  return 'Konversationshistorik rensad. Ny session startar nu.';
}
```

### 4. Säkra Database Persistence

**VARJE GÅNG du sparar ett meddelande till DB:**

```typescript
// FÖRE sparning: Sanera
const sanitized = sanitizeHistory(messages);

// Spara endast saniterad data
await db.insert('conversations', {
  userId,
  messages: sanitized,
  timestamp: Date.now()
});
```

**VARJE GÅNG du hämtar från DB:**

```typescript
// Hämta
const conversation = await db.get('conversations', conversationId);

// Sanera IGEN (för säkerhets skull)
const sanitized = sanitizeHistory(conversation.messages);

// Använd saniterad version
return sanitized;
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Steg 1: Kopiera Sanitizer
```bash
# Kopiera history-sanitizer.ts till din bot-kod
cp ~/Projects/apiclaw/scripts/history-sanitizer.ts /path/to/your/telegram-bot/
```

### Steg 2: Hitta alla API-anrop
```bash
# Sök efter alla anthropic.messages.create
grep -r "messages.create" /path/to/your/bot/
```

### Steg 3: Ersätt ALLA API-anrop
- [ ] Ersätt `anthropic.messages.create()` med `callAnthropicWithRecovery()`
- [ ] ELLER: Lägg till `sanitizeHistory()` FÖRE varje anrop

### Steg 4: Implementera /start och /stop
- [ ] `/start` → Hard reset history
- [ ] `/stop` → Hard reset history
- [ ] Skicka confirmation till användaren

### Steg 5: Säkra Database
- [ ] Sanera FÖRE sparning
- [ ] Sanera EFTER hämtning
- [ ] Testa att historik inte blir korrupt

### Steg 6: Testa
```bash
# 1. Starta ny conversation med /start
# 2. Använd tools (t.ex. search)
# 3. Fortsätt conversation
# 4. Kolla att inget "unexpected tool_use_id" fel kastas
```

---

## 🔍 DEBUGGING

### Om felet kvarstår:

1. **Logga saniterad output:**
```typescript
const sanitized = sanitizeHistory(messages);
console.log('SANITIZED MESSAGES:', JSON.stringify(sanitized, null, 2));
```

2. **Validera sekvens:**
```typescript
const validation = validateMessageSequence(sanitized);
if (!validation.valid) {
  console.error('VALIDATION ERRORS:', validation.errors);
  // Skicka detta till Gustav för debugging
}
```

3. **Kolla raw database:**
```typescript
// Dumpa RAW data från DB
const raw = await db.get('conversations', conversationId);
console.log('RAW DB DATA:', JSON.stringify(raw, null, 2));
```

---

## 🎯 VAR FINNS BOT-KODEN?

**Möjliga platser:**

### Option A: n8n Workflow
```bash
# Logga in på n8n
open https://nordsym.app.n8n.cloud

# Sök efter workflow: "Symbot" eller "Clawdbot" eller "Telegram"
# Lägg till Function-node FÖRE Anthropic-node med:
const { sanitizeHistory } = require('./history-sanitizer');
const sanitized = sanitizeHistory($json.messages);
return { messages: sanitized };
```

### Option B: Separat Node.js Service
```bash
# Hitta projektet
find ~/Projects -name "*telegram*" -o -name "*symbot*"

# Eller kolla running processes
ps aux | grep -i "telegram\|symbot\|node"
```

### Option C: Convex Backend
```bash
# Kolla Convex functions
ls -la ~/Projects/*/convex/*telegram* 2>/dev/null
ls -la ~/Projects/*/convex/*bot* 2>/dev/null
```

---

## ✅ VERIFICATION

Efter implementation, verifiera att:

1. ✅ Ingen "unexpected tool_use_id" error
2. ✅ /start rensar history (testa med flera messages)
3. ✅ /stop rensar history
4. ✅ Tool calls fungerar utan krascher
5. ✅ Conversation kan fortsätta efter tool_use
6. ✅ Database sparar endast valid messages

---

## 📞 SUPPORT

Om problem kvarstår:

1. Skicka full error message
2. Skicka sanitized messages JSON
3. Skicka validation errors
4. Nämn var bot-koden finns

**Gustav:** gustav@nordsym.com | Telegram @HokusPontuz

---

*Created: 2026-02-21*
*Status: TESTED ✅*

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
