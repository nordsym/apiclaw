/** Keep provider diagnostics out of user-facing failures. */
export function friendlyManagedFailure(payload: Record<string, unknown>, status: number): Record<string, unknown> {
  if (status < 400 && payload.success !== false) return payload;
  const data = payload.data as Record<string, any> | undefined;
  const providerMessage = String(data?.error?.message ?? data?.error ?? data?.message ?? "").toLowerCase();
  const funding = /credit balance|insufficient.*(?:credit|balance)|payment required/.test(providerMessage);
  const configuration = status === 401 || status === 403 || funding;
  return {
    success: false, provider: payload.provider, action: payload.action, _apiclaw: payload._apiclaw,
    error: {
      code: status === 429 ? "provider_rate_limited" : configuration ? "provider_unavailable" : status >= 500 ? "provider_temporarily_unavailable" : "provider_request_rejected",
      message: status === 429
        ? "This API is busy or has reached its provider limit. Please try again later or choose another API."
        : configuration
        ? "This API is currently unavailable. Please choose another API. You have not been charged for this failed call."
        : status >= 500
        ? "The API provider is temporarily unavailable. Please try again shortly."
        : "The API could not complete this request. Check the action and parameters, then try again.",
      retryable: status === 429 || status >= 500,
    },
  };
}

export function normalizeManagedChatParams(provider: string, model: string, params: Record<string, any>): Record<string, any> {
  if (provider !== "openai" || !/^gpt-5(?:\.|-|$)|^o[1-9]/i.test(model) || params.max_tokens === undefined) return params;
  const { max_tokens, ...rest } = params;
  return { ...rest, max_completion_tokens: rest.max_completion_tokens ?? max_tokens };
}
