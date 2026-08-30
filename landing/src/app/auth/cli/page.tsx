/**
 * /auth/cli : browser side of the agent-native auth handoff.
 *
 * Flow:
 *   1. CLI opens this URL with ?authId=<id>
 *   2. If user is not signed in to Clerk → render "Authorize this terminal"
 *      that links to /sign-in?redirect_url=/auth/cli?authId=<id>. Middleware
 *      sets apiclaw_cli_clerk_intent. Completing Clerk hits clerk-bridge,
 *      which claims the authId (that Clerk click is the consent).
 *   3. If already signed in → render an explicit "Authorize this terminal"
 *      confirmation. Nothing is claimed until the user submits that form
 *      (login CSRF: a hostile ?authId= must not silently bind).
 *   4. Form POST → authorizeCli server action → POST to Convex cliAuth:claim
 *      with {authId, clerkUserId, email}
 *   5. On success → /auth/cli/done (whoami / live login poll the code).
 *      On failure → redirect back here with ?error=<code>.
 *
 * Server component : runs on every request, Clerk session via auth().
 * The claim itself only ever runs inside the "use server" action or
 * clerk-bridge after a matching clerk-intent cookie — never on GET.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";
import { authorizeCli } from "./actions";
import { AUTHID_FORMAT, claimErrorMessage } from "./shared";

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ authId?: string; error?: string }>;
}) {
  const { authId, error } = await searchParams;

  // A failed claim redirects back here with ?error=<code>; render that before
  // touching authId again, since the action already re-validated it.
  if (error) {
    return (
      <ErrorView
        title={error === "no_email" ? "No email on Clerk account" : "Could not complete CLI authentication"}
        message={claimErrorMessage(error)}
      />
    );
  }

  // Validate authId format before doing anything
  if (!authId || !AUTHID_FORMAT.test(authId)) {
    return <ErrorView title="Invalid auth link" message="The CLI authentication link is malformed or missing. Run the login command again to get a fresh link." />;
  }

  const { userId } = await auth();

  const here = `/auth/cli?authId=${encodeURIComponent(authId)}`;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(here)}`;

  // Not signed in → Clerk on this URL is the Authorize consent.
  if (!userId) {
    return (
      <CliShell signInHref={signInHref}>
        <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">Authorize this terminal</h1>
        <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">
          You ran <code className="claw-mono text-[13px] text-text-primary">npx @nordsym/apiclaw auth login</code>. Printing this URL is not success. Sign in with Google or email here — completing Clerk on this URL Authorizes the CLI. Clerk sign-in on other pages does not write <code className="claw-mono text-[13px] text-text-primary">session_token</code>.
        </p>
        <Link
          href={signInHref}
          className="claw-btn claw-btn-solid mt-8"
        >
          Authorize with Google or email
        </Link>
        <p className="mt-6 text-[13px] text-text-muted">
          Keep the terminal command running. After Clerk, this page does not ask for a second click. Then confirm with <code className="claw-mono text-[13px] text-text-primary">npx @nordsym/apiclaw auth whoami</code>.
        </p>
      </CliShell>
    );
  }

  // Already signed in → explicit Authorize click (consent / CSRF).
  const user = await currentUser();
  const verifiedPrimary = user?.primaryEmailAddress?.verification?.status === "verified"
    ? user.primaryEmailAddress.emailAddress
    : undefined;
  const verifiedFallback = user?.emailAddresses?.find(
    (address) => address.verification?.status === "verified",
  )?.emailAddress;
  const email = verifiedPrimary || verifiedFallback;

  if (!email) {
    return <ErrorView title="No email on Clerk account" message={claimErrorMessage("no_email")} />;
  }

  return (
    <CliShell signInHref={null}>
      <p className="claw-eyebrow">CLI sign-in — Authorize required</p>
      <h1 className="claw-display mt-3 text-[2.2rem] sm:text-[2.75rem]">Authorize this terminal</h1>
      <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">
        You are signed in as <span className="text-text-primary">{email}</span>. Click Authorize to bind this CLI or the terminal stays unsigned — no <code className="claw-mono text-[13px] text-text-primary">session_token</code>, whoami fails, execute stays blocked.
      </p>
      <form action={authorizeCli} method="post" className="mt-8 flex items-center gap-4">
        <input type="hidden" name="authId" value={authId} />
        <button type="submit" className="claw-btn claw-btn-solid" autoFocus>
          Authorize
        </button>
        <Link href="/" className="claw-btn claw-btn-quiet">
          Cancel
        </Link>
      </form>
    </CliShell>
  );
}

function CliShell({
  children,
  signInHref,
}: {
  children: React.ReactNode;
  signInHref?: string | null;
}) {
  return (
    <main className="claw flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader signInHref={signInHref} />
      <section className="claw-container flex-1 py-16 sm:py-20">
        <div className="mx-auto max-w-[28rem]">{children}</div>
      </section>
      <SiteFooter />
    </main>
  );
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <CliShell>
      <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">{title}</h1>
      <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">{message}</p>
      <a href="/docs#cli-auth" className="claw-btn claw-btn-quiet mt-8">
        Read the CLI auth docs
      </a>
    </CliShell>
  );
}
