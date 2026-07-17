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
  return env[fallbackEnvKey];
}
