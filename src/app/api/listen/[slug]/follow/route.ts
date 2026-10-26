import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import prisma from '@/lib/prisma';
import { isCollectionsFollowEnabled } from '@/lib/collections-follow-schema';
import { followParamsSchema, followRequestSchema, followStatusSchema, followToggleResponseSchema } from '@/lib/collections-follow-schema';
import { toggleFollow, getFollowStatusBySlug } from '@/lib/collections-follow';

/**
 * API Route: Follow/Unfollow/Status für Review Collections
 * POST   /api/listen/[slug]/follow  - Liste folgen
 * DELETE /api/listen/[slug]/follow  - Liste nicht mehr folgen
 * GET    /api/listen/[slug]/follow  - Follow-Status & Count abrufen
 */

// Feature-Flag Guard
function checkFeatureFlag() {
  if (!isCollectionsFollowEnabled()) {
    return NextResponse.json({ error: 'Feature nicht verfügbar' }, { status: 404 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params validieren
  const { slug } = await params;
  const paramsResult = followParamsSchema.safeParse({ slug });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 });
  }

  // Body validieren (leer, aber für Konsistenz)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const bodyResult = followRequestSchema.safeParse(body);
  if (!bodyResult.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  try {
    const result = await toggleFollow(auth.userId, slug);

    const response = followToggleResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('nicht öffentlich') ? 403 :
                   message.includes('Eigene Liste') ? 400 :
                   message.includes('Feature nicht aktiviert') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Auth
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Params validieren
  const { slug } = await params;
  const paramsResult = followParamsSchema.safeParse({ slug });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 });
  }

  try {
    // Toggle mit aktuellem Status prüfen - wenn bereits gefolgt, unfollow
    const status = await getFollowStatusBySlug(auth.userId, slug);
    if (!status) {
      return NextResponse.json({ error: 'Liste nicht gefunden' }, { status: 404 });
    }
    if (!status.followed) {
      return NextResponse.json({ error: 'Liste wird nicht gefolgt' }, { status: 400 });
    }

    const result = await toggleFollow(auth.userId, slug);

    const response = followToggleResponseSchema.parse(result);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    const status = message.includes('nicht gefunden') ? 404 :
                   message.includes('nicht öffentlich') ? 403 :
                   message.includes('Eigene Liste') ? 400 :
                   message.includes('Feature nicht aktiviert') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const featureCheck = checkFeatureFlag();
  if (featureCheck) return featureCheck;

  // Params validieren
  const { slug } = await params;
  const paramsResult = followParamsSchema.safeParse({ slug });
  if (!paramsResult.success) {
    return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 });
  }

  // Optional: User Session für Follow-Status
  const auth = await requireTwitchAuth(request);
  const userId = auth instanceof NextResponse ? null : auth.userId;

  try {
    const collection = await prisma.reviewCollection.findUnique({
      where: { slug },
      select: { id: true, followersCount: true, isPublic: true, deletedAt: true },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Liste nicht gefunden' }, { status: 404 });
    }
    if (!collection.isPublic || collection.deletedAt) {
      return NextResponse.json({ error: 'Liste nicht verfügbar' }, { status: 404 });
    }

    let followed = false;
    if (userId) {
      const status = await getFollowStatusBySlug(userId, slug);
      if (status) {
        followed = status.followed;
      }
    }

    const response = followStatusSchema.parse({
      followed,
      followerCount: collection.followersCount,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Interner Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}