import { NextRequest, NextResponse } from 'next/server';
import { requireTwitchAuth } from '@/lib/auth-twitch';
import prisma from '@/lib/prisma';
import { ReviewCategory } from '@prisma/client';
import { categoryParamSchema, unsubscribeResponseSchema } from '@/lib/category-subscription-schema';
import { invalidateCategorySubscriptionCache } from '@/lib/category-subscriptions';
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from '@/lib/feature-flags';

// DELETE /api/me/categories/subscriptions/:category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  if (!FEATURE_CATEGORY_SUBSCRIPTIONS) {
    return NextResponse.json({ error: 'Feature nicht aktiviert' }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { category } = categoryParamSchema.parse(await params);

  await prisma.categorySubscription.deleteMany({
    where: { userId: auth.userId, category },
  });

  await invalidateCategorySubscriptionCache(auth.userId);

  return NextResponse.json(
    unsubscribeResponseSchema.parse({ unsubscribed: true, category })
  );
}