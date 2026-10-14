export function managedChatProviderForRequest(input: {
  authMethod: string;
  websiteService: boolean;
  hasExplicitOpenRouterTarget: boolean;
}): "openrouter" | "auto" {
  return !input.websiteService &&
    (input.authMethod !== "internal" || input.hasExplicitOpenRouterTarget)
    ? "openrouter"
    : "auto";
}
