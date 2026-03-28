import { NextRequest, NextResponse } from "next/server";
import { SOW_CUSTOMERS } from "@/lib/sow-data";

const BOOKING_WEBHOOK = "https://nordsym.app.n8n.cloud/webhook/symbot-calendar-v2";
const EMAIL_WEBHOOK = "https://nordsym.app.n8n.cloud/webhook/symbot-gmail";

// RFC3339 datetime with explicit timezone offset (no UTC conversion)
function getOffsetString(dateStr: string, timeZone: string): string {
  const baseDate = new Date(dateStr + "Z");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(baseDate).map((p) => [p.type, p.value])
  );
  const tzDate = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`
  );
  const offsetMs = tzDate.getTime() - baseDate.getTime();
  const offsetMins = Math.round(offsetMs / 60000);
  const sign = offsetMins >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMins);
  const oh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const om = String(absMin % 60).padStart(2, "0");
  return `${sign}${oh}:${om}`;
}

function internalNotificationHtml(data: Record<string, string>): string {
  const tz = (data.timezone || "Europe/Stockholm").split("/").pop()?.replace(/_/g, " ") || "Stockholm";
  const safeAgenda = (data.agenda || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:40px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <div style="background:#dc2626;color:white;padding:24px;text-align:center;">
    <div style="font-size:22px;font-weight:800;">APIClaw.</div>
    <h1 style="margin:8px 0 0;font-size:16px;">Kickoff Meeting Booked</h1>
  </div>
  <div style="padding:28px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:8px 0;color:#737373;">Customer</td><td style="padding:8px 0;font-weight:600;">${data.customerName}</td></tr>
      <tr><td style="padding:8px 0;color:#737373;">Contact</td><td style="padding:8px 0;font-weight:600;">${data.signerName} · ${data.signerTitle || "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#737373;">Email</td><td style="padding:8px 0;">${data.signerEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#737373;">Date</td><td style="padding:8px 0;font-weight:600;">${data.requestedDate}</td></tr>
      <tr><td style="padding:8px 0;color:#737373;">Time</td><td style="padding:8px 0;font-weight:600;">${data.requestedTime} (${tz})</td></tr>
    </table>
    <div style="margin-top:16px;padding:12px;background:#fafafa;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#999;">Agenda</p>
      <p style="margin:0;color:#334155;font-size:13px;line-height:1.7;">${safeAgenda}</p>
    </div>
  </div>
  <div style="padding:16px 28px;background:#fafafa;border-top:1px solid #e5e5e5;text-align:center;">
    <p style="margin:0;font-size:11px;color:#999;">APIClaw — Automated booking notification</p>
  </div>
</div>
</body></html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      signerName,
      signerEmail,
      signerTitle,
      requestedDate,
      requestedTime,
      timezone,
      agenda,
    } = body;

    const required = ["customerId", "signerName", "signerEmail", "requestedDate", "requestedTime", "agenda"];
    for (const k of required) {
      if (!String(body[k] || "").trim()) {
        return NextResponse.json({ error: `${k} is required` }, { status: 400 });
      }
    }

    const tz = timezone || "Europe/Stockholm";
    const [hour, minute] = (requestedTime || "11:00").split(":").map(Number);
    const localDateStr = `${requestedDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    const offsetStr = getOffsetString(localDateStr, tz);
    const startRFC = `${localDateStr}${offsetStr}`;
    const endHour = hour + 1;
    const endDateStr =
      endHour < 24
        ? `${requestedDate}T${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
        : `${requestedDate}T23:59:00`;
    const endRFC = `${endDateStr}${offsetStr}`;

    const displayName = customerName || customerId;

    // 1. Calendar booking → Google Meet
    const bookingPayload = {
      summary: `APIClaw × ${displayName} — Kickoff Meeting`,
      start: startRFC,
      end: endRFC,
      attendees: `gustav@nordsym.com,molle@nordsym.com,${signerEmail}`,
      description: [
        `📋 KICKOFF — APIClaw × ${displayName}`,
        "",
        agenda,
        "",
        `────────────────────`,
        `👤 ${signerName}${signerTitle ? " · " + signerTitle : ""}`,
        `🤝 Gustav + Molle (APIClaw)`,
        `📍 Google Meet`,
      ].join("\n"),
      location: "Google Meet",
    };

    const bookingRes = await fetch(BOOKING_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload),
    });
    if (!bookingRes.ok) {
      return NextResponse.json({ error: "Calendar booking failed" }, { status: 502 });
    }

    // 2. Internal notification → molle + gustav
    const internalHtml = internalNotificationHtml(body);
    await fetch(EMAIL_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        to: "molle@nordsym.com,gustav@nordsym.com",
        subject: `[APIClaw Booking] ${displayName} — ${requestedDate} ${requestedTime}`,
        message: internalHtml,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
