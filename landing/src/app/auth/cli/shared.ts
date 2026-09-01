export const AUTHID_FORMAT = /^[A-Za-z0-9]{16,64}$/;

export function claimErrorMessage(code: string | undefined): string {
  switch (code) {
    case "expired":
      return "This login link has expired. Ask your agent to show a fresh login URL.";
    case "already_used":
      return "This login link was already used. Ask your agent to show a fresh login URL.";
    case "auth_id_not_found":
      return "We could not find this sign-in. Ask your agent to show a fresh login URL.";
    case "no_email":
      return "This sign-in has no email attached. Sign in again with Google or email.";
    default:
      return `Auth claim failed (${code ?? "unknown"}). Try again.`;
  }
}
