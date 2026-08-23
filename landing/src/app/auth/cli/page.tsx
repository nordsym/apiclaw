/**
 * /auth/cli : browser side of the agent-native auth handoff.
 *
 * Flow:
 *   1. CLI opens this URL with ?authId=<id>
 *   2. If user is not signed in to Clerk → render a "Sign in to continue" prompt
 *      that links to /sign-in?redirect_url=/auth/cli?authId=<id>
 *   3. If signed in → POST to Convex cliAuth:claim with {authId, clerkUserId, email}
 *   4. On success → redirect to http://localhost:<port>/callback?code=<code>&state=<state>
 *      where the CLI's loopback listener picks it up and closes the loop.
 *
 * Server component : runs on every request, Clerk session via auth().
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

const AUTHID_FORMAT = /^[A-Za-z0-9]{16,64}$/;

type ClaimResult = {
  success: boolean;
  error?: string;
  code?: string;
  port?: number;
  state?: string;
};

async function claimAuthId(
  authId: string,
  clerkUserId: string,
  email: string
): Promise<ClaimResult> {
  try {
    const internalSecret = process.env.APICLAW_INTERNAL_SECRET;
    if (!internalSecret) return { success: false, error: "server_not_configured" };
    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cliAuth:claim",
        args: { authId, clerkUserId, email, internalSecret },
      }),
      // Convex needs no caching; this is a one-shot mutation
      cache: "no-store",
    });
    if (!res.ok) {
      return { success: false, error: `convex_http_${res.status}` };
    }
    const data = await res.json();
    const raw = (data?.value ?? data) as ClaimResult;
    return raw;
  } catch (err) {
    return { success: false, error: "convex_unreachable" };
  }
}

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ authId?: string }>;
}) {
  const { authId } = await searchParams;

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

  // Signed in → fetch email + claim
  const user = await currentUser();
  const verifiedPrimary = user?.primaryEmailAddress?.verification?.status === "verified"
    ? user.primaryEmailAddress.emailAddress
    : undefined;
  const verifiedFallback = user?.emailAddresses?.find(
    (address) => address.verification?.status === "verified",
  )?.emailAddress;
  const email = verifiedPrimary || verifiedFallback;

  if (!email) {
    return <ErrorView title="No email on Clerk account" message="Your Clerk session has no email attached. Re-sign-in with an email-bearing provider." />;
  }

  const result = await claimAuthId(authId, userId, email);

  if (!result.success || !result.code || !result.port || !result.state) {
    const reason =
      result.error === "expired"
        ? "This CLI login link has expired. Run the login command again."
        : result.error === "already_used"
        ? "This CLI login link was already used. Run the login command again."
        : result.error === "auth_id_not_found"
        ? "We could not find this CLI session. Run the login command again."
        : `Auth claim failed (${result.error ?? "unknown"}). Try again.`;
    return <ErrorView title="Could not complete CLI authentication" message={reason} />;
  }

  // Hand off to the CLI's loopback listener.
  // The CLI server returns its own "you may close this tab" page.
  const callback = `http://127.0.0.1:${result.port}/callback?code=${encodeURIComponent(result.code)}&state=${encodeURIComponent(result.state)}`;
  redirect(callback);
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
