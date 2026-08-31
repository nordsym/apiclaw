export type RuntimeEnvironment = Record<string, string | undefined>;

/**
 * Resolve the credential shape consumed by buildManagedRequest. Composite
 * Basic-auth providers use the same two variables as their dedicated proxies.
 */
export function resolveManagedCredential(
  provider: string,
  fallbackEnvKey: string,
  env: RuntimeEnvironment,
): string | undefined {
  if (provider === "46elks") {
    const user = env.ELKS_API_USER;
    const password = env.ELKS_API_PASSWORD;
    return user && password ? `${user}:${password}` : undefined;
  }
  if (provider === "twilio") {
    const sid = env.TWILIO_ACCOUNT_SID;
    const token = env.TWILIO_AUTH_TOKEN;
    return sid && token ? `${sid}:${token}` : undefined;
  }
  // NASA documents DEMO_KEY as the public rate-limited key (30 req/hour/IP).
  // Prefer NASA_API_KEY when set so production is not capped; fall back so
  // first-execute APOD still lands if the managed key is missing.
  if (provider === "nasa") {
    const configured = env.NASA_API_KEY?.trim();
    return configured || "DEMO_KEY";
  }
  return env[fallbackEnvKey];
}
