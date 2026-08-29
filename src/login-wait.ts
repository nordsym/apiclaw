/**
 * Keep `apiclaw auth login` in front of the human until Clerk writes
 * session_token. Printing the login URL is not success. Poll whoami /
 * the session file, reprint the URL every few seconds, and wait for
 * the loopback callback. Do not return success until one of those
 * proves the session exists or the callback arrived so exchange can
 * write it.
 */

export const LOGIN_URL_REPRINT_MS = 4_000;
export const LOGIN_SESSION_POLL_MS = 1_000;
export const LOGIN_WAIT_TIMEOUT_MS = 5 * 60 * 1000;

export function loginWaitReprintLines(loginUrl: string): string[] {
  return [
    "Not ready. Printing this URL is not success.",
    "  Open this login URL:",
    `  ${loginUrl}`,
    "  After Clerk, click Authorize on apiclaw.cloud or the terminal stays unsigned.",
    "  Keep this command running until session_token exists.",
    "  Connection refused on localhost is OK. whoami redeems Authorize.",
    "  Then confirm with: npx @nordsym/apiclaw auth whoami",
    "  Do not execute until whoami prints an email.",
  ];
}

/** Loopback tab after Authorize. Session is not written until the CLI exchanges. */
export function loopbackCallbackSuccessHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>APIClaw — Sign-in received</title><style>
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0a0a0a;color:#fafafa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}
        .box{max-width:440px;padding:32px}
        .lobster{font-size:48px;margin-bottom:16px}
        h1{font-weight:600;font-size:20px;margin:0 0 8px}
        p{color:#a3a3a3;font-size:14px;line-height:1.5;margin:8px 0}
        code{background:#1a1a1a;padding:2px 6px;border-radius:4px;color:#ef4444;font-size:13px}
      </style></head><body><div class="box">
        <div class="lobster">🦞</div>
        <h1>Sign-in received</h1>
        <p>Not ready yet. Return to the terminal and wait until it prints your email.</p>
        <p>Then confirm with <code>npx @nordsym/apiclaw auth whoami</code>.</p>
        <p>Connection refused on localhost is OK. whoami redeems Authorize.</p>
        <p>Do not execute until whoami prints an email.</p>
      </div></body></html>`;
}

/**
 * True when the session file has a usable token that is not the
 * `--force` token we are replacing.
 */
export function isFreshLoginSession(
  current: { sessionToken?: string } | null | undefined,
  previousToken?: string,
): boolean {
  const token = current?.sessionToken?.trim();
  if (!token) return false;
  if (previousToken && token === previousToken) return false;
  return true;
}

export type LoginWaitSuccess<T> =
  | { ok: true; source: "session" }
  | { ok: true; source: "callback"; callback: T };

export type LoginWaitFailure = {
  ok: false;
  reason: "timeout" | "callback_error";
  error?: Error;
};

export type LoginWaitResult<T> = LoginWaitSuccess<T> | LoginWaitFailure;

export interface WaitUntilSessionOrCallbackOptions<T> {
  loginUrl: string;
  hasSession: () => boolean;
  callback: Promise<T>;
  timeoutMs?: number;
  reprintMs?: number;
  pollMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  onReprint: (lines: string[]) => void;
  /** Default true: print the URL immediately, then every reprintMs. */
  reprintImmediately?: boolean;
}

export async function waitUntilSessionOrCallback<T>(
  options: WaitUntilSessionOrCallbackOptions<T>,
): Promise<LoginWaitResult<T>> {
  const timeoutMs = options.timeoutMs ?? LOGIN_WAIT_TIMEOUT_MS;
  const reprintMs = options.reprintMs ?? LOGIN_URL_REPRINT_MS;
  const pollMs = options.pollMs ?? LOGIN_SESSION_POLL_MS;
  const now = options.now ?? (() => Date.now());
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  const startedAt = now();
  let lastReprintAt = startedAt;
  let callbackResult:
    | { status: "ok"; value: T }
    | { status: "error"; error: Error }
    | undefined;

  const watched = options.callback.then(
    (value) => {
      callbackResult = { status: "ok", value };
    },
    (error: unknown) => {
      callbackResult = {
        status: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    },
  );

  if (options.reprintImmediately !== false) {
    options.onReprint(loginWaitReprintLines(options.loginUrl));
    lastReprintAt = now();
  }

  while (true) {
    if (options.hasSession()) {
      return { ok: true, source: "session" };
    }
    if (callbackResult?.status === "ok") {
      return { ok: true, source: "callback", callback: callbackResult.value };
    }
    if (callbackResult?.status === "error") {
      return { ok: false, reason: "callback_error", error: callbackResult.error };
    }

    const elapsed = now() - startedAt;
    if (elapsed >= timeoutMs) {
      return { ok: false, reason: "timeout" };
    }

    if (now() - lastReprintAt >= reprintMs) {
      options.onReprint(loginWaitReprintLines(options.loginUrl));
      lastReprintAt = now();
    }

    const remaining = timeoutMs - (now() - startedAt);
    await Promise.race([sleep(Math.min(pollMs, Math.max(0, remaining))), watched]);
  }
}
