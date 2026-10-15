/* Mount the real wizard and first-call component in isolated bundled Chromium.
 * The server publishes activation before releasing the NASA response body. */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { buildSync } = require('esbuild');
const { chromium } = require('playwright');

(async () => {
  const root = process.cwd(), temp = mkdtempSync(path.join(tmpdir(), 'apiclaw-onboarding-race-'));
  let browser, activated = false, completed = false, activatedReads = 0, completions = 0, nasaRequests = 0, pendingResponse;
  const server = createServer(async (req, res) => {
    if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(readFileSync(path.join(temp, 'fixture.js'))); }
    if (req.method === 'POST') {
      let text = ''; for await (const chunk of req) text += chunk;
      const body = JSON.parse(text);
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/execute') {
        assert.equal(req.headers['x-apiclaw-session'], 'onboarding-fixture-session');
        assert.deepEqual(body, { provider: 'nasa', action: 'apod', params: {} });
        nasaRequests++; activated = true; pendingResponse = res;
        return; // Backend has recorded success, but the browser still awaits its body.
      }
      assert.equal(body.args.token, 'onboarding-fixture-session');
      if (body.path === 'onboarding:getState') {
        if (activated) activatedReads++;
        return res.end(JSON.stringify({ status: 'success', value: { firstCallAt: activated ? 12345 : null, completedAt: completed ? 23456 : null, dismissedAt: null } }));
      }
      assert.equal(body.path, 'onboarding:complete');
      completed = true; completions++;
      return res.end(JSON.stringify({ status: 'success', value: null }));
    }
    res.setHeader('Content-Type', 'text/html'); res.end('<div id="root"></div><script src="/fixture.js"></script>');
  });
  const waitFor = async (predicate) => {
    const deadline = Date.now() + 10000;
    while (!predicate()) { assert.ok(Date.now() < deadline, 'controlled server condition timed out'); await new Promise(resolve => setTimeout(resolve, 25)); }
  };
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const fixture = path.join(temp, 'entry.tsx');
    writeFileSync(fixture, `import {createRoot} from 'react-dom/client';import {OnboardingWizard} from ${JSON.stringify('@/components/OnboardingWizard')};createRoot(document.getElementById('root')).render(<OnboardingWizard sessionToken="onboarding-fixture-session" arrival={location.pathname==='/agent'?'cli':undefined}/>);`);
    const analytics = path.join(temp, 'analytics.js'); writeFileSync(analytics, 'export default {capture(){}};');
    const baseline = process.env.APICLAW_TEST_BASELINE === '1';
    const overrides = {};
    if (baseline) for (const name of ['OnboardingWizard', 'FirstWebCall']) {
      const relative = `landing/src/components/${name}.tsx`, target = path.join(temp, `${name}.tsx`);
      writeFileSync(target, execFileSync('git', ['show', `HEAD:${relative}`], { cwd: root }));
      overrides[`@/components/${name}`] = target;
    }
    buildSync({ entryPoints: [fixture], bundle: true, outfile: path.join(temp, 'fixture.js'), platform: 'browser', jsx: 'automatic', nodePaths: [path.join(root, 'landing/node_modules')], tsconfig: path.join(root, 'landing/tsconfig.json'), alias: { 'posthog-js': analytics, ...overrides }, define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL': JSON.stringify(origin), 'process.env.NEXT_PUBLIC_CONVEX_URL': JSON.stringify(origin) } });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(origin);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Try NASA free', exact: true }).click();
    await waitFor(() => activatedReads > 0);
    await page.waitForTimeout(1200); // More than the existing 900ms auto-dismiss delay.
    assert.equal(await dialog.count(), 1, 'activation polling must not dismiss an in-flight human call');
    await dialog.getByText('Waiting for NASA’s response…').waitFor();
    assert.equal(completions, 0, 'polling must not complete the human flow ahead of its result');
    pendingResponse.end(JSON.stringify({ success: true, data: { title: 'Controlled delayed NASA result', date: '2026-10-15' } }));
    pendingResponse = null;
    await dialog.getByText(/NASA APOD: Controlled delayed NASA result/).waitFor();
    await page.waitForTimeout(2200); // Another polling tick must preserve the delivered result.
    assert.equal(await dialog.count(), 1, 'local success must remain until explicit Open workspace');
    assert.equal(completions, 0);
    await dialog.getByRole('button', { name: 'Open workspace', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    assert.equal(completions, 1);
    assert.equal(nasaRequests, 1);
    await page.close();

    // An external agent call must retain the existing automatic completion.
    activated = false; completed = false; activatedReads = 0; completions = 0;
    const agentPage = await browser.newPage();
    await agentPage.goto(`${origin}/agent`);
    await agentPage.getByRole('dialog').waitFor();
    activated = true;
    await waitFor(() => activatedReads > 0);
    await agentPage.getByRole('dialog').waitFor({ state: 'detached' });
    assert.equal(completions, 1);
    assert.equal(nasaRequests, 1, 'agent completion must not dispatch a browser call');
    console.log('onboarding race browser passed: pending response survives activation poll, local result awaits explicit action, agent/CLI auto-completion preserved');
  } finally {
    if (pendingResponse) pendingResponse.end('{}');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
