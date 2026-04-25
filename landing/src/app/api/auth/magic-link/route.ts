import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Create magic link in Convex
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "providers:createMagicLink",
        args: { email: email.toLowerCase() },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create magic link");
    }

    const result = await response.json();
    
    // Convex wraps response in { status: "success", value: {...} }
    const token = result.value?.token || result.token;
    
    if (!token) {
      throw new Error("Failed to get token from Convex");
    }

    // Send magic link email via Resend on the verified apiclaw.cloud domain.
    // Previously routed through n8n symbot-gmail → from address was
    // symbot@nordsym.com which broke brand consistency with the rest of
    // APIClaw's lifecycle emails (OTP, limit-reached, invoice).
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://apiclaw.cloud"}/auth/verify?token=${token}`;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 48px;">🦞</span>
          <h1 style="margin: 16px 0 8px; font-size: 24px; font-weight: 700;">Sign in to APIClaw</h1>
        </div>

        <p style="color: #525252; font-size: 16px; line-height: 1.6; text-align: center;">
          Click the button below to sign in to your workspace.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${magicLinkUrl}" style="display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Sign In to Workspace
          </a>
        </div>

        <p style="color: #737373; font-size: 14px; text-align: center;">
          This link expires in 15 minutes.
        </p>

        <p style="color: #737373; font-size: 12px; margin-top: 40px; text-align: center;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APIClaw <noreply@apiclaw.cloud>",
        to: email,
        subject: "Sign in to APIClaw Workspace",
        html,
      }),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Resend magic link send failed:", errorText);
      return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}
