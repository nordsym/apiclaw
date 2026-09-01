/**
 * Plain-Swedish daily operator mail. Numbers only — no cost table, no
 * internal event names in the copy. A person who started the app and did
 * not log in is a failure. HTML is visual only; the plaintext body stays
 * the source of truth for mail clients without HTML.
 */

const PAGE_BG = "#0b0b0c";
const SURFACE = "#111113";
const BORDER = "#26262a";
const TEXT_PRIMARY = "#f5f5f6";
const TEXT_SECONDARY = "#a4a4ad";
const TEXT_MUTED = "#6f6f78";
const ACCENT = "#ef4444";
const OK = "#3ecf8e";
const FONT_UI = "Inter, system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

export type DailyScorecardWindow = {
  installs: number;
  started: number;
  loggedIn: number;
  calls: number;
};

export type DailyScorecardCopy = {
  yesterday: DailyScorecardWindow;
  week: DailyScorecardWindow;
};

function uniqueStartedApp(funnel: {
  funnel?: Array<{ event: string; unique: number }>;
}): number {
  const row = funnel.funnel?.find((step) => step.event === "first_run");
  return row?.unique ?? 0;
}

export function windowFromQueries(
  scorecard: { truth?: Record<string, number | undefined> } | null | undefined,
  funnel: { funnel?: Array<{ event: string; unique: number }> } | null | undefined,
): DailyScorecardWindow {
  const truth = scorecard?.truth ?? {};
  return {
    installs: truth.installs ?? 0,
    started: uniqueStartedApp(funnel ?? {}),
    loggedIn: truth.authenticatedWorkspaces ?? truth.activatedOwners ?? 0,
    calls: truth.activatedUsers ?? 0,
  };
}

function renderWindowLines(title: string, w: DailyScorecardWindow): string {
  return [
    title,
    `- Installerade: ${w.installs}`,
    `- Startade appen: ${w.started}`,
    `- Loggade in: ${w.loggedIn}`,
    `- Gjorde ett anrop: ${w.calls}`,
  ].join("\n");
}

function renderLoginFailureLine(yesterday: DailyScorecardWindow): string {
  const failed = Math.max(0, yesterday.started - yesterday.loggedIn);
  if (yesterday.started === 0) {
    return "Ingen startade appen igår.";
  }
  if (yesterday.loggedIn === 0) {
    return yesterday.started === 1
      ? "Den som startade appen igår misslyckades med att logga in."
      : `Alla ${yesterday.started} som startade appen igår misslyckades med att logga in.`;
  }
  if (failed === 0) {
    return yesterday.started === 1
      ? "Den som startade appen igår loggade in."
      : `Alla ${yesterday.started} som startade appen igår loggade in.`;
  }
  return `${yesterday.loggedIn} loggade in. ${failed} som startade appen loggade inte in. Det är misslyckanden.`;
}

export function renderDailyScorecardSubject(yesterday: DailyScorecardWindow): string {
  return `APIClaw igår: ${yesterday.started} startade, ${yesterday.loggedIn} loggade in`;
}

export function renderDailyScorecardText(copy: DailyScorecardCopy): string {
  return [
    renderWindowLines("Igår", copy.yesterday),
    "",
    renderWindowLines("Senaste 7 dagarna", copy.week),
    "",
    renderLoginFailureLine(copy.yesterday),
  ].join("\n");
}

function utcDateLine(generatedAt: number): string {
  const d = new Date(generatedAt);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loginNumberColor(loggedIn: number): string {
  return loggedIn > 0 ? OK : ACCENT;
}

function failureLineColor(yesterday: DailyScorecardWindow): string {
  const failed = Math.max(0, yesterday.started - yesterday.loggedIn);
  if (yesterday.started === 0) return TEXT_MUTED;
  if (failed > 0) return ACCENT;
  return yesterday.loggedIn > 0 ? OK : TEXT_MUTED;
}

function metricRow(
  label: string,
  value: number,
  valueColor: string,
  last: boolean,
): string {
  const border = last ? "none" : `1px solid ${BORDER}`;
  return [
    "<tr>",
    `<td style="padding:14px 0;border-bottom:${border};font-family:${FONT_UI};font-size:15px;line-height:22px;color:${TEXT_SECONDARY}">${label}</td>`,
    `<td style="padding:14px 0;border-bottom:${border};text-align:right;font-family:${FONT_MONO};font-size:28px;font-weight:600;letter-spacing:-0.03em;line-height:32px;color:${valueColor}">${value}</td>`,
    "</tr>",
  ].join("");
}

function metricCard(title: string, w: DailyScorecardWindow): string {
  const loginColor = loginNumberColor(w.loggedIn);
  return [
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SURFACE}" style="width:100%;background-color:${SURFACE};border:1px solid ${BORDER};border-radius:14px;margin:0 0 16px">`,
    "<tr>",
    `<td style="padding:20px 24px 4px;font-family:${FONT_UI};font-size:12px;font-weight:600;letter-spacing:0.04em;color:${ACCENT}">${title}</td>`,
    "</tr>",
    "<tr>",
    `<td style="padding:0 24px 8px">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%">`,
    metricRow("Installerade", w.installs, TEXT_PRIMARY, false),
    metricRow("Startade appen", w.started, TEXT_PRIMARY, false),
    metricRow("Loggade in", w.loggedIn, loginColor, false),
    metricRow("Gjorde ett anrop", w.calls, TEXT_PRIMARY, true),
    "</table>",
    "</td>",
    "</tr>",
    "</table>",
  ].join("");
}

export function renderDailyScorecardHtml(
  copy: DailyScorecardCopy,
  generatedAt: number = Date.now(),
): string {
  const failure = renderLoginFailureLine(copy.yesterday);
  const failureColor = failureLineColor(copy.yesterday);
  const date = utcDateLine(generatedAt);
  return [
    "<!DOCTYPE html>",
    '<html lang="sv">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<title>APIClaw</title>",
    "</head>",
    `<body style="margin:0;padding:0;background-color:${PAGE_BG};color:${TEXT_PRIMARY};font-family:${FONT_UI}">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}" style="width:100%;background-color:${PAGE_BG}">`,
    "<tr>",
    `<td align="center" style="padding:32px">`,
    `<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">`,
    "<tr>",
    `<td style="padding:0 0 28px">`,
    `<p style="margin:0;font-family:${FONT_UI};font-size:18px;font-weight:600;letter-spacing:-0.03em;color:${TEXT_PRIMARY};line-height:24px">APIClaw</p>`,
    `<p style="margin:6px 0 0;font-family:${FONT_UI};font-size:12px;color:${TEXT_MUTED};line-height:18px">${date}</p>`,
    "</td>",
    "</tr>",
    "<tr>",
    "<td>",
    metricCard("Igår", copy.yesterday),
    metricCard("Senaste 7 dagarna", copy.week),
    "</td>",
    "</tr>",
    "<tr>",
    `<td style="padding:8px 4px 0;font-family:${FONT_UI};font-size:14px;line-height:22px;color:${failureColor}">${failure}</td>`,
    "</tr>",
    "<tr>",
    `<td style="padding:28px 4px 0;font-family:${FONT_UI};font-size:12px;line-height:18px;color:${TEXT_MUTED}"><a href="https://apiclaw.cloud" style="color:${TEXT_MUTED};text-decoration:none">apiclaw.cloud</a></td>`,
    "</tr>",
    "</table>",
    "</td>",
    "</tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("");
}
