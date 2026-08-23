/**
 * /auth/cli : browser side of the agent-native auth handoff.
 *
 * Flow:
 *   1. CLI opens this URL with ?authId=<id>
 *   2. If user is not signed in to Clerk → render a "Sign in to continue" prompt
 *      that links to /sign-in?redirect_url=/auth/cli?authId=<id>
 *   3. If signed in → render an explicit "Authorize this terminal?" confirmation.
 *      Nothing is claimed until the user submits that form.
 *   4. Form POST → authorizeCli server action → POST to Convex cliAuth:claim
 *      with {authId, clerkUserId, email}
 *   5. On success → redirect to http://localhost:<port>/callback?code=<code>&state=<state>
 *      where the CLI's loopback listener picks it up and closes the loop.
 *      On failure → redirect back here with ?error=<code>, rendered as ErrorView.
 *
 * Server component : runs on every request, Clerk session via auth().
 * The claim itself only ever runs inside the "use server" action below, never
 * on GET — a signed-in browser landing on this URL must not silently bind
 * a CLI session without the user clicking Authorize.
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

  // Not signed in → punt to /sign-in with redirect_url back to here
  if (!userId) {
    const here = `/auth/cli?authId=${encodeURIComponent(authId)}`;
    return (
      <CliShell>
        <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">Sign in to authorize your CLI.</h1>
        <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">
          You ran <code className="claw-mono text-[13px] text-text-primary">npx @nordsym/apiclaw auth login</code> in your terminal. One click and you are back in the CLI.
        </p>
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent(here)}`}
          className="claw-btn claw-btn-solid mt-8"
        >
          Sign in to continue
        </Link>
        <p className="mt-6 text-[13px] text-text-muted">
          APIClaw never sees your password. Sign-in is handled by Clerk with Google / passwordless email.
        </p>
      </CliShell>
    );
  }

  // Signed in → show the email that will be used, ask for explicit authorization
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
    <CliShell>
      <p className="claw-eyebrow">CLI sign-in</p>
      <h1 className="claw-display mt-3 text-[2.2rem] sm:text-[2.75rem]">Authorize this terminal?</h1>
      <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">
        You are signing in as <span className="text-text-primary">{email}</span>. The terminal that printed this link gets a session for your workspace.
      </p>
      <form action={authorizeCli} method="post" className="mt-8 flex items-center gap-4">
        <input type="hidden" name="authId" value={authId} />
        <button type="submit" className="claw-btn claw-btn-solid">
          Authorize
        </button>
        <Link href="/" className="claw-btn claw-btn-quiet">
          Cancel
        </Link>
      </form>
    </CliShell>
  );
}

function CliShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="claw flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
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
