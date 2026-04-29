#!/usr/bin/env node
/**
 * APIClaw smoketest — sample HTTP-pings the simplest GET on each callable
 * generated provider and classifies the outcome. Output is a JSON report
 * under reports/smoketest/.
 *
 * Usage:
 *   node scripts/smoketest-callable.mjs --sample 100         # pilot
 *   node scripts/smoketest-callable.mjs --all                # full sweep
 *   node scripts/smoketest-callable.mjs --sample 100 --seed 42
 *   node scripts/smoketest-callable.mjs --concurrency 8
 *
 * Polite by design: 10s timeout, custom UA, max 8 parallel by default,
 * per-host serialization (never two concurrent calls to the same host).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY = resolve(__dirname, '../src/registry/generated-providers.json');
const REPORT_DIR = resolve(__dirname, '../reports/smoketest');

const args = parseArgs(process.argv.slice(2));
const sampleSize = args.all ? null : Number(args.sample ?? 100);
const concurrency = Number(args.concurrency ?? 8);
const seed = args.seed != null ? Number(args.seed) : 1;
const timeoutMs = Number(args.timeout ?? 10000);

const UA = 'APIClaw-Healthcheck/1.0 (+https://apiclaw.cloud)';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next == null || next.startsWith('--')) {
      out[k] = true;
    } else {
      out[k] = next;
      i++;
    }
  }
  return out;
}

function mulberry32(s) {
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTestableAction(provider) {
  for (const [name, a] of Object.entries(provider.actions)) {
    if (a.method !== 'GET') continue;
    if (a.pathTemplate.includes('{')) continue;
    const required = (a.params || []).filter((pp) => pp.required);
    if (required.length > 0) continue;
    return { name, action: a };
  }
  return null;
}

function buildUrl(provider, action) {
  let base = (provider.baseUrl || '').replace(/\/+$/, '');
  if (!base) return null;
  if (!base.startsWith('http')) base = `https://${base}`;
  const path = action.pathTemplate.startsWith('/')
    ? action.pathTemplate
    : `/${action.pathTemplate}`;
  return base + path;
}

async function callOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'application/json, */*;q=0.5' },
      redirect: 'follow',
    });
    const latency = Date.now() - t0;
    let bodySize = 0;
    let contentType = res.headers.get('content-type') || '';
    let sample = '';
    try {
      const buf = await res.arrayBuffer();
      bodySize = buf.byteLength;
      const text = new TextDecoder().decode(buf.slice(0, 800));
      sample = text;
    } catch (_) {}
    return {
      ok: true,
      status: res.status,
      latency_ms: latency,
      content_type: contentType,
      body_size: bodySize,
      sample_head: sample.slice(0, 400),
    };
  } catch (err) {
    const latency = Date.now() - t0;
    const code = err && err.name === 'AbortError' ? 'TIMEOUT' : (err && err.code) || 'NETWORK_ERR';
    return {
      ok: false,
      status: 0,
      latency_ms: latency,
      error: code,
      message: err && err.message ? String(err.message).slice(0, 200) : null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function classify(result) {
  if (!result.ok) {
    if (result.error === 'TIMEOUT') return 'TIMEOUT';
    if (result.error === 'ENOTFOUND' || result.error === 'EAI_AGAIN') return 'DNS_FAIL';
    if (result.error === 'ECONNREFUSED') return 'CONN_REFUSED';
    if (result.error === 'CERT_HAS_EXPIRED' || (result.message || '').includes('certificate')) return 'TLS_FAIL';
    return 'NETWORK_ERR';
  }
  const s = result.status;
  if (s === 401) return 'AUTH_401';
  if (s === 403) return 'AUTH_403';
  if (s === 404) return 'NOT_FOUND_404';
  if (s === 405) return 'METHOD_NOT_ALLOWED';
  if (s === 429) return 'RATE_LIMITED';
  if (s >= 500) return 'SERVER_5XX';
  if (s >= 300 && s < 400) return 'REDIRECT_LIMBO';
  if (s >= 200 && s < 300) {
    if (result.body_size === 0) return 'WORKING_EMPTY';
    const ct = (result.content_type || '').toLowerCase();
    const looksJson = ct.includes('json') || (result.sample_head || '').trim().startsWith('{') || (result.sample_head || '').trim().startsWith('[');
    const looksHtml = ct.includes('html') || (result.sample_head || '').toLowerCase().includes('<!doctype html') || (result.sample_head || '').toLowerCase().startsWith('<html');
    if (looksJson) return 'WORKING_JSON';
    if (looksHtml) return 'WORKING_HTML_PROBABLY_LANDING';
    return 'WORKING_OTHER';
  }
  return `OTHER_${s}`;
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

async function runWithPool(jobs, concurrency, perJob) {
  const inFlight = new Set();
  const hostBusy = new Set();
  const results = new Array(jobs.length);
  let cursor = 0;

  async function spawn() {
    while (cursor < jobs.length && inFlight.size < concurrency) {
      const idx = cursor;
      const job = jobs[cursor];
      const host = job.host;
      if (host && hostBusy.has(host)) {
        // Skip this index for now; come back when host frees
        cursor++;
        continue;
      }
      cursor++;
      if (host) hostBusy.add(host);
      const p = (async () => {
        try {
          results[idx] = await perJob(job);
        } finally {
          if (host) hostBusy.delete(host);
          inFlight.delete(p);
        }
      })();
      inFlight.add(p);
    }
  }

  spawn();
  while (inFlight.size > 0) {
    await Promise.race(inFlight);
    spawn();
  }
  // Pass 2: any jobs we skipped because of host collisions
  for (let i = 0; i < jobs.length; i++) {
    if (results[i] == null) {
      results[i] = await perJob(jobs[i]);
    }
  }
  return results;
}

async function main() {
  console.error(`[smoketest] reading ${REGISTRY}`);
  const data = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  const callable = data.providers.filter((p) => p.callable === true);
  console.error(`[smoketest] generated callable: ${callable.length}`);

  const testable = [];
  for (const p of callable) {
    const pick = pickTestableAction(p);
    if (!pick) continue;
    const url = buildUrl(p, pick.action);
    if (!url) continue;
    testable.push({
      id: p.id,
      name: p.name,
      url,
      host: hostOf(url),
      action: pick.name,
      method: pick.action.method,
    });
  }
  console.error(`[smoketest] trivially testable: ${testable.length}`);

  const rng = mulberry32(seed);
  testable.sort((a, b) => rng() - rng());
  const target = sampleSize == null ? testable : testable.slice(0, sampleSize);
  console.error(`[smoketest] target size: ${target.length} (concurrency=${concurrency}, timeout=${timeoutMs}ms)`);

  const start = Date.now();
  let done = 0;
  const tickEvery = Math.max(1, Math.floor(target.length / 25));

  const records = await runWithPool(target, concurrency, async (job) => {
    const res = await callOnce(job.url);
    const klass = classify(res);
    done++;
    if (done % tickEvery === 0 || done === target.length) {
      process.stderr.write(`  ${done}/${target.length} (${klass})\n`);
    }
    return { ...job, result: res, classification: klass };
  });

  // Bucket counts
  const buckets = {};
  for (const r of records) {
    buckets[r.classification] = (buckets[r.classification] || 0) + 1;
  }

  const summary = {
    generated_at: new Date().toISOString(),
    seed,
    concurrency,
    timeout_ms: timeoutMs,
    total_generated_callable: callable.length,
    total_trivially_testable: testable.length,
    sampled: target.length,
    elapsed_ms: Date.now() - start,
    bucket_counts: Object.fromEntries(
      Object.entries(buckets).sort((a, b) => b[1] - a[1])
    ),
  };

  // % view + verdict
  const pct = (n) => `${((n / target.length) * 100).toFixed(1)}%`;
  const working_data =
    (buckets.WORKING_JSON || 0);
  const working_any =
    (buckets.WORKING_JSON || 0) + (buckets.WORKING_OTHER || 0) + (buckets.WORKING_HTML_PROBABLY_LANDING || 0);
  const working_meaningful = working_data; // strict: only JSON-ish counts
  const verdict = {
    sampled: target.length,
    working_json_pct: pct(working_data),
    working_any_2xx_pct: pct(working_any),
    auth_required_pct: pct((buckets.AUTH_401 || 0) + (buckets.AUTH_403 || 0)),
    dead_pct: pct((buckets.DNS_FAIL || 0) + (buckets.CONN_REFUSED || 0) + (buckets.TLS_FAIL || 0) + (buckets.NETWORK_ERR || 0) + (buckets.TIMEOUT || 0)),
    not_found_pct: pct((buckets.NOT_FOUND_404 || 0) + (buckets.METHOD_NOT_ALLOWED || 0)),
    server_5xx_pct: pct(buckets.SERVER_5XX || 0),
    rate_limited_pct: pct(buckets.RATE_LIMITED || 0),
    extrapolation_to_full_callable_pool: {
      pool_size: callable.length,
      est_working_json: Math.round((working_data / target.length) * callable.length),
      est_working_any_2xx: Math.round((working_any / target.length) * callable.length),
      note: 'Extrapolation assumes the trivially-testable subset is representative of the full pool. Untestable providers (POST-only, required params, path-vars) are not validated by this script.',
    },
  };

  console.error(`\n[smoketest] verdict:`);
  console.error(JSON.stringify(verdict, null, 2));
  console.error(`\n[smoketest] bucket counts:`);
  console.error(JSON.stringify(summary.bucket_counts, null, 2));

  mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = resolve(REPORT_DIR, `smoketest-${stamp}.json`);
  writeFileSync(
    outPath,
    JSON.stringify({ summary, verdict, records }, null, 2),
    'utf8'
  );
  console.error(`\n[smoketest] wrote ${outPath}`);
}

main().catch((e) => {
  console.error('[smoketest] fatal:', e);
  process.exit(1);
});
