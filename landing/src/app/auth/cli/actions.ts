"use server";

/**
 * Server action behind the "Authorize" button on /auth/cli. This is the
 * existing-session consent path — claim never runs on a bare GET. Fresh
 * Clerk from an unsigned /auth/cli visit is claimed in clerk-bridge
 * instead (one human action: complete Google/email).
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTHID_FORMAT } from "./shared";
import { claimCliAuthId, cliAuthClaimErrorPath, cliAuthDonePath } from "./claim";

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

  const result = await claimCliAuthId(authId, userId, email);

  if (!result.success || !result.code || !result.port || !result.state) {
    redirect(cliAuthClaimErrorPath(authId, result.error));
  }

  // Land on a success page. Best-effort ping localhost for a live CLI on
  // the same machine. New CLIs / whoami poll Convex for the claimed code,
  // so a connection-refused loopback is no longer a dead end.
  redirect(cliAuthDonePath({
    authId,
    port: result.port,
    code: result.code,
    state: result.state,
  }));
}
