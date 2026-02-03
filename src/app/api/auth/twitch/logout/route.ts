import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/twitch/logout
 * Logs out the user by clearing the session cookie
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(process.env.SESSION_COOKIE_NAME || "twitch_session");
  return response;
}
