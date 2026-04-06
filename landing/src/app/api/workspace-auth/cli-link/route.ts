/**
 * CLI Magic Link Endpoint
 * Creates a magic link and returns the token directly (for polling).
 * Also fires the email so the user can click to verify.
 * Called by: npx @nordsym/apiclaw login
 */
import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://apiclaw.cloud";

export async function POST(req: NextRequest) {
  try {
    const { email, fingerprint } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Create magic link token in Convex
    const convexRes = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "workspaces:createMagicLink",
        args: { email: normalizedEmail, fingerprint: fingerprint || undefined },
      }),
    });

    if (!convexRes.ok) {
      throw new Error("Failed to create magic link");
    }

    const convexData = await convexRes.json();
    const token: string | undefined =
      convexData?.value?.token || convexData?.token;

    if (!token) {
      throw new Error("No token returned from Convex");
    }

    // Build verify URL
    const verifyUrl = `${APP_URL}/auth/verify?token=${token}`;

    // Fire email via symbot-gmail webhook (non-blocking — fire and forget)
    fetch("https://nordsym.app.n8n.cloud/webhook/symbot-gmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "smtp",
        to: normalizedEmail,
        subject: "Sign in to APIClaw",
        message: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <span style="font-size:48px;">🦞</span>
              <h1 style="margin:16px 0 8px;font-size:24px;font-weight:700;">Sign in to APIClaw</h1>
              <p style="color:#737373;margin:0;">You ran <code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;">npx @nordsym/apiclaw login</code></p>
            </div>
            <p style="color:#525252;font-size:16px;line-height:1.6;text-align:center;">
              Click below to verify your email and complete setup in your terminal.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}" style="display:inline-block;background:#ef4444;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
                Verify Email &amp; Continue
              </a>
            </div>
            <p style="color:#737373;font-size:14px;text-align:center;">
              Expires in 15 minutes. Your terminal is waiting.
            </p>
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e5e5;">
              <p style="color:#a3a3a3;font-size:12px;text-align:center;">
                APIClaw by NordSym &middot; If you didn't request this, ignore it.
              </p>
            </div>
          </div>
        `,
      }),
    }).catch(() => {
      // Email failure is non-fatal — token is still valid
    });

    // Return token to CLI for polling
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("CLI link error:", error);
    return NextResponse.json(
      { error: "Failed to create login link" },
      { status: 500 }
    );
  }
}
