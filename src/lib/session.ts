import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production-min-32-chars"
);

export async function getServerSession(): Promise<{
  userId: string;
  username: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("twitch_session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as { userId?: string; username?: string };
    if (!p.userId || !p.username) return null;

    return { userId: p.userId, username: p.username };
  } catch {
    return null;
  }
}
