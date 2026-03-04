import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

export async function GET(req: NextRequest) {
  try {
    // Get session from cookie or Authorization header
    const cookieToken = req.cookies.get("apiclaw_workspace_session")?.value;
    const headerToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    // Verify session in Convex
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "workspaces:getSession",
        args: { token },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    const result = await response.json();
    const session = result.value || result;

    if (!session) {
      // Clear invalid cookie
      const res = NextResponse.json({ session: null }, { status: 200 });
      res.cookies.delete("apiclaw_workspace_session");
      return res;
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("apiclaw_workspace_session")?.value;
    const headerToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    const token = cookieToken || headerToken;

    if (token) {
      // Logout in Convex
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:logout",
          args: { token },
        }),
      });
    }

    // Clear cookie
    const res = NextResponse.json({ success: true });
    res.cookies.delete("apiclaw_workspace_session");
    return res;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
