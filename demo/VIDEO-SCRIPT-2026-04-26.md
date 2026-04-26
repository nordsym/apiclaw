# APIClaw — Demo Video Script v3

**Two cuts from one shoot:**
- **Landing cut:** 2:00 hard. Anchored on the home page demo.
- **Partner cut:** 3:00 hard. Same first 2:00, plus a final beat tailored for any specific partner share.

**Hook:** Pain → resolution. One file, one double-click, agent has the API layer.

**Recorded:** 2026-04-26 (target).

**Anchor change since v2:** the install beat now leads with the **`.mcpb` double-click** — it's the cleanest path on camera and the one most viewers can actually replicate without a terminal. Terminal install is a secondary mention only if there's room.

---

## Locked facts at recording time

Lock these on the overlay deck and in voiceover. Re-pull from `/api/stats` before shooting:

- Indexed APIs: **26,000+**
- Callable through APIClaw: **1,650+**
- Managed providers (APIClaw holds the keys): **mid-teens**, growing. Don't pin a number on camera. Say "OpenRouter, Replicate, ElevenLabs, Brave Search, APILayer, GitHub" by name.
- Free tier: **25 API calls per month**, email signup, no card.
- Anonymous mode: **closed**. Calls require a workspace.
- npm package version: 2.5.5 (or whatever's current at shoot time).

---

## DO NOT BURN A REAL WORKSPACE ON CAMERA

Don't sign in as `gustav@nordsym.com`. That account has thousands of calls and is canonical.

For the shoot, register `apiclaw-demo@nordsym.com` (or similar throwaway) at `apiclaw.cloud/workspace` before recording. After signup, paste the resulting `sk-claw-…` into the Claude Desktop install dialog when the .mcpb opens.

---

## Pre-flight (5 min before recording)

```bash
# 1. Fresh Claude Desktop state — quit, clear MCP, relaunch
osascript -e 'quit app "Claude"' && sleep 2 && open -a "Claude"

# 2. Browser
#    Open in separate tabs, all preloaded but not yet visible:
#      https://apiclaw.cloud
#      https://apiclaw.cloud/workspace
#      https://apiclaw.cloud/install
#    Have the .mcpb file pre-downloaded so the click-to-install
#    moment is one Finder action, not a fresh download mid-shot.

# 3. Demo workspace
#    Already signed up? sk-claw-... in your password manager.
#    If not, sign up live during Beat 2.

# 4. Recorder — OBS or ScreenFlow
#    1920×1080, 60 fps, separate mic track, cursor highlight on,
#    light theme matches the APIClaw brand.
```

---

## The 6 beats — landing cut (2:00 hard)

### BEAT 1 — HOOK (0:00 – 0:08)

**On screen:** Split-screen. Left: Claude Desktop chat saying "I can't access live APIs to answer that." Right: same prompt with APIClaw installed, calling /v1/discover → /v1/call → returning a real answer in a couple of seconds.

**Say:**
> "An AI agent without an API layer hits a wall. With APIClaw, it answers."

**Visual action:** No typing. Pre-recorded 6-second loop. Cut hard between the two states.

---

### BEAT 2 — THE INSTALL (0:08 – 0:30)

**On screen:** Browser zoom on `apiclaw.cloud` hero. Cursor moves to **Install for Claude Desktop** button.

**Action sequence:**
1. Click **Install for Claude Desktop**. The `.mcpb` downloads.
2. Cut to Finder. Double-click `apiclaw.mcpb`. Claude Desktop opens its extension install dialog with the lobster icon, the description, and the tools list.
3. The Workspace API Key field is visible but optional. Paste your throwaway `sk-claw-…` key and click Install.
4. Brief cut to the toast: "APIClaw installed".

**Say:**
> "One file. One double-click. Paste a free workspace key and you're in."

**Visual action:** Hold on the install dialog for ~2 seconds so viewers can read the lobster icon, the tool count, and the optional key field. Don't rush past it — that screen is the product.

---

### BEAT 3 — THE PROMPT (0:30 – 1:10)

**On screen:** Claude Desktop, fresh chat.

**Type:**
> What's happening in tech right now?

**Visual action:** Watch Claude call `discover_apis` for news, match Brave Search and Firecrawl, then `call_api` twice in parallel. Synthesize three current headlines with sources. Don't edit the thinking — the tool-call sequence IS the demo.

**Say while it runs:**
> "I asked one question. APIClaw discovered the right APIs, called them, synthesized the answer. No keys configured anywhere on this machine — APIClaw holds them server-side."

**Result:** Claude returns three real headlines with citations.

---

### BEAT 4 — THREE DOORS (1:10 – 1:35)

**On screen:** Cut to `apiclaw.cloud`, scroll to the **Three doors · one layer** install section. The MCP / CLI / Workspace Key tabs visible. Hover-rotate through each so the code preview cycles.

**Say:**
> "What you just saw is one of three doors. Same gateway, three ways in. MCP for Claude Desktop and Cursor. CLI for terminals and CI. A workspace key for your own agent calling our gateway over HTTP. One signup, one workspace, you pick the door."

**Visual action:** Pause briefly on the Workspace Key tab so viewers see the curl example with `Authorization: Bearer sk-claw-…`.

---

### BEAT 5 — THE WALL (1:35 – 1:50)

**On screen:** Scroll to **See the Difference**. Let the racing clock animation run.

**Say:**
> "Doing this without APIClaw is real work. Different APIs, separate signups, separate keys, billing for each. Our side finishes the same task in 1.4 seconds. The other side is still going."

**Visual action:** The clock IS the visual. Don't talk over the moment when the APIClaw side hits "Done".

---

### BEAT 6 — CTA (1:50 – 2:00)

**On screen:** Hero of `apiclaw.cloud`. Two CTAs in frame: **Install for Claude Desktop** and **Get a workspace key**.

**Say:**
> "Free for 25 calls a month. No card. apiclaw.cloud."

**Visual action:** Hold on the URL for two seconds. End card: APIClaw logo, `apiclaw.cloud`, tagline **"The API layer for AI agents."**

---

## Partner cut — replace Beat 6 with this (1:50 → 3:00)

Same first five beats. Add a Beat 6P that swaps in the partner's catalog before the CTA.

### BEAT 6P — PARTNER (1:50 – 2:35)

**On screen:** Back to Claude Desktop. New prompt.

**Type:**
> Use [Partner]'s catalog through APIClaw to do [their most representative thing].

**Say:**
> "[Partner]'s catalog ships first-class through APIClaw. Any agent in the ecosystem can hit them — no signup with [Partner], no keys, just the prompt."

**Visual action:** Claude calls `discover_apis` → matches the partner's API → `call_api` → returns the result. Provider badge briefly shows the partner name.

### BEAT 7P — CTA (2:35 – 3:00)

Same as landing Beat 6 with one line added:
> "Free for 25 calls a month. No card. **APIClaw is the layer. [Partner] is one of the doors that opens.** apiclaw.cloud."

---

## Captions / on-screen overlays (burn in during edit)

| Beat | Overlay |
|---|---|
| 1 | `Without an API layer · with APIClaw` |
| 2 | `apiclaw.mcpb · double-click to install` |
| 3 | `discover_apis → call_api · zero keys configured` |
| 4 | `MCP · CLI · Workspace Key` |
| 5 | `1.4s end to end · still going` |
| 6 | `apiclaw.cloud · 25 calls/month free` |

Re-pull numbers from `/api/stats` before burning the overlays. If the catalog has grown past 26k or callable past 1,700, update.

---

## Backup prompts (if a call fails twice)

- **Beat 3 fails →** swap the prompt to "What's the current EUR/USD rate?" — hits APILayer's exchangerates, single API call, deterministic.
- **APILayer fails →** "Search the web for 'latest SpaceX launch'" — Brave Search managed, always up.
- **Both fail →** stop and check `/api/health` before continuing. Don't ship a video where the gateway looks broken.

---

## What changed from v2

- **Install path:** `.mcpb` double-click is now the headline, not the terminal. Old v2 led with `npx -y @nordsym/apiclaw` which is fine but less photogenic on camera. Terminal still exists in the script as a backup mention only.
- **Anonymous mode:** removed all "anonymous" / "free 50 calls" framing. The gate is closed. Beat 2 explicitly shows pasting a workspace key during install.
- **Free tier:** 50 → 25 calls per month. Lock this in voiceover and overlay.
- **Three doors:** Beat 4 now exists as its own beat instead of being implied. Mirrors the landing's `Three doors · one layer` section.
- **Numbers:** 20,386 → 26,000+ indexed. 1,679 → 1,650+ callable (round down for safety). Managed provider count not pinned to a number — name them instead.

---

## Recording tips

- **Font size:** 18–20pt terminal, 120% Claude Desktop zoom.
- **Scroll slowly.** 2 seconds per non-trivial visual minimum.
- **Don't edit out the thinking.** Claude's tool-call sequence IS the demo. Let it breathe.
- **Two takes max per beat.** Shipping energy is the message.
- **The lobster icon shot in Beat 2 is the moment.** That's where viewers go from "API tool" to "AI Desktop Extension I can install in one click". Hold it.

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

**Read the beats. Lead with the .mcpb. The lobster icon shot is the product.**
