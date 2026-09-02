/**
 * After Authorize. Do not send the human to a raw localhost URL as the
 * only next screen. That shows "connection refused" on Cursor / Claude
 * Desktop / headless hosts and looks like failure. Stay here, ping
 * loopback in the background, and send them back to the agent chat
 * they came from. Workspace is optional. Terminal is not the product.
 */

import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";
import Link from "next/link";
import { WORKSPACE_AFTER_CLI_AUTH } from "@/lib/onboarding-first-call";
import { LocalhostHandoff } from "./LocalhostHandoff";

export default async function CliAuthDonePage({
  searchParams,
}: {
  searchParams: Promise<{ authId?: string; port?: string; code?: string; state?: string }>;
}) {
  const { port, code, state } = await searchParams;

  return (
    <main className="claw flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader signInHref={null} />
      <section className="claw-container flex-1 py-16 sm:py-20">
        <div className="mx-auto max-w-[28rem]">
          <p className="claw-eyebrow">Agent sign-in</p>
          <h1 className="claw-display mt-3 text-[2.2rem] sm:text-[2.75rem]">Authorized. Go back to your agent.</h1>
          <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">
            You are signed in. Return to Claude, Codex, Cursor, Grok, or whichever chat you used.
            Your agent confirms the sign-in and makes the first call there. Connection refused on localhost is OK.
          </p>
          <p className="mt-8 text-[15px] leading-[1.65] text-text-primary">
            Go back to that chat and retry. Do not wait here.
          </p>
          <p className="mt-6 text-[13px] text-text-muted">
            Workspace is optional. The first call happens in that chat, not here.{" "}
            <Link href={WORKSPACE_AFTER_CLI_AUTH} className="underline underline-offset-2">
              Open workspace
            </Link>
          </p>
          <LocalhostHandoff port={port} code={code} state={state} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
