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
    "Still waiting for Clerk. Printing this URL is not success.",
    "  Open this login URL:",
    `  ${loginUrl}`,
    "  Keep this command running until session_token exists.",
    "  Then confirm with: npx @nordsym/apiclaw auth whoami",
  ];
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
