import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex";
import {
  BOOKING_SOURCES,
  clientIpFromHeaders,
  isBlockedIp,
  validateBooking,
  type BookingSource,
} from "@/lib/booking-guard";

export const runtime = "nodejs";

const WEBHOOKS: Record<BookingSource, string> = {
  [BOOKING_SOURCES.enterprise]: "https://nordsym.app.n8n.cloud/webhook/aeo-booking",
  [BOOKING_SOURCES.publicBook]: "https://nordsym.app.n8n.cloud/webhook/apiclaw-booking",
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason: "ip" | "email" | null;
};

function json(body: unknown, status: number, headers?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function reject(ip: string, reason: string) {
  console.warn("booking rejected", { ip, reason });
}

export async function POST(req: NextRequest) {
  const ip = clientIpFromHeaders(req.headers);
  if (!ip) {
    reject("unknown", "missing_client_ip");
    return json({ success: false, error: "service_unavailable" }, 503);
  }

  if (isBlockedIp(ip, process.env.BOOKING_BLOCKED_IPS)) {
    reject(ip, "blocked_ip");
    return json({ success: false, error: "forbidden" }, 403);
  }

  let body: unknown;
  try {
    const rawBody = await req.text();
    if (rawBody.length > 20_000) {
      reject(ip, "request_too_large");
      return json({ success: false, error: "invalid_booking" }, 400);
    }
    body = JSON.parse(rawBody);
  } catch {
    reject(ip, "invalid_json");
    return json({ success: false, error: "invalid_booking" }, 400);
  }

  const validation = validateBooking(body);
  if (!validation.ok) {
    reject(ip, validation.error);
    return json({ success: false, error: validation.error }, 400);
  }

  const internalSecret = process.env.APICLAW_INTERNAL_SECRET;
  if (!internalSecret) {
    reject(ip, "rate_limit_unavailable");
    return json({ success: false, error: "service_unavailable" }, 503);
  }

  let limit: RateLimitResult;
  try {
    limit = await convexMutation<RateLimitResult>("bookingGuard:consume", {
      internalSecret,
      ip,
      email: validation.value.email,
    });
    if (typeof limit?.allowed !== "boolean" || !Number.isFinite(limit.retryAfterSeconds)) {
      throw new Error("invalid rate-limit response");
    }
  } catch {
    reject(ip, "rate_limit_unavailable");
    return json({ success: false, error: "service_unavailable" }, 503);
  }

  if (!limit.allowed) {
    const retryAfter = String(Math.max(1, Math.ceil(limit.retryAfterSeconds)));
    reject(ip, `rate_limited_${limit.reason || "unknown"}`);
    return json(
      { success: false, error: "rate_limited" },
      429,
      { "Retry-After": retryAfter },
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.BOOKING_WEBHOOK_SECRET) {
    headers["x-apiclaw-booking-secret"] = process.env.BOOKING_WEBHOOK_SECRET;
  }

  try {
    const webhookResponse = await fetch(WEBHOOKS[validation.value.source], {
      method: "POST",
      headers,
      body: JSON.stringify(validation.value.webhookPayload),
      cache: "no-store",
    });
    if (!webhookResponse.ok) {
      console.error("booking webhook failed", { ip, status: webhookResponse.status });
      return json({ success: false, error: "booking_failed" }, 502);
    }
    return json({ success: true }, 200);
  } catch {
    console.error("booking webhook unavailable", { ip });
    return json({ success: false, error: "booking_failed" }, 502);
  }
}
