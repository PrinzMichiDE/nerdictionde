import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import prisma from '@/lib/prisma';
import { ReviewCategory } from '@prisma/client';
import {
  subscribeCategorySchema,
  subscribedCategoriesResponseSchema,
  subscribeResponseSchema,
} from '@/lib/category-subscription-schema';
import { invalidateCategorySubscriptionCache } from '@/lib/category-subscriptions';
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from '@/lib/feature-flags';

// GET /api/me/categories/subscriptions
export async function GET(request: NextRequest) {
  if (!FEATURE_CATEGORY_SUBSCRIPTIONS) {
    return NextResponse.json({ error: 'Feature nicht aktiviert' }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const categories = await prisma.categorySubscription.findMany({
    where: { userId: auth.userId },
    select: { category: true },
  });
  return NextResponse.json(
    subscribedCategoriesResponseSchema.parse({ categories: categories.map((c) => c.category) })
  );
}

// POST /api/me/categories/subscriptions
export async function POST(request: NextRequest) {
  if (!FEATURE_CATEGORY_SUBSCRIPTIONS) {
    return NextResponse.json({ error: 'Feature nicht aktiviert' }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { category } = subscribeCategorySchema.parse(body);

  await prisma.categorySubscription.upsert({
    where: { userId_category: { userId: auth.userId, category } },
    create: { userId: auth.userId, category },
    update: {},
  });

  await invalidateCategorySubscriptionCache(auth.userId);

  return NextResponse.json(
    subscribeResponseSchema.parse({ subscribed: true, category })
  );
}