import { NextRequest, NextResponse } from "next/server";
import { SOW_CUSTOMERS } from "@/lib/sow-data";
import { mcQuery } from "@/lib/mc-convex";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");

  if (!customerId || !SOW_CUSTOMERS[customerId]) {
    return NextResponse.json(
      { error: "Unknown customer" },
      { status: 404 }
    );
  }

  try {
    const sow = await mcQuery<{
      status: string;
      signedAt?: number;
    } | null>("sows:getByCustomerId", {
      customerId: `apiclaw-${customerId}`,
    });

    return NextResponse.json({
      exists: !!sow,
      status: sow?.status || "pending",
      signedAt: sow?.signedAt || null,
    });
  } catch {
    // If no document exists yet, that's fine
    return NextResponse.json({
      exists: false,
      status: "pending",
      signedAt: null,
    });
  }
}
