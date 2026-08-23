export const AUTHID_FORMAT = /^[A-Za-z0-9]{16,64}$/;

export function claimErrorMessage(code: string | undefined): string {
  switch (code) {
    case "expired":
      return "This CLI login link has expired. Run the login command again.";
    case "already_used":
      return "This CLI login link was already used. Run the login command again.";
    case "auth_id_not_found":
      return "We could not find this CLI session. Run the login command again.";
    case "no_email":
      return "Your Clerk session has no email attached. Re-sign-in with an email-bearing provider.";
    default:
      return `Auth claim failed (${code ?? "unknown"}). Try again.`;
  }
}
