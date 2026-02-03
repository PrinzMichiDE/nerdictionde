import { NextRequest, NextResponse } from "next/server";
import { initiateTwitchOAuth } from "@/lib/auth-twitch";

/**
 * GET /api/auth/twitch/login
 * Initiates Twitch OAuth flow
 */
export async function GET(req: NextRequest) {
  try {
    const authUrl = initiateTwitchOAuth();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Twitch login error:", error);
    return NextResponse.json(
      { error: "Failed to initiate login" },
      { status: 500 }
    );
  }
}
