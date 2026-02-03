import { NextRequest, NextResponse } from "next/server";
import { verifySession, getTwitchUser } from "@/lib/auth-twitch";

/**
 * GET /api/auth/twitch/me
 * Returns current user information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getTwitchUser(session.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    );
  }
}
