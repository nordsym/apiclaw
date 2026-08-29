/**
 * After Authorize. Do not send the human to a raw localhost URL as the
 * only next screen — that shows "connection refused" on Cursor / Claude
 * Desktop / headless hosts and looks like failure. Stay here, ping
 * loopback in the background, and tell them to loop whoami.
 */

import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";
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
          <p className="claw-eyebrow">CLI sign-in</p>
          <h1 className="claw-display mt-3 text-[2.2rem] sm:text-[2.75rem]">Authorized. Return to the terminal.</h1>
          <p className="mt-5 text-[15px] leading-[1.65] text-text-secondary">
            Clerk and Authorize are done. The terminal writes{" "}
            <code className="claw-mono text-[13px] text-text-primary">session_token</code> next.
            Connection refused on localhost is OK. Loop{" "}
            <code className="claw-mono text-[13px] text-text-primary">npx @nordsym/apiclaw auth whoami</code>{" "}
            until it prints your email. Do not declare ready before that.
          </p>
          <LocalhostHandoff port={port} code={code} state={state} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
