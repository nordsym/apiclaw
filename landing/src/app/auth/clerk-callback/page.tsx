import { redirect } from "next/navigation";

// Compatibility route for stale Clerk redirect configuration. Session
// bearers are never accepted from the URL; the bridge sets an HttpOnly cookie.
export default function ClerkCallbackPage() {
  redirect("/workspace");
}
