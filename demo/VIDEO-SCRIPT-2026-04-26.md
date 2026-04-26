# APIClaw — Demo Video Script v2

**Two cuts from one shoot:**
- **Landing cut:** 2:00 hard. Anchored on the home page demo.
- **Partner cut:** 3:00 hard. Same first 2:00, plus a final beat tailored for any specific partner share.

**Hook:** Pain → resolution. Same prompt, three doors, one finishes in 1.4s.

**Recorded:** 2026-04-26 (target).

---

## DO NOT BURN A REAL WORKSPACE ON CAMERA

Don't sign in as `gustav@nordsym.com`. That account has 3,000+ calls and is canonical.

For a clean first-time feel, do one of:
- **Anonymous mode (recommended).** Skip signup. The MCP path works for 50 free calls — plenty for a demo. Fresh `npx` cache + fresh Claude Desktop install = clean.
- **Throwaway alias.** Register `apiclaw-demo@nordsym.com` on camera. After the shoot, leave it.

---

## Pre-flight (5 min before recording)

```bash
# 1. Fresh npx cache
rm -rf ~/.npm/_npx/*/node_modules/@nordsym 2>/dev/null

# 2. Fresh Claude Desktop state — quit, clear MCP, relaunch
osascript -e 'quit app "Claude"' && sleep 2 && open -a "Claude"

# 3. Terminal
#    Font 18pt minimum. Light theme (matches APIClaw landing).
#    Window: 110 cols × 28 rows. Cmd+K to clear.

# 4. Browser (separate tabs, all preloaded but not yet visible)
#    https://apiclaw.cloud
#    https://apiclaw.cloud/install
#    https://apiclaw.cloud/workspace
#    https://www.npmjs.com/package/@nordsym/apiclaw

# 5. Three terminal windows arranged side-by-side for Beat 3:
#    LEFT  = Claude Desktop (MCP)
#    MID   = Terminal (CLI)
#    RIGHT = Terminal w/ curl prompt (Workspace Key)

# 6. Recorder — OBS or ScreenFlow
#    1920×1080, 60 fps, separate mic track, cursor highlight on
```

---

## The 7 beats — landing cut (2:00 hard)

### BEAT 1 — HOOK (0:00 – 0:08)

**On screen:** Split-screen. Left: a fresh Claude chat fails on a "find me a flight price" prompt — no API access, hits a wall. Right: same Claude chat with APIClaw, returns the answer in seconds.

**Say:**
> "An AI agent without an API layer hits a wall. With APIClaw, it answers."

**Visual action:** No typing here — both screens are pre-recorded as a 6-second loop. Cut hard between them.

---

### BEAT 2 — INSTALL (0:08 – 0:25)

**On screen:** Browser zoom on `apiclaw.cloud` hero. Cursor hovers over the **"Install for Claude Desktop · .mcpb"** button.

**Type / click in this order:**
1. Click "Install for Claude Desktop". The `.mcpb` downloads.
2. Cut to Finder. Double-click the file. Claude Desktop pops a "Install APIClaw extension?" dialog.
3. Click Install.

**Say:**
> "One file. One double-click. No terminal."

**Visual action:** Hold on the Claude Desktop "APIClaw installed" toast for one beat. Then cut to Beat 3.

---

### BEAT 3 — THREE DOORS QUICKFIRE (0:25 – 1:05)

**On screen:** The three-pane setup from pre-flight, all visible at once.

**Type the same prompt into all three:**

> "What's today's USD to EUR rate?"

- **LEFT (Claude Desktop / MCP):** prompt typed into chat. Claude calls `discover_apis` → `call_api` → returns the rate inline.
- **MID (Terminal / CLI):** type `apiclaw call frankfurter/rate -d '{"from":"USD","to":"EUR"}'` → JSON returns.
- **RIGHT (curl / Workspace Key):** paste a `curl https://api.apiclaw.cloud/v1/call -H "Authorization: Bearer sk-claw-..." ...` → JSON returns.

**Say while it runs:**
> "Three doors. One layer. Use whichever fits your stack — MCP client, terminal, or your own agent calling the gateway. Same APIs, same auth, same logs."

**Visual action:** Let all three responses appear within ~5s of each other. Don't edit out the network ticking.

---

### BEAT 4 — BREADTH (1:05 – 1:30)

**On screen:** Cut to `apiclaw.cloud` Catalog tab. Scroll slowly through the categories.

**Say:**
> "Twenty thousand APIs indexed. Sixteen hundred callable through the gateway. Forty-six managed providers where APIClaw holds the key — OpenRouter, Replicate, ElevenLabs, Brave Search, APILayer, GitHub. Zero config on your side."

**Visual action:** Pause briefly on AI & ML category (largest), then on the managed-provider badges. Don't read the numbers — let them appear in the overlay.

---

### BEAT 5 — SAFETY (1:30 – 1:48)

**On screen:** Scroll on the landing to the "See the Difference" section. Let the racing clock animation play — APIClaw side finishes at 1.4s while the manual side ticks past 47 minutes.

**Say:**
> "Every call goes through one endpoint with SSRF guards, circuit breakers, and full request logging. Provider failures isolated. Costs tagged per workspace. Full audit trail."

**Visual action:** The clock IS the visual. Don't talk over the moment when the APIClaw side hits "Done".

---

### BEAT 6 — CTA (1:48 – 2:00)

**On screen:** Hero of `apiclaw.cloud` — the two CTA buttons in frame: **"Install for Claude Desktop"** and **"Get a workspace key"**.

**Say:**
> "Install for Claude Desktop in one click. Or skip install — get a workspace key and call the gateway from any language. apiclaw.cloud."

**Visual action:** Hold on the URL for two seconds. End card: APIClaw logo, `apiclaw.cloud`, tagline **"The API layer for AI agents."**

---

## Partner cut — replace Beat 6 with this (2:00 → 3:00)

This is the only change from the landing cut. For an APILayer share, a Hermes share, an OpenClaw share — anyone you want to spotlight — swap in their context here.

### BEAT 6P — PARTNER (1:48 – 2:35)

**On screen:** Back to Claude Desktop, fresh prompt.

**Type into Claude:**
> "Use APILayer to look up the current weather in Stockholm."

(Or substitute the partner's most representative API.)

**Say:**
> "[Partner name]'s catalog ships first-class through APIClaw. Any agent in the ecosystem can hit them — no signup, no keys."

**Visual action:** Claude calls discover_apis → matches APILayer → call_api → returns weather. Provider badge briefly shows the partner name.

### BEAT 7P — CTA (2:35 – 3:00)

Same as landing Beat 6 with one line added:
> "Install for Claude Desktop in one click. Or skip install — get a workspace key and call the gateway from any language. **APIClaw is the layer. [Partner] is one of the doors that opens.** apiclaw.cloud."

---

## Captions / on-screen overlays (burn in during edit)

| Beat | Overlay |
|---|---|
| 1 | `Without an API layer · with APIClaw` |
| 2 | `apiclaw.mcpb · double-click to install` |
| 3 | `MCP · CLI · Workspace Key` |
| 4 | `20,386 indexed · 1,650+ callable · 46 managed` |
| 5 | `1.4s end to end · still going` |
| 6 | `apiclaw.cloud` |

Numbers are pulled from `/api/stats` so they'll stay current. If you re-record, double-check the current numbers before burning the overlay.

---

## Backup prompts (if a call fails twice)

- **MCP / EUR rate fails →** "Search the web for 'latest SpaceX launch'" (Brave Search, always up).
- **CLI / frankfurter fails →** `apiclaw call brave/search -d '{"q":"sek to usd"}'`
- **curl / workspace fails →** swap the body to a `replicate` echo call (fast, deterministic).

If two backups fail, stop and check `/api/health`. Don't ship a video where the gateway looks broken.

---

## Recording tips

- **Font size:** 18–20pt terminal, 120% Claude Desktop zoom.
- **Scroll slowly.** 2 seconds per non-trivial visual minimum.
- **Don't edit out the thinking.** Claude's "I'll search…" → "Calling…" → "Got it" is the demo. Let it breathe.
- **Two takes max per beat.** Shipping energy is the message.

---

## Post-production (15 min)

1. Trim each beat to its ceiling (Beat 3 is the budget — runs hot).
2. Burn in overlays from the table above.
3. APIClaw end-card from `landing/public/logo.svg`.
4. Export:
   - **Landing version:** 1920×1080 MP4, H.264, 8 Mbps → `landing/public/demo.mp4`. Replaces current.
   - **Partner version:** 1920×1080 MP4 + 1:1 square crop for X. Drop in `demo/exports/`.

---

## Ship

```bash
mv ~/Downloads/apiclaw-demo-2026-04-26.mp4 \
   /Users/gustavhemmingsson/Projects/apiclaw/landing/public/demo.mp4

cd /Users/gustavhemmingsson/Projects/apiclaw/landing && npx vercel --prod
```

GitHub auto-deploy is not active. Manual deploy after push.

---

**Read the beats. Shoot in order. The race clock is the moment — don't talk over it.**
