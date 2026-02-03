import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import prisma from "./prisma";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production-min-32-chars"
);

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "twitch_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Encrypt sensitive data (tokens) before storing in database
 */
export function encryptToken(text: string): string {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY || "your-32-char-encryption-key-here!!",
    "utf8"
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data (tokens) from database
 */
export function decryptToken(encryptedText: string): string {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY || "your-32-char-encryption-key-here!!",
    "utf8"
  );

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Create JWT session token
 */
export async function createSession(userId: string, twitchId: string, username: string): Promise<string> {
  const token = await new SignJWT({ userId, twitchId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT session token
 */
export async function verifySession(
  request: NextRequest
): Promise<{ userId: string; twitchId: string; username: string } | null> {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; twitchId: string; username: string };
  } catch (error) {
    return null;
  }
}

/**
 * Require Twitch authentication - returns userId or error response
 */
export async function requireTwitchAuth(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.userId };
}

/**
 * Initiate Twitch OAuth flow
 */
export function initiateTwitchOAuth(): string {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = process.env.TWITCH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/twitch/callback`;
  const scopes = [
    "user:read:email",
    "channel:read:stream_key",
    "channel:manage:broadcast",
    "moderator:read:followers",
    "user:read:subscriptions",
  ].join(" ");

  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId || "");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  return authUrl.toString();
}

/**
 * Handle Twitch OAuth callback
 */
export async function handleTwitchCallback(
  code: string,
  state: string
): Promise<{ userId: string; twitchId: string; username: string } | null> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.TWITCH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/twitch/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return null;
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info from Twitch
    const userResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": clientId || "",
      },
    });

    if (!userResponse.ok) {
      console.error("User fetch failed:", await userResponse.text());
      return null;
    }

    const userData = await userResponse.json();
    const twitchUser = userData.data[0];

    if (!twitchUser) {
      return null;
    }

    // Create or update user in database
    const user = await prisma.twitchUser.upsert({
      where: { twitchId: twitchUser.id },
      update: {
        username: twitchUser.login,
        displayName: twitchUser.display_name,
        email: twitchUser.email,
        profileImageUrl: twitchUser.profile_image_url,
        accessToken: encryptToken(access_token),
        refreshToken: refresh_token ? encryptToken(refresh_token) : null,
        tokenExpiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null,
        broadcasterType: twitchUser.broadcaster_type || "",
        updatedAt: new Date(),
      },
      create: {
        twitchId: twitchUser.id,
        username: twitchUser.login,
        displayName: twitchUser.display_name,
        email: twitchUser.email,
        profileImageUrl: twitchUser.profile_image_url,
        accessToken: encryptToken(access_token),
        refreshToken: refresh_token ? encryptToken(refresh_token) : null,
        tokenExpiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null,
        broadcasterType: twitchUser.broadcaster_type || "",
      },
    });

    return {
      userId: user.id,
      twitchId: user.twitchId,
      username: user.username,
    };
  } catch (error) {
    console.error("Twitch callback error:", error);
    return null;
  }
}

/**
 * Refresh Twitch access token
 */
export async function refreshAccessToken(userId: string): Promise<boolean> {
  try {
    const user = await prisma.twitchUser.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      return false;
    }

    const refreshToken = decryptToken(user.refreshToken);
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const tokenData = await response.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    await prisma.twitchUser.update({
      where: { id: userId },
      data: {
        accessToken: encryptToken(access_token),
        refreshToken: refresh_token ? encryptToken(refresh_token) : null,
        tokenExpiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : null,
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    return false;
  }
}

/**
 * Get Twitch user from database
 */
export async function getTwitchUser(userId: string) {
  return prisma.twitchUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      twitchId: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
      broadcasterType: true,
      createdAt: true,
    },
  });
}
