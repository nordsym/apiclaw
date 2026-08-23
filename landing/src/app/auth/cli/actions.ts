"use server";

/**
 * Server action behind the "Authorize" button on /auth/cli. This is the only
 * place cliAuth:claim is ever called — it never runs on a bare GET, so a
 * signed-in browser navigated here by a hostile page cannot bind a CLI
 * session without the user explicitly submitting this form.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTHID_FORMAT } from "./shared";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

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
  } catch {
    return { success: false, error: "convex_unreachable" };
  }
}

export async function authorizeCli(formData: FormData): Promise<void> {
  const rawAuthId = formData.get("authId");
  const authId = typeof rawAuthId === "string" ? rawAuthId : "";

  if (!AUTHID_FORMAT.test(authId)) {
    redirect("/auth/cli?authId=invalid&error=invalid_link");
  }

  // Identity comes from the server-side session, never from the form.
  const { userId } = await auth();
  if (!userId) {
    const here = `/auth/cli?authId=${encodeURIComponent(authId)}`;
    redirect(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
  }

  const user = await currentUser();
  const verifiedPrimary = user?.primaryEmailAddress?.verification?.status === "verified"
    ? user.primaryEmailAddress.emailAddress
    : undefined;
  const verifiedFallback = user?.emailAddresses?.find(
    (address) => address.verification?.status === "verified",
  )?.emailAddress;
  const email = verifiedPrimary || verifiedFallback;

  if (!email) {
    redirect(`/auth/cli?authId=${encodeURIComponent(authId)}&error=no_email`);
  }

  const result = await claimAuthId(authId, userId, email);

  if (!result.success || !result.code || !result.port || !result.state) {
    redirect(`/auth/cli?authId=${encodeURIComponent(authId)}&error=${encodeURIComponent(result.error ?? "unknown")}`);
  }

  // Hand off to the CLI's loopback listener.
  // The CLI server returns its own "you may close this tab" page.
  const callback = `http://127.0.0.1:${result.port}/callback?code=${encodeURIComponent(result.code)}&state=${encodeURIComponent(result.state)}`;
  redirect(callback);
}
