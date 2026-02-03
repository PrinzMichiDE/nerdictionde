import { NextRequest, NextResponse } from "next/server";
import { handleTwitchCallback, createSession } from "@/lib/auth-twitch";

/**
 * GET /api/auth/twitch/callback
 * Handles Twitch OAuth callback
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/login?error=no_code", req.url)
      );
    }

    const userData = await handleTwitchCallback(code, state || "");

    if (!userData) {
      return NextResponse.redirect(
        new URL("/login?error=auth_failed", req.url)
      );
    }

    // Create session
    const sessionToken = await createSession(
      userData.userId,
      userData.twitchId,
      userData.username
    );

    // Set session cookie
    const response = NextResponse.redirect(new URL("/tools", req.url));
    response.cookies.set(
      process.env.SESSION_COOKIE_NAME || "twitch_session",
      sessionToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("Twitch callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=callback_error", req.url)
    );
  }
}
