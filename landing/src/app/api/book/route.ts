import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK = "https://nordsym.app.n8n.cloud/webhook/apiclaw-booking";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ success: false, error: text }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Book proxy error:", err);
    return NextResponse.json({ success: false, error: "proxy_error" }, { status: 500 });
  }
}
