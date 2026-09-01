/**
 * Plain-Swedish daily operator mail. Numbers only — no HTML, no cost table,
 * no internal event names. A person who started the app and did not log in
 * is a failure.
 */

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
