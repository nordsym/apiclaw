import { NextRequest, NextResponse } from "next/server";
import { SOW_CUSTOMERS } from "@/lib/sow-data";
import { mcMutation } from "@/lib/mc-convex";
const PDFLAYER_KEY = process.env.PDFLAYER_KEY || process.env.APILAYER_PDFLAYER_KEY || "";

const N8N_GMAIL = "https://nordsym.app.n8n.cloud/webhook/symbot-gmail";

function generateSoWHtml(
  customerName: string,
  signerName: string,
  signerTitle: string,
  signatureDataUrl: string,
  signedDate: string
): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:700px;margin:0 auto;padding:40px;background:#fafafa;">
  <div style="background:white;border-radius:16px;padding:40px;border:1px solid #e5e5e5;">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:32px;font-weight:800;color:#dc2626;">APIClaw<span style="color:#0a0a0a;">.</span></div>
      <h1 style="margin:10px 0;color:#1a1a1a;">APIClaw \u00d7 ${customerName}</h1>
      <p style="color:#dc2626;font-weight:600;">SIGNED PARTNERSHIP AGREEMENT</p>
      <p style="color:#737373;">Signed on ${signedDate}</p>
    </div>
    <div style="border-top:2px solid #dc2626;padding-top:30px;">
      <h2 style="color:#dc2626;">Parties</h2>
      <p><strong>APIClaw / NordSym AB</strong> (org.nr 559535-5768) \u2014 Gustav Hemmingsson, CEO</p>
      <p><strong>${customerName}</strong> \u2014 ${signerName}, ${signerTitle}</p>

      <h2 style="color:#dc2626;">Integration Status</h2>
      <p>27 APILayer APIs live in APIClaw Direct Call tier (finance, geolocation, scraping, news, devtools). Zero key management required for end users.</p>

      <h2 style="color:#dc2626;">Partnership Scope</h2>
      <ol>
        <li><strong>Customer announcement</strong> \u2014 Partner communicates the APIClaw integration to its customer base.</li>
        <li><strong>Joint content</strong> \u2014 One blog post or case study.</li>
        <li><strong>Documentation feature</strong> \u2014 APIClaw referenced in partner docs.</li>
        <li><strong>Volume incentives</strong> \u2014 Tiered discount or revenue share tied to call volume.</li>
      </ol>

      <h2 style="color:#dc2626;">Duration</h2>
      <p>12-month initial term from effective date. Week 1 checkpoint to review integration performance. Auto-renews monthly. 30 days notice to terminate.</p>

      <h2 style="color:#dc2626;">Confidentiality</h2>
      <p>Commercial terms, usage data, and technical integration details are confidential. Public announcements require mutual approval.</p>
    </div>
    <div style="border-top:2px solid #e5e5e5;margin-top:30px;padding-top:30px;">
      <h2 style="color:#dc2626;">Signatures</h2>
      <table width="100%">
        <tr>
          <td style="width:50%;vertical-align:top;">
            <p style="color:#737373;font-size:12px;">APICLAW / NORDSYM AB</p>
            <p style="font-family:'Brush Script MT',cursive;font-size:24px;">Gustav Hemmingsson</p>
            <p><strong>Gustav Hemmingsson</strong><br>CEO, NordSym AB<br>${signedDate}</p>
          </td>
          <td style="width:50%;vertical-align:top;">
            <p style="color:#737373;font-size:12px;">${customerName.toUpperCase()}</p>
            <img src="${signatureDataUrl}" style="max-width:200px;max-height:80px;" alt="Signature"/>
            <p><strong>${signerName}</strong><br>${signerTitle}<br>${signedDate}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="margin-top:30px;padding:20px;background:#f0fdf4;border-radius:8px;text-align:center;">
      <p style="color:#166534;margin:0;">This document has been digitally signed by both parties.</p>
    </div>
  </div>
</body>
</html>`;
}

function generateEmailBody(
  customerName: string,
  signerName: string,
  signedDate: string
): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#dc2626;color:white;padding:24px;text-align:center;">
      <div style="font-size:26px;font-weight:800;">APIClaw.</div>
      <h1 style="margin:8px 0 0;font-size:18px;">Partnership Agreement Signed</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#166534;background:#f0fdf4;padding:12px 16px;border-radius:8px;margin:0 0 24px;">
        Partnership Agreement between APIClaw and ${customerName} has been signed.
      </p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#737373;">Signed by</td><td style="padding:8px 0;font-weight:600;">${signerName}</td></tr>
        <tr><td style="padding:8px 0;color:#737373;">Date</td><td style="padding:8px 0;font-weight:600;">${signedDate}</td></tr>
        <tr><td style="padding:8px 0;color:#737373;">Document</td><td style="padding:8px 0;font-weight:600;">Attached as HTML file</td></tr>
      </table>
    </div>
    <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="margin:0;font-size:12px;color:#737373;">APIClaw \u2014 The API Layer for AI Agents</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(
  to: string,
  subject: string,
  message: string,
  pdfBase64: string,
  filename: string
): Promise<void> {
  await fetch(N8N_GMAIL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "send",
      to,
      subject,
      message,
      attachments: [{ filename, data: pdfBase64 }],
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, signatureDataUrl, signerName, signerTitle } = body;

    if (!customerId || !signatureDataUrl || !signerName || !signerTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const customer = SOW_CUSTOMERS[customerId];
    if (!customer) {
      return NextResponse.json(
        { error: "Unknown customer" },
        { status: 404 }
      );
    }

    const signedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const signerIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // Sign on Mission Control Convex (agile-crane-840) — centralized for all NordSym products
    try {
      await mcMutation("sows:sign", {
        customerId: `apiclaw-${customerId}`,
        signatureDataUrl,
        signerName,
        signerTitle,
        signerIp,
      });
    } catch (e) {
      // Allow re-signing (e.g., sandbox testing) — log but don't block
      console.error("MC sign error (non-blocking):", e);
    }

    // Generate and send signed document
    const sowHtml = generateSoWHtml(
      customer.customerName,
      signerName,
      signerTitle,
      signatureDataUrl,
      signedDate
    );
    const emailBody = generateEmailBody(
      customer.customerName,
      signerName,
      signedDate
    );
    // Generate PDF via PDFLayer API (APIClaw's own Direct Call provider)
    let attachBase64: string;
    let filename: string;
    const safeName = customer.customerName.replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    try {
      if (!PDFLAYER_KEY) throw new Error("No PDFLayer key");
      const pdfUrl = new URL("https://api.pdflayer.com/api/convert");
      pdfUrl.searchParams.set("access_key", PDFLAYER_KEY);
      pdfUrl.searchParams.set("page_size", "A4");
      const pdfRes = await fetch(pdfUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `document_html=${encodeURIComponent(sowHtml)}`,
      });
      const contentType = pdfRes.headers.get("content-type") || "";
      if (!contentType.includes("application/pdf")) throw new Error("PDFLayer did not return PDF");
      const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
      attachBase64 = pdfBuffer.toString("base64");
      filename = `APIClaw_Partnership_${safeName}_${dateStr}.pdf`;
    } catch (pdfErr) {
      console.error("PDF generation failed, using HTML fallback:", pdfErr);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(sowHtml);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      attachBase64 = btoa(binary);
      filename = `APIClaw_Partnership_${safeName}_${dateStr}.html`;
    }
    const subject = `Signed: APIClaw × ${customer.customerName} Partnership Agreement`;

    await Promise.all([
      sendEmail("gustav@nordsym.com", subject, emailBody, attachBase64, filename),
      sendEmail("molle@nordsym.com", subject, emailBody, attachBase64, filename),
      sendEmail(customer.partnerEmail, subject, emailBody, attachBase64, filename),
    ]);

    return NextResponse.json({
      success: true,
      paymentLink: customer.paymentLink,
    });
  } catch (error) {
    console.error("SoW signing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
