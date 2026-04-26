# APIClaw Demo — Read-Aloud Manuscript

**Read top to bottom. Each bold line is what you say. Italic lines in brackets are stage directions. Total: 2 minutes hard.**

**Numbers locked:** 26,000+ indexed · 1,650+ callable · 25 calls/month free · `.mcpb` install · anonymous mode closed.

**Pre-flight:** Claude Desktop quit + relaunched. `.mcpb` pre-downloaded to Desktop. You ran `apiclaw login` recently so your session at `~/.apiclaw/session` is valid (test by typing the Beat 3 prompt in a scratch chat — if you get a real answer, you're good). Three browser tabs preloaded.

---

## BEAT 1 — HOOK (0:00 → 0:08)

*[Split-screen pre-roll loop already running. Left: agent failing. Right: agent answering through APIClaw. Don't talk over the first second.]*

**"An AI agent without an API layer hits a wall."**

*[1 second pause — let the left side stall visibly]*

**"With APIClaw, it answers."**

*[Cut hard to the right side. Hold for 1 second. Cue Beat 2.]*

---

## BEAT 2 — INSTALL (0:08 → 0:30)

*[On screen: browser at apiclaw.cloud. Cursor moves to the "Install for Claude Desktop" button.]*

**"One file."**

*[Click "Install for Claude Desktop". Brief download animation.]*

**"One double-click."**

*[Cut to Finder. Double-click `apiclaw.mcpb`. Claude Desktop opens its extension dialog with the lobster icon, the description, and the tools list.]*

**"That's the install."**

*[Click Install. Don't touch the optional API Key field — leave it empty. Hold on the "APIClaw installed" toast for 1 second.]*

*[Note: your session is already set up locally from a previous `apiclaw login`, so calls in Beat 3 will succeed. New viewers who follow along will sign up at apiclaw.cloud/workspace after their first 401 nudge — that's the honest path.]*

---

## BEAT 3 — THE PROMPT (0:30 → 1:10)

*[On screen: Claude Desktop, fresh chat. You're about to type the prompt.]*

**"I'll ask Claude one question."**

*[Type the prompt. Don't say it aloud yet — let the typing land.]*

> What's happening in tech right now?

*[Hit enter. Watch Claude call discover_apis, then call_api in parallel. Don't talk over the tool calls — let the viewer see them.]*

**"APIClaw discovered the right APIs, called them, synthesized the answer."**

*[Result panel appears with three headlines + sources.]*

**"No keys configured anywhere on this machine. APIClaw holds them server-side."**

*[Hold on the answer for 2 seconds.]*

---

## BEAT 4 — THREE DOORS (1:10 → 1:35)

*[Cut to apiclaw.cloud. Scroll to the "Three doors · one layer" section. The MCP / CLI / Workspace Key tabs are visible and auto-rotating.]*

**"What you just saw is one of three doors."**

*[Pause on the MCP tab — already highlighted.]*

**"MCP for Claude Desktop and Cursor. CLI for terminals and CI."**

*[The auto-rotate moves to CLI, then to Workspace Key. Slow cursor-hover so it pauses on Workspace Key.]*

**"Or a workspace key — for your own agent calling our gateway over HTTP."**

*[Workspace Key tab visible with the curl + Bearer sk-claw- example.]*

**"Same gateway. Same auth. Same logs. You pick the door."**

---

## BEAT 5 — THE WALL (1:35 → 1:50)

*[Scroll to the "See the Difference" section. Racing clock animation is mid-loop.]*

**"Doing this without APIClaw is real work."**

*[Camera holds on the manual side ticking past minute 20.]*

**"Different APIs. Separate signups. Separate keys. Billing for each."**

*[The APIClaw side hits "Done · 1.4s". Don't talk during that beat. Let the clock land.]*

*[1 second of silence — the clock IS the punchline.]*

**"Our side finishes the same task in 1.4 seconds. The other side is still going."**

---

## BEAT 6 — CTA (1:50 → 2:00)

*[Scroll back up to the apiclaw.cloud hero. The two CTA buttons are in frame: "Install for Claude Desktop" and "Get a workspace key".]*

**"Free for 25 calls a month. No card."**

*[Beat — let the buttons stay on screen.]*

**"apiclaw.cloud."**

*[End card animates in: APIClaw logo, the URL, tagline "The API layer for AI agents." Hold 2 seconds. Cut.]*

---

## Backup lines (use these only if Beat 3 fails twice)

If the news prompt times out, retype:

> What's the current EUR to USD rate?

**"Same idea — APIClaw discovers the right exchange-rate API, calls it, returns the rate."**

If that also fails:

> Search the web for 'latest SpaceX launch'.

**"Brave Search through APIClaw. Always up."**

---

## Don't say on camera

- "BYOK" or "Bring Your Own Key" — wrong framing.
- "Dashboard" — say "workspace".
- The word "anonymous" — it's closed, no need to mention.
- Specific managed-provider count — name them by brand instead.
- "Twilio", "46elks", "Resend" — those are internal infrastructure, not advertised.

---

## After you stop recording

1. Move the file: `mv ~/Downloads/apiclaw-demo-2026-04-26.mp4 ~/Projects/apiclaw/landing/public/demo.mp4`
2. Deploy: `cd ~/Projects/apiclaw/landing && npx vercel --prod`
3. Verify on `apiclaw.cloud` that the new demo plays.

You've got this. Read each bold line. Let the visuals breathe. The lobster icon shot is the product.
