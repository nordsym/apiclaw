/**
 * Tests for ~/.apiclaw.toml read/write helpers.
 * Run: npx tsx src/auth-config.test.ts
 *
 * Uses a temp HOME via mocking — the helpers respect os.homedir() so we
 * temporarily override it via env+setter.
 */
import { strict as assert } from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'apiclaw-test-'));
// os.homedir() on POSIX prefers $HOME if set; on win32 it uses $USERPROFILE.
// Set both BEFORE importing the module so AUTH_CONFIG_PATH resolves under tmp.
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;

let failed = 0;
let passed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(`   ${(err as Error).message}`);
    failed++;
  }
}

async function run() {
  const mod = await import('./auth-config.js');
  const { readAuthConfig, writeAuthConfig, clearAuthConfig, touchAuthConfig, AUTH_CONFIG_PATH } = mod;

  await test('AUTH_CONFIG_PATH resolves under tmp home', () => {
    assert.equal(AUTH_CONFIG_PATH, path.join(tmpHome, '.apiclaw.toml'));
  });

  await test('readAuthConfig returns null when no file exists', () => {
    clearAuthConfig();
    assert.equal(readAuthConfig(), null);
  });

  await test('writeAuthConfig + readAuthConfig roundtrip preserves all fields', () => {
    const now = Date.now();
    writeAuthConfig({
      workspaceId: 'ws_test123',
      email: 'agent@nordsym.com',
      sessionToken: 'st_secret',
      apiKey: 'sk-claw-abc123',
      mcpToken: 'sk-mcp-xyz789',
      createdAt: now,
      lastUsedAt: now,
    });
    const got = readAuthConfig();
    assert(got, 'expected readAuthConfig to return a value');
    assert.equal(got.workspaceId, 'ws_test123');
    assert.equal(got.email, 'agent@nordsym.com');
    assert.equal(got.sessionToken, 'st_secret');
    assert.equal(got.apiKey, 'sk-claw-abc123');
    assert.equal(got.mcpToken, 'sk-mcp-xyz789');
    // Timestamps roundtrip via ISO strings — millisecond-precision tolerated.
    assert(Math.abs(got.createdAt - now) < 1000, 'createdAt should roundtrip within 1s');
  });

  await test('writeAuthConfig sets mode 0o600', () => {
    writeAuthConfig({
      workspaceId: 'ws_perm',
      email: 'p@x.com',
      sessionToken: 'st_perm',
      createdAt: Date.now(),
    });
    const stat = fs.statSync(AUTH_CONFIG_PATH);
    // Mask to permission bits, compare against 0o600.
    assert.equal(stat.mode & 0o777, 0o600);
  });

  await test('writeAuthConfig handles missing optional fields', () => {
    writeAuthConfig({
      workspaceId: 'ws_minimal',
      email: 'm@x.com',
      sessionToken: 'st_minimal',
      createdAt: Date.now(),
    });
    const got = readAuthConfig();
    assert(got);
    assert.equal(got.apiKey, undefined);
    assert.equal(got.mcpToken, undefined);
  });

  await test('touchAuthConfig updates lastUsedAt without losing other fields', async () => {
    const now = Date.now();
    writeAuthConfig({
      workspaceId: 'ws_touch',
      email: 't@x.com',
      sessionToken: 'st_touch',
      apiKey: 'sk-claw-touch',
      createdAt: now,
      lastUsedAt: now - 100000,
    });
    // wait 1.5s so ISO seconds change
    await new Promise((r) => setTimeout(r, 1500));
    touchAuthConfig();
    const got = readAuthConfig();
    assert(got);
    assert.equal(got.workspaceId, 'ws_touch');
    assert.equal(got.apiKey, 'sk-claw-touch');
    assert(got.lastUsedAt && got.lastUsedAt > now - 1000, 'lastUsedAt should be recent');
  });

  await test('clearAuthConfig removes the file', () => {
    writeAuthConfig({
      workspaceId: 'ws_clr',
      email: 'c@x.com',
      sessionToken: 'st_clr',
      createdAt: Date.now(),
    });
    assert(fs.existsSync(AUTH_CONFIG_PATH));
    clearAuthConfig();
    assert(!fs.existsSync(AUTH_CONFIG_PATH));
  });

  await test('readAuthConfig falls back to legacy ~/.apiclaw/session JSON file', () => {
    clearAuthConfig();
    const legacyDir = path.join(tmpHome, '.apiclaw');
    fs.mkdirSync(legacyDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      path.join(legacyDir, 'session'),
      JSON.stringify({
        workspaceId: 'ws_legacy',
        email: 'legacy@x.com',
        sessionToken: 'st_legacy',
        createdAt: 1234567890000,
      }),
      { mode: 0o600 }
    );
    const got = readAuthConfig();
    assert(got, 'legacy fallback should return a value');
    assert.equal(got.workspaceId, 'ws_legacy');
    assert.equal(got.email, 'legacy@x.com');
    // Cleanup
    fs.rmSync(legacyDir, { recursive: true, force: true });
  });

  await test('parseToml handles escaped quotes in values', () => {
    fs.writeFileSync(
      AUTH_CONFIG_PATH,
      `[default]\nworkspace_id = "ws_q"\nemail = "with\\"quote@x.com"\nsession_token = "s\\\\\\\\t"\ncreated_at = "2026-05-18T10:00:00.000Z"\nlast_used_at = "2026-05-18T10:00:00.000Z"\n`,
      { mode: 0o600 }
    );
    const got = readAuthConfig();
    assert(got);
    assert.equal(got.email, 'with"quote@x.com');
  });

  await test('readAuthConfig returns null for malformed TOML missing required fields', () => {
    clearAuthConfig();
    fs.writeFileSync(AUTH_CONFIG_PATH, `[default]\nemail = "only@x.com"\n`, { mode: 0o600 });
    assert.equal(readAuthConfig(), null);
  });

  // Cleanup
  fs.rmSync(tmpHome, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
