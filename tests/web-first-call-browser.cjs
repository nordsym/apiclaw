/* Real React rendering in isolated bundled Chromium. Gateway response is controlled;
 * the deployed preview journey separately verifies real NASA and Clerk signup. */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { buildSync } = require('esbuild');
const { chromium } = require('playwright');

(async () => {
  const root = process.cwd(), temp = mkdtempSync(path.join(tmpdir(), 'apiclaw-web-call-'));
  let requests = 0, browser;
  const server = createServer(async (req, res) => {
    if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(readFileSync(path.join(temp, 'fixture.js'))); }
    if (req.url === '/v1/execute') {
      requests++;
      assert.equal(req.headers['x-apiclaw-session'], 'browser-fixture-session');
      assert.ok(req.headers['idempotency-key'].startsWith('web-nasa-'));
      let text = ''; for await (const chunk of req) text += chunk;
      assert.deepEqual(JSON.parse(text), { provider: 'nasa', action: 'apod', params: {} });
      res.setHeader('Content-Type', 'application/json');
      return setTimeout(() => {
        res.statusCode = requests === 1 ? 503 : 200;
        res.end(JSON.stringify(requests === 1 ? { error: 'private upstream stack trace' } : { success: true, data: { title: 'Synthetic NASA picture', date: '2026-10-15', explanation: 'A safe fixture response.' } }));
      }, 300);
    }
    res.setHeader('Content-Type', 'text/html'); res.end('<div id="root"></div><script src="/fixture.js"></script>');
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const fixture = path.join(temp, 'entry.tsx');
    writeFileSync(fixture, `import {createRoot} from 'react-dom/client';import {FirstWebCall} from ${JSON.stringify(path.join(root, 'landing/src/components/FirstWebCall.tsx'))};import {AuthProgress} from ${JSON.stringify(path.join(root, 'landing/src/components/AuthProgress.tsx'))};createRoot(document.getElementById('root')).render(<><FirstWebCall sessionToken="browser-fixture-session"/><AuthProgress><button>Continue with Google</button></AuthProgress></>);`);
    buildSync({ entryPoints: [fixture], bundle: true, outfile: path.join(temp, 'fixture.js'), platform: 'browser', jsx: 'automatic', nodePaths: [path.join(root, 'landing/node_modules')], tsconfig: path.join(root, 'landing/tsconfig.json'), define: { 'process.env.NODE_ENV': '"development"', 'process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL': JSON.stringify(origin), 'process.env.NEXT_PUBLIC_CONVEX_URL': JSON.stringify(origin) } });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on("pageerror", error => console.error("Browser error:", error.message));
    await page.goto(origin);
    await page.getByRole('button', { name: 'Try NASA free', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Waiting for NASA' }).waitFor();
    await page.getByRole('alert').filter({ hasText: 'NASA could not return' }).waitFor();
    assert.equal(await page.getByText('private upstream stack trace').count(), 0);
    await page.getByRole('button', { name: 'Try NASA again' }).click();
    await page.getByRole('heading', { name: 'Synthetic NASA picture' }).waitFor();
    assert.equal(requests, 2);
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await page.getByRole('status').filter({ hasText: 'Opening Google sign-in' }).waitFor();
    console.log('web first-call browser passed: loading, friendly failure, retry, authenticated NASA result, Google feedback');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
