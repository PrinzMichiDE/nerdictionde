import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { ReviewCategory } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/auth-twitch', () => ({
  requireTwitchAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    categorySubscription: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/category-subscriptions', () => ({
  invalidateCategorySubscriptionCache: vi.fn(),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_CATEGORY_SUBSCRIPTIONS: true,
}));

import { requireTwitchAuth } from '@/lib/auth-twitch';
import prisma from '@/lib/prisma';
import { invalidateCategorySubscriptionCache } from '@/lib/category-subscriptions';

// Import route handlers
import { GET, POST } from '@/app/api/me/categories/subscriptions/route';
import { DELETE as DELETE_CATEGORY } from '@/app/api/me/categories/subscriptions/[category]/route';

// Get typed mocks
const mockRequireTwitchAuth = vi.mocked(requireTwitchAuth);
const mockFindMany = vi.mocked(prisma.categorySubscription.findMany);
const mockUpsert = vi.mocked(prisma.categorySubscription.upsert);
const mockDeleteMany = vi.mocked(prisma.categorySubscription.deleteMany);
const mockInvalidateCache = vi.mocked(invalidateCategorySubscriptionCache);

describe('Category Subscriptions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/me/categories/subscriptions', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions');
      const res = await GET(req);
      
      expect(res.status).toBe(401);
    });

    it('returns subscribed categories', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockFindMany.mockResolvedValue([
        { id: 'sub_1', userId: 'user_1', category: ReviewCategory.GAMES, createdAt: new Date(), updatedAt: new Date() },
        { id: 'sub_2', userId: 'user_1', category: ReviewCategory.HARDWARE, createdAt: new Date(), updatedAt: new Date() },
      ]);
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.categories).toEqual([ReviewCategory.GAMES, ReviewCategory.HARDWARE]);
    });

    it('returns empty array when no subscriptions', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockFindMany.mockResolvedValue([]);
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.categories).toEqual([]);
    });
  });

  describe('POST /api/me/categories/subscriptions', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ category: 'GAMES' }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it('subscribes user to category', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockUpsert.mockResolvedValue({ id: 'sub_1', userId: 'user_1', category: ReviewCategory.GAMES, createdAt: new Date(), updatedAt: new Date() });
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ category: 'GAMES' }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.subscribed).toBe(true);
      expect(data.category).toBe(ReviewCategory.GAMES);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId_category: { userId: 'user_1', category: ReviewCategory.GAMES } },
        create: { userId: 'user_1', category: ReviewCategory.GAMES },
        update: {},
      });
      expect(mockInvalidateCache).toHaveBeenCalledWith('user_1');
    });

    it('is idempotent - returns success even if already subscribed', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockUpsert.mockResolvedValue({ id: 'sub_1', userId: 'user_1', category: ReviewCategory.GAMES, createdAt: new Date(), updatedAt: new Date() });
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ category: 'GAMES' }),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.subscribed).toBe(true);
    });
  });

  describe('DELETE /api/me/categories/subscriptions/:category', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions/GAMES', {
        method: 'DELETE',
      });
      const res = await DELETE_CATEGORY(req, { params: Promise.resolve({ category: 'GAMES' }) });
      
      expect(res.status).toBe(401);
    });

    it('unsubscribes user from category', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockDeleteMany.mockResolvedValue({ count: 1 });
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions/GAMES', {
        method: 'DELETE',
      });
      const res = await DELETE_CATEGORY(req, { params: Promise.resolve({ category: 'GAMES' }) });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.unsubscribed).toBe(true);
      expect(data.category).toBe(ReviewCategory.GAMES);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { userId: 'user_1', category: ReviewCategory.GAMES },
      });
      expect(mockInvalidateCache).toHaveBeenCalledWith('user_1');
    });

    it('returns success even if not subscribed (idempotent)', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockDeleteMany.mockResolvedValue({ count: 0 });
      
      const req = new NextRequest('http://localhost/api/me/categories/subscriptions/GAMES', {
        method: 'DELETE',
      });
      const res = await DELETE_CATEGORY(req, { params: Promise.resolve({ category: 'GAMES' }) });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.unsubscribed).toBe(true);
    });
  });
});