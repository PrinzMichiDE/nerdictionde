import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/reading-history-preference
 * Holt die Leseverlauf-Einstellung des Users
 */
export async function GET() {
  try {
    const auth = await requireTwitchAuth(new NextRequest(new URL('/api/user/reading-history-preference', 'http://localhost')));
    if (auth instanceof NextResponse) return auth;

    const user = await prisma.twitchUser.findUnique({
      where: { id: auth.userId },
      select: { readingHistoryEnabled: true },
    });

    return NextResponse.json({ enabled: user?.readingHistoryEnabled ?? false });
  } catch (error) {
    console.error('[GET /api/user/reading-history-preference] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

/**
 * POST /api/user/reading-history-preference
 * Aktualisiert die Leseverlauf-Einstellung
 * Body: { enabled: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireTwitchAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled muss ein Boolean sein' }, { status: 400 });
    }

    await prisma.twitchUser.update({
      where: { id: auth.userId },
      data: { readingHistoryEnabled: enabled },
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('[POST /api/user/reading-history-preference] Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}