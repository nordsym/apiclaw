// /api/oauth/authorize — POST handler invoked by the consent UI when the
// user clicks "Authorize". The browser already passed Clerk middleware to
// reach the consent page, so we know there's an active apiclaw session.
import { NextRequest, NextResponse } from "next/server";
import { convexMutation, ConvexCallError } from "@/lib/convex";
import { parseSafeOAuthRedirectUri } from "@/lib/oauth-redirect";

export const runtime = "nodejs";

type AuthorizePayload = {
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  scope?: unknown;
  code_challenge?: string;
  code_challenge_method?: string;
};

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get("apiclaw_workspace_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: AuthorizePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { client_id, redirect_uri, scope, code_challenge, code_challenge_method, state } = body;
  if (!client_id || !redirect_uri || !code_challenge) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if ((code_challenge_method ?? "S256") !== "S256") {
    return NextResponse.json({ error: "unsupported_code_challenge_method" }, { status: 400 });
  }
  if (Object.prototype.hasOwnProperty.call(body, "scope") && typeof scope !== "string") {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }
  const safeRedirect = parseSafeOAuthRedirectUri(redirect_uri);
  if (!safeRedirect) {
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }

  try {
    const { code } = await convexMutation<{ code: string }>("mcpOAuth:mintAuthCode", {
      sessionToken,
      clientId: client_id,
      redirectUri: redirect_uri,
      ...(typeof scope === "string" ? { scope } : {}),
      codeChallenge: code_challenge,
      codeChallengeMethod: "S256",
    });

    const target = safeRedirect;
    target.searchParams.set("code", code);
    if (state) target.searchParams.set("state", state);

    return NextResponse.json({ redirect: target.toString() }, { status: 200 });
  } catch (e) {
    const msg = e instanceof ConvexCallError ? e.message : (e instanceof Error ? e.message : "server_error");
    return NextResponse.json({ error: "authorize_failed", error_description: msg }, { status: 400 });
  }
}
