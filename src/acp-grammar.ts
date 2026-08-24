/**
 * Deterministic command grammar for the `apiclaw acp` transport.
 *
 * Pure string parsing, no I/O. The ACP prompt turn concatenates the text
 * content blocks of a `session/prompt` request into one string and hands it
 * here. Anything unparseable returns the SAME "unparseable" kind as an
 * explicit `help` request - the dispatcher replies with the grammar listing
 * either way, per the product requirement that this usage text IS the
 * agent's reply, not an error.
 */

export type ParsedAcpCommand =
  | { kind: "help" }
  | { kind: "unparseable" }
  | { kind: "status" }
  | { kind: "balance" }
  | { kind: "discover"; query: string }
  | { kind: "details"; provider: string; action?: string }
  | { kind: "call"; target: string; params?: Record<string, unknown>; paramsError?: string };

export const GRAMMAR_HELP_TEXT = [
  "APIClaw ACP agent - deterministic command grammar (case-insensitive keyword, whitespace-separated):",
  "",
  "  help                              show this listing",
  "  discover <query>                  search the API catalog",
  "  details <provider>[/<action>]     full spec for a provider or provider/action",
  "  call <provider>/<action> [json]   execute a call, e.g. call nasa/apod {\"date\":\"2024-01-01\"}",
  "  balance                           workspace balance, tier, remaining calls",
  "  status                            local sign-in status (offline, no gateway call)",
  "",
  "Unrecognized input returns this same listing.",
].join("\n");

/** Split "first \s+ rest" without regressing on trailing/leading whitespace. */
function splitFirstToken(input: string): { first: string; rest: string } {
  const match = input.match(/^(\S+)\s*([\s\S]*)$/);
  if (!match) return { first: "", rest: "" };
  return { first: match[1], rest: match[2].trim() };
}

export function parseAcpCommand(input: string): ParsedAcpCommand {
  const trimmed = input.trim();
  if (!trimmed) return { kind: "unparseable" };

  const { first, rest } = splitFirstToken(trimmed);
  const keyword = first.toLowerCase();

  switch (keyword) {
    case "help":
      return { kind: "help" };
    case "status":
      return { kind: "status" };
    case "balance":
      return { kind: "balance" };
    case "discover": {
      if (!rest) return { kind: "unparseable" };
      return { kind: "discover", query: rest };
    }
    case "details": {
      if (!rest) return { kind: "unparseable" };
      const target = splitFirstToken(rest).first;
      const slash = target.indexOf("/");
      if (slash === -1) return { kind: "details", provider: target };
      return { kind: "details", provider: target.slice(0, slash), action: target.slice(slash + 1) };
    }
    case "call": {
      if (!rest) return { kind: "unparseable" };
      const { first: target, rest: jsonPart } = splitFirstToken(rest);
      if (!jsonPart) return { kind: "call", target };
      try {
        const parsed = JSON.parse(jsonPart);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          return {
            kind: "call",
            target,
            paramsError: "params JSON must be a JSON object, e.g. call nasa/apod {\"date\":\"2024-01-01\"}",
          };
        }
        return { kind: "call", target, params: parsed as Record<string, unknown> };
      } catch {
        return {
          kind: "call",
          target,
          paramsError: "could not parse trailing text as JSON. Example: call nasa/apod {\"date\":\"2024-01-01\"}",
        };
      }
    }
    default:
      return { kind: "unparseable" };
  }
}
