import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";

// ============================================
// EMAIL TEMPLATES
// ============================================

const EMAIL_FROM = "APIClaw <noreply@apiclaw.nordsym.com>";
const APP_URL = "https://apiclaw.nordsym.com";

// Base email wrapper
function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <span style="font-size: 48px;">🦞</span>
              <h1 style="margin: 16px 0 0; font-size: 24px; font-weight: 700; color: #0a0a0a;">APIClaw</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 12px; color: #737373; text-align: center;">
                <a href="https://apiclaw.nordsym.com" style="color: #ef4444; text-decoration: none;">APIClaw</a> — The API Layer for AI Agents
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #a3a3a3; text-align: center;">
                © ${new Date().getFullYear()} NordSym. Stockholm, Sweden.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Magic link email template
function magicLinkEmailTemplate(verifyUrl: string): string {
  return wrapEmail(`
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0a0a0a; text-align: center;">
      An AI Agent Wants to Connect
    </h2>
    
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #525252; text-align: center;">
      Click the button below to verify your email and activate your APIClaw workspace. 
      Your agent will be able to use APIs immediately.
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          <a href="${verifyUrl}" style="display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify Email & Activate
          </a>
        </td>
      </tr>
    </table>
    
    <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        <strong>⚡ Free tier:</strong> 50 API calls included. No credit card required.
      </p>
    </div>
    
    <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
      This link expires in 1 hour. If you didn't request this, ignore this email.
    </p>
  `);
}

// Reminder email template
function reminderEmailTemplate(verifyUrl: string): string {
  return wrapEmail(`
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0a0a0a; text-align: center;">
      Still Waiting for You 👋
    </h2>
    
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #525252; text-align: center;">
      Your AI agent is patiently waiting for you to verify your email. 
      Click below to activate your workspace and let it get to work!
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          <a href="${verifyUrl}" style="display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify & Get Started
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
      This link expires in 1 hour.
    </p>
  `);
}

// Limit reached email template
function limitReachedEmailTemplate(upgradeUrl: string): string {
  return wrapEmail(`
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #0a0a0a; text-align: center;">
      Free Tier Limit Reached
    </h2>
    
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #525252; text-align: center;">
      Your AI agent has used all 100 free API calls. Add a payment method to continue using APIClaw.
    </p>
    
    <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0a0a0a;">Pro Plan — $10/month</p>
      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #525252; line-height: 1.8;">
        <li>10,000 API calls/month</li>
        <li>Priority support</li>
        <li>Usage analytics</li>
      </ul>
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px;">
          <a href="${upgradeUrl}" style="display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Upgrade Now
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
      Questions? Reply to this email.
    </p>
  `);
}

// ============================================
// EMAIL SENDING ACTIONS
// ============================================

/**
 * Send magic link email
 */
export const sendMagicLinkEmail = action({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const verifyUrl = `${APP_URL}/auth/verify?token=${args.token}`;
    const html = magicLinkEmailTemplate(verifyUrl);

    const textContent = `
APIClaw - An AI Agent Wants to Connect

Click the link below to verify your email and activate your APIClaw workspace.
Your agent will be able to use APIs immediately.

Verify here: ${verifyUrl}

Free tier: 50 API calls included. No credit card required.

This link expires in 1 hour. If you didn't request this, ignore this email.

---
APIClaw - The API Layer for AI Agents
© ${new Date().getFullYear()} NordSym. Stockholm, Sweden.
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.email,
        subject: "🦞 An AI Agent Wants to Connect — Verify Your Email",
        html,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return { success: true };
  },
});

/**
 * Send reminder email
 */
export const sendReminderEmail = action({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const verifyUrl = `${APP_URL}/auth/verify?token=${args.token}`;
    const html = reminderEmailTemplate(verifyUrl);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.email,
        subject: "🦞 Your Agent is Still Waiting — Verify Your Email",
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return { success: true };
  },
});

/**
 * Send limit reached email
 */
export const sendLimitReachedEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const upgradeUrl = `${APP_URL}/upgrade`;
    const html = limitReachedEmailTemplate(upgradeUrl);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.email,
        subject: "🦞 Free Tier Limit Reached — Upgrade to Continue",
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return { success: true };
  },
});
