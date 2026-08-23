// Usage: node scripts/ws-route-shot.mjs <integrations|chains> <signedout|fixtures> [outdir]
// Screenshots a standalone workspace route at 1440 + 390. "fixtures" stubs the
// browser-session endpoint and Convex so the signed-in state renders without a real account.
import puppeteer from 'puppeteer-core';
const [route = 'integrations', mode = 'fixtures', out = '/private/tmp/claude-501/-Users-gustavhemmingsson-vaults/819b3b94-545f-4f24-b31c-09021d13f818/scratchpad/shots'] = process.argv.slice(2);
const NOW = Date.now(); const M = 60_000; const D = 24 * 60 * M;
const chainId = 'jd7f3k2m9x1p4q8r6s0t5u2v';
const fx = {
  'workspaces:getWorkspaceDashboard': { workspace: { id: 'ws_1', email: 'dev@apiclaw.cloud', workspaceName: 'Dev workspace', tier: 'pro', status: 'active', usageCount: 120, usageLimit: 1000, usageRemaining: 880, usagePercentage: 12, createdAt: NOW - 30 * D } },
  'mcpOAuth:listConnectors': [
    { clientId: 'mcp_c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6', name: 'Grok', redirectUris: ['https://grok.com/connectors-oauth/callback'], registrationKind: 'dashboard', clientSecretPrefix: 'sec_7f3a', createdAt: NOW - 9 * D, lastUsedAt: NOW - 2 * D },
    { clientId: 'mcp_9f8e7d6c5b4a39281706f5e4d3c2b1a0', name: 'Cursor (auto-registered)', redirectUris: ['cursor://oauth/callback', 'http://localhost:3000/callback'], registrationKind: 'dynamic', clientSecretPrefix: null, createdAt: NOW - 1 * D, lastUsedAt: null },
  ],
  'chains:getChainStatsAuth': { total: 14, completed: 11, failed: 2, running: 1, paused: 0, successRate: 79, totalCostCents: 312, totalLatencyMs: 90000, totalSteps: 41 },
  'chains:getChainExecutions': (a) => [
    { _id: chainId, status: 'failed', currentStep: 2, stepsCount: 3, totalCostCents: 42, totalLatencyMs: 3800, error: { stepId: 'send', code: 'UPSTREAM_500', message: 'Resend returned 500' }, canResume: true, createdAt: NOW - 12 * M, startedAt: NOW - 12 * M, completedAt: NOW - 11 * M },
    { _id: 'jd7aaaaaaaaaaaaaaaaaaaaaa', status: 'completed', currentStep: 3, stepsCount: 3, totalCostCents: 18, totalLatencyMs: 1200, createdAt: NOW - 3 * 60 * M, startedAt: NOW - 3 * 60 * M, completedAt: NOW - 3 * 60 * M + 1200 },
    { _id: 'jd7bbbbbbbbbbbbbbbbbbbbbb', status: 'running', currentStep: 1, stepsCount: 2, totalCostCents: 0, totalLatencyMs: 0, createdAt: NOW - 2 * M, startedAt: NOW - 2 * M },
  ].filter((c) => !a.status || a.status === 'all' || c.status === a.status),
  'chains:getChainTraceAuth': {
    chain: { _id: chainId, status: 'failed', currentStep: 2, steps: [{ id: 'generate', provider: 'openai', action: 'chat', params: { prompt: 'Write a greeting' } }, { id: 'translate', provider: 'deepl', action: 'translate', params: { text: '$generate.text', lang: 'sv' } }, { id: 'send', provider: 'resend', action: 'send', params: { to: 'a@b.se', body: '$translate.text' } }], results: {}, error: { stepId: 'send', code: 'UPSTREAM_500', message: 'Resend returned 500' }, canResume: true, totalCostCents: 42, totalLatencyMs: 3800, createdAt: NOW - 12 * M, startedAt: NOW - 12 * M, completedAt: NOW - 11 * M },
    executions: [
      { _id: 'e1', stepId: 'generate', stepIndex: 0, status: 'completed', input: { prompt: 'Write a greeting' }, output: { text: 'Hello there' }, latencyMs: 1500, costCents: 30, createdAt: NOW - 12 * M, startedAt: NOW - 12 * M, completedAt: NOW - 12 * M + 1500 },
      { _id: 'e2', stepId: 'translate', stepIndex: 1, status: 'completed', input: { text: '$generate.text', lang: 'sv' }, output: { text: 'Hej där' }, latencyMs: 800, costCents: 12, parallelGroup: 'g1', createdAt: NOW - 12 * M, startedAt: NOW - 12 * M + 1500, completedAt: NOW - 12 * M + 2300 },
      { _id: 'e3', stepId: 'send', stepIndex: 2, status: 'failed', input: { to: 'a@b.se', body: '$translate.text' }, latencyMs: 1500, costCents: 0, error: { code: 'UPSTREAM_500', message: 'Resend returned 500', retryCount: 2 }, parallelGroup: 'g1', createdAt: NOW - 12 * M, startedAt: NOW - 12 * M + 2300, completedAt: NOW - 12 * M + 3800 },
    ],
    tokensSaved: 400,
  },
};
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: m, hasTouch: m });
  // Middleware only checks that a cookie exists (see report), so a placeholder passes the gate.
  await p.setCookie({ name: 'apiclaw_workspace_session', value: 'placeholder-cookie-for-local-shots-000000', domain: 'localhost', path: '/' });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 140))); p.on('console', (x) => { if (x.type() === 'error') errs.push(x.text().slice(0, 140)); });
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/workspace-auth/session')) {
      if (mode === 'signedout') return req.respond({ status: 401, contentType: 'application/json', body: '{}' });
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ browserToken: 'fixture-browser-token-00000000000000000000', browserExpiresAt: NOW + 60 * M }) });
    }
    if (url.includes('.convex.cloud/api/')) {
      let path = ''; let args = {};
      try { const body = JSON.parse(req.postData() || '{}'); path = body.path; args = body.args || {}; } catch {}
      const hit = fx[path]; const value = typeof hit === 'function' ? hit(args) : hit;
      return req.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify({ status: 'success', value: value === undefined ? null : value }) });
    }
    return req.continue();
  });
  await p.goto(`http://localhost:3777/workspace/${route}`, { waitUntil: mode === 'signedout' ? 'domcontentloaded' : 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  if (mode === 'fixtures' && route === 'chains') {
    await p.evaluate((id) => { const b = [...document.querySelectorAll('button')].find((el) => (el.textContent || '').includes(id)); b?.click(); }, chainId);
    await new Promise((r) => setTimeout(r, 800));
    await p.evaluate(() => { const b = [...document.querySelectorAll('button[aria-expanded]')].find((el) => (el.textContent || '').includes('send')); b?.click(); });
    await new Promise((r) => setTimeout(r, 500));
  }
  const mtr = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.documentElement.scrollHeight, url: location.href }));
  const f = `${out}/route-${route}-${mode}-${w}.png`; await p.screenshot({ path: f, fullPage: true });
  console.log(route, mode, w, 'overflow:' + (mtr.sw > mtr.iw), 'h:' + mtr.h, 'url:' + mtr.url, 'errors:' + errs.length, errs.slice(0, 3).join(' | '), f);
  await p.close();
}
await b.close();
