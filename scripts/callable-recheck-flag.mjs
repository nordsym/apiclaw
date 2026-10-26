#!/usr/bin/env node
/** Decide whether a scheduled callable recheck is real drift or a single-run flake. */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { probeCandidate, createOriginLimiter } from './audit-callable.mjs';

const HARD_DNS = new Set(['ENOTFOUND', 'ECONNREFUSED']);
const HARD_TLS = /CERT_|TLS_|_SSL_|SELF_SIGNED|UNABLE_TO_VERIFY/;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function failureCodes(row) {
  const codes = [];
  for (const item of row?.errorCause ?? []) if (item?.code) codes.push(item.code);
  for (const hop of row?.trace ?? []) for (const item of hop?.errorCause ?? []) if (item?.code) codes.push(item.code);
  return [...new Set(codes)];
}

/** A failure is hard only when the product cannot call the reviewed endpoint for a stable reason. */
export function isHardFailure(attempt) {
  if (!attempt || attempt.verified) return false;
  const codes = attempt.codes ?? failureCodes(attempt);
  if (codes.some(code => HARD_DNS.has(code) || HARD_TLS.test(code))) return true;
  if (attempt.status === 404 || attempt.status === 410) return true;
  if (attempt.outcome === 'redirect_not_approved' || attempt.outcome === 'tls_error') return true;
  return false;
}

export function eligibilityDrift(snapshot, report) {
  const current = report.results.filter(row => row.verified).map(row => ({ id: row.canonicalId ?? row.id, name: row.name }));
  const removed = snapshot.filter(row => !current.some(item => item.id === row.id)).map(row => ({ id: row.id, name: row.name }));
  const added = current.filter(row => !snapshot.some(item => item.id === row.id));
  return { verifiedCount: current.length, removed, added };
}

export function priorRemovedIds(snapshot, report) {
  return new Set(eligibilityDrift(snapshot, report).removed.map(row => row.id));
}

/** Strikes come from the previous run's post-retry confirmation, not a raw single-pass sweep. */
export function priorStrikeIds(confirm) {
  if (!confirm || typeof confirm !== 'object') return null;
  return new Set([...(confirm.transientFirstSeen ?? []), ...(confirm.transientRepeated ?? []), ...(confirm.hard ?? [])]);
}

export function auditRowFor(report, id) {
  const matches = report.results.filter(row => (row.canonicalId ?? row.id) === id && row.cause !== 'duplicate');
  return matches.find(row => row.verified || row.probeUrl) ?? matches[0] ?? null;
}

function view(result) {
  return {
    verified: result?.verified === true,
    status: Number.isInteger(result?.status) ? result.status : 0,
    cause: result?.cause ?? 'unresolved',
    outcome: result?.outcome ?? 'unresolved',
    codes: result?.codes ?? failureCodes(result),
    latencyMs: Number.isFinite(result?.latencyMs) ? result.latencyMs : null,
  };
}

/** Re-probe snapshot misses. Stop on success. DNS death can stop after two identical answers. */
export async function confirmRemovals(removed, report, probe, { attempts = 3, backoffMs = [0, 2000, 5000], sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), workers = 8 } = {}) {
  const confirmed = [];
  let next = 0;
  async function worker() {
    while (next < removed.length) {
      const item = removed[next++];
      const api = auditRowFor(report, item.id);
      const seen = [];
      if (!api) {
        confirmed.push({ ...item, attempts: [], recovered: false, hard: false, missing: true });
        continue;
      }
      for (let index = 0; index < attempts; index++) {
        if (backoffMs[index]) await sleep(backoffMs[index]);
        let result;
        try { result = view(await probe(api)); }
        catch (error) { result = { verified: false, status: 0, cause: 'unresolved', outcome: 'probe_error', codes: [], latencyMs: null, detail: String(error?.name ?? 'Error') }; }
        seen.push(result);
        if (result.verified) break;
        const dnsDeath = seen.length >= 2 && seen.every(entry => entry.codes?.some(code => HARD_DNS.has(code)));
        if (dnsDeath) break;
      }
      const recovered = seen.some(entry => entry.verified);
      const hard = !recovered && seen.length >= 2 && seen.every(isHardFailure);
      confirmed.push({ ...item, attempts: seen, recovered, hard, missing: false });
    }
  }
  await Promise.all(Array.from({ length: Math.min(workers, removed.length) }, worker));
  confirmed.sort((a, b) => a.id.localeCompare(b.id));
  return confirmed;
}

export function flagDecision({ confirmed, additions, priorIds }) {
  const hard = confirmed.filter(row => row.hard || row.missing);
  const transient = confirmed.filter(row => !row.recovered && !row.hard && !row.missing);
  const repeated = priorIds ? transient.filter(row => priorIds.has(row.id)) : [];
  const firstSeen = priorIds ? transient.filter(row => !priorIds.has(row.id)) : transient;
  return {
    hard, transient, repeated, firstSeen, additions,
    priorCompared: priorIds !== null && priorIds !== undefined,
    fail: hard.length > 0 || repeated.length > 0,
  };
}

export function renderSummary({ verifiedCount, decision }) {
  const names = rows => rows.map(row => row.name).join(', ') || 'none';
  return [
    '## Callable upstream recheck',
    `${verifiedCount} upstream-verified free API candidates before snapshot-miss retries. The customer-approved runtime manifest is not changed by this job.`,
    `Recovered on retry: ${names(decision.confirmed?.filter(row => row.recovered) ?? [])}.`,
    `Confirmed hard removals: ${names(decision.hard)}.`,
    `Transient removals seen on this run only: ${names(decision.firstSeen)}.`,
    `Transient removals repeated from the previous run: ${names(decision.repeated)}.`,
    `New upstream candidates: ${names(decision.additions)}.`,
    'Additions require authenticated customer proof before a reviewed snapshot refresh and do not fail this job.',
    'Timeouts, HTTP 401/403, rate limits and 5xx responses fail the job only when the same snapshot API remained unconfirmed after retries on the previous run. DNS removal, TLS failure, HTTP 404/410 and an unapproved redirect fail on this run.',
    'Full results are in the callable-audit artifact. Native gateway health checks independently demote unhealthy approved APIs.',
    '',
  ].join('\n');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function liveProbe() {
  const { tsImport } = await import('tsx/esm/api');
  const transport = await tsImport('../src/workspace-public-transport.ts', import.meta.url);
  const response = await tsImport('../src/workspace-public-response.ts', import.meta.url);
  const urls = await tsImport('../src/workspace-public-apis.ts', import.meta.url);
  const dependencies = {
    fetch, fetchWorkspacePublicGet: transport.fetchWorkspacePublicGet, decodePublicApiResponse: response.decodePublicApiResponse,
    isSafePublicApiBaseUrl: urls.isSafePublicApiBaseUrl, limit: createOriginLimiter(),
  };
  return api => probeCandidate(api, dependencies);
}

export async function runFlag(argv = process.argv.slice(2), dependencies = {}) {
  const value = flag => argv.find(arg => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  const snapshot = readJson(resolve(value('--snapshot') ?? resolve(ROOT, 'src/workspace-public-apis.json')));
  const report = readJson(resolve(value('--report') ?? resolve(ROOT, 'docs/ops/callable-audit.json')));
  const drift = eligibilityDrift(snapshot, report);
  const priorConfirmPath = value('--prior-confirm');
  const priorIds = priorConfirmPath && existsSync(priorConfirmPath) ? priorStrikeIds(readJson(priorConfirmPath)) : null;
  const probe = dependencies.probe ?? await liveProbe();
  const confirmed = await confirmRemovals(drift.removed, report, probe, dependencies);
  const decision = flagDecision({ confirmed, additions: drift.added, priorIds });
  decision.confirmed = confirmed;
  const summary = renderSummary({ verifiedCount: drift.verifiedCount, decision });
  const output = resolve(value('--confirm-output') ?? resolve(ROOT, 'docs/ops/callable-recheck-confirm.json'));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({
    checkedAt: new Date().toISOString(), priorCompared: decision.priorCompared, fail: decision.fail,
    recovered: confirmed.filter(row => row.recovered).map(row => row.id),
    hard: decision.hard.map(row => row.id),
    transientFirstSeen: decision.firstSeen.map(row => row.id),
    transientRepeated: decision.repeated.map(row => row.id),
    additions: drift.added.map(row => row.id),
  }, null, 2) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(summary);
  if (decision.fail) {
    console.error('Callable eligibility drift needs review. Hard removals fail immediately. Transient removals fail only on a second consecutive run.');
    process.exitCode = 1;
  }
  return decision;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await runFlag();
}
