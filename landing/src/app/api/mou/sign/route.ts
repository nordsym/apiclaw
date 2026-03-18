import { NextRequest, NextResponse } from "next/server";

// MOU functions deployed to brilliant-puffin-712.eu-west-1
const CONVEX_URL = "https://brilliant-puffin-712.eu-west-1.convex.cloud";

interface PartnerConfig {
  name: string;
  email: string;
  type: "integration" | "advisory";
}

const partnerConfig: Record<string, PartnerConfig> = {
  apilayer: { name: "APILayer", email: "pratham.kumar@apilayer.com", type: "integration" },
  cqtinvest: { name: "CQT Invest", email: "molle@cqtinvest.com", type: "advisory" },
  coaccept: { name: "CoAccept", email: "gustav@coaccept.com", type: "integration" },
};

function generateMouHtml(partner: PartnerConfig, signerName: string, signerTitle: string, signatureDataUrl: string, signedDate: string): string {
  const isAdvisory = partner.type === "advisory";
  
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; background: #fafafa;">
  <div style="background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e5e5;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 36px; font-weight: bold; color: #dc2626;">APIClaw</div>
      <h1 style="margin: 10px 0; color: #1a1a1a;">APIClaw x ${partner.name}</h1>
      <p style="color: #dc2626; font-weight: 600;">SIGNED MEMORANDUM OF UNDERSTANDING</p>
      <p style="color: #737373;">${isAdvisory ? 'Advisory Partnership - ' : ''}Signed on ${signedDate}</p>
    </div>
    
    <div style="border-top: 2px solid #dc2626; padding-top: 30px;">
      <h2 style="color: #dc2626;">1. Parties</h2>
      <p><strong>APIClaw</strong> (NordSym AB, org.nr 559535-5768), Gustav Hemmingsson, CEO</p>
      <p><strong>${partner.name}</strong>, ${signerName}, ${signerTitle}</p>
      
      ${isAdvisory ? `
      <h2 style="color: #dc2626;">2. Purpose</h2>
      <ul>
        <li>Strategic advisory partnership for APIClaw's growth</li>
        <li>Network access and key introductions</li>
        <li>Business development support</li>
        <li>Long-term, trust-based collaboration</li>
      </ul>
      
      <h2 style="color: #dc2626;">3. ${partner.name} Provides</h2>
      <ul>
        <li><strong>Strategic Advisory:</strong> Business strategy and growth guidance</li>
        <li><strong>Network & Introductions:</strong> Access to customers, partners, investors</li>
        <li><strong>Business Development:</strong> Deal structuring and negotiations</li>
      </ul>
      
      <h2 style="color: #dc2626;">4. APIClaw / NordSym Provides</h2>
      <ul>
        <li><strong>Product Access:</strong> Full platform access</li>
        <li><strong>Revenue Share:</strong> Success fee on referred deals</li>
        <li><strong>Collaboration:</strong> Open communication</li>
      </ul>
      
      <h2 style="color: #dc2626;">5. Terms</h2>
      <ul>
        <li>Non-exclusive partnership</li>
        <li>Good faith collaboration</li>
        <li>Confidential business information</li>
        <li>30-day notice for termination</li>
      </ul>
      ` : `
      <h2 style="color: #dc2626;">2. Purpose</h2>
      <ul>
        <li>Putting ${partner.name}'s APIs in front of AI Agents</li>
        <li>Providing ${partner.name} with featured provider status and attribution</li>
        <li>Exploring co-marketing opportunities</li>
        <li>Enabling AI agents to discover and use ${partner.name} APIs</li>
      </ul>
      
      <h2 style="color: #dc2626;">3. Proposed Collaboration</h2>
      <p><strong>Phase 1:</strong> Discovery Integration</p>
      <p><strong>Phase 2:</strong> Direct Call Pilot</p>
      <p><strong>Phase 3:</strong> Scale & Co-Marketing</p>
      
      <h2 style="color: #dc2626;">4. Non-Binding Intent</h2>
      <p>This MOU is not legally binding. It serves as a foundation for further discussions.</p>
      
      <h2 style="color: #dc2626;">5. Confidentiality</h2>
      <p>Both parties agree to treat shared business information as confidential.</p>
      
      <h2 style="color: #dc2626;">6. Next Steps</h2>
      <ul>
        <li>Set up Telegram group for technical coordination</li>
        <li>Agree on pilot APIs and integration approach</li>
        <li>Launch pilot, iterate based on learnings</li>
      </ul>
      `}
    </div>
    
    <div style="border-top: 2px solid #e5e5e5; margin-top: 30px; padding-top: 30px;">
      <h2 style="color: #dc2626;">Signatures</h2>
      <table width="100%">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <p style="color: #737373; font-size: 12px;">APICLAW / NORDSYM AB</p>
            <p style="font-family: 'Brush Script MT', cursive; font-size: 24px;">Gustav Hemmingsson</p>
            <p><strong>Gustav Hemmingsson</strong><br>CEO, NordSym AB<br>March 5, 2026</p>
          </td>
          <td style="width: 50%; vertical-align: top;">
            <p style="color: #737373; font-size: 12px;">${partner.name.toUpperCase()}</p>
            <img src="${signatureDataUrl}" style="max-width: 200px; max-height: 80px;" alt="Signature"/>
            <p><strong>${signerName}</strong><br>${signerTitle}<br>${signedDate}</p>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="color: #166534; margin: 0;">This document has been digitally signed by both parties</p>
    </div>
  </div>
</body>
</html>`;
}

function generateEmailBody(partner: PartnerConfig, signerName: string, signerTitle: string, signedDate: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 40px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #dc2626; color: white; padding: 24px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold;">APIClaw</div>
      <h1 style="margin: 8px 0 0; font-size: 20px;">APIClaw x ${partner.name}</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #166534; background: #f0fdf4; padding: 12px 16px; border-radius: 8px; margin: 0 0 24px;">
        ✓ MOU has been signed successfully
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #737373;">Signed by</td>
          <td style="padding: 8px 0; font-weight: 600;">${signerName}, ${signerTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #737373;">Date</td>
          <td style="padding: 8px 0; font-weight: 600;">${signedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #737373;">Document</td>
          <td style="padding: 8px 0; font-weight: 600;">Attached as HTML file</td>
        </tr>
      </table>
    </div>
    <div style="padding: 16px 32px; background: #fafafa; border-top: 1px solid #e5e5e5; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #737373;">APIClaw - The API Layer for AI Agents</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmailWithAttachment(
  to: string,
  subject: string,
  partner: PartnerConfig,
  signerName: string,
  signerTitle: string,
  signedDate: string,
  attachmentHtml: string,
  filename: string
): Promise<boolean> {
  try {
    // Use TextEncoder for proper UTF-8 base64 encoding
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(attachmentHtml);
    let binary = '';
    uint8Array.forEach(byte => binary += String.fromCharCode(byte));
    const base64Data = btoa(binary);

    const emailBody = generateEmailBody(partner, signerName, signerTitle, signedDate);

    const response = await fetch("https://nordsym.app.n8n.cloud/webhook/symbot-gmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        to,
        subject,
        message: emailBody,
        attachments: [
          {
            filename: filename,
            data: base64Data,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Failed to send email to ${to}`);
      return false;
    }
    
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, signatureDataUrl, signerName, signerTitle } = body;

    if (!partnerId || !signatureDataUrl || !signerName || !signerTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const partner = partnerConfig[partnerId];
    if (!partner) {
      return NextResponse.json(
        { error: "Unknown partner" },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const signerIp = forwardedFor?.split(",")[0] || "unknown";

    // Check if MOU exists
    const queryResponse = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "mou:getByPartnerId",
        args: { partnerId },
      }),
    });

    const queryResult = await queryResponse.json();
    const existingMOU = queryResult.value;

    // Create MOU if not exists
    if (!existingMOU) {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "mou:create",
          args: {
            partnerId,
            partnerName: partner.name,
            partnerEmail: partner.email,
            documentHtml: "",
          },
        }),
      });
    }

    // Sign the MOU
    const signResponse = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "mou:sign",
        args: {
          partnerId,
          signatureDataUrl,
          signerName,
          signerTitle,
          signerIp,
        },
      }),
    });

    const signResult = await signResponse.json();

    if (signResult.status === "error") {
      return NextResponse.json(
        { error: signResult.errorMessage || "Failed to sign MOU" },
        { status: 500 }
      );
    }

    // Generate signed MOU
    const signedDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    const mouHtml = generateMouHtml(partner, signerName, signerTitle, signatureDataUrl, signedDate);
    
    const filename = `APIClaw_MOU_${partner.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    const emailSubject = `Signed MOU: APIClaw x ${partner.name}`;

    // Send to both parties
    await Promise.all([
      sendEmailWithAttachment("gustav@nordsym.com", emailSubject, partner, signerName, signerTitle, signedDate, mouHtml, filename),
      sendEmailWithAttachment(partner.email, emailSubject, partner, signerName, signerTitle, signedDate, mouHtml, filename),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MOU signing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
