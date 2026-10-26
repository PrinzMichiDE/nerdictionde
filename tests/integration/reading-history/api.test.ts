import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, DELETE } from '@/app/api/reading-history/route';
import { DELETE as DELETE_SINGLE } from '@/app/api/reading-history/[reviewId]/route';
import { POST as POST_TRACK } from '@/app/api/reading-history/track/route';

// Mock dependencies
vi.mock('@/lib/auth-twitch', () => ({
  requireTwitchAuth: vi.fn(),
}));

vi.mock('@/lib/reading-history', () => ({
  getReadingHistory: vi.fn(),
  clearReadingHistory: vi.fn(),
  deleteReadingHistoryEntry: vi.fn(),
  trackReadingAtomic: vi.fn(),
  readingHistoryCacheTag: vi.fn((userId: string) => `reading-history:${userId}`),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_READING_HISTORY: true,
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

import { requireTwitchAuth } from '@/lib/auth-twitch';
import {
  getReadingHistory,
  clearReadingHistory,
  deleteReadingHistoryEntry,
  trackReadingAtomic,
} from '@/lib/reading-history';
import { revalidateTag } from 'next/cache';

const mockRequireTwitchAuth = vi.mocked(requireTwitchAuth);
const mockGetReadingHistory = vi.mocked(getReadingHistory);
const mockClearReadingHistory = vi.mocked(clearReadingHistory);
const mockDeleteReadingHistoryEntry = vi.mocked(deleteReadingHistoryEntry);
const mockTrackReadingAtomic = vi.mocked(trackReadingAtomic);
const mockRevalidateTag = vi.mocked(revalidateTag);

describe('Reading History API Routes', () => {
  const userId = 'test-user-id';
  const reviewId = 'ck1234567890abcdef123456';

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireTwitchAuth.mockResolvedValue({ userId });
    mockGetReadingHistory.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    mockClearReadingHistory.mockResolvedValue(5);
    mockDeleteReadingHistoryEntry.mockResolvedValue(true);
    mockTrackReadingAtomic.mockResolvedValue({
      id: 'entry-id',
      userId,
      reviewId,
      progress: 50,
      scrollDepth: 50,
      dwellTime: 60,
      lastReadAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/reading-history', () => {
    it('should return 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValueOnce(
        NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
      );

      const request = new NextRequest(new URL('/api/reading-history', 'http://localhost'));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
    });

    it('should return history data when authenticated', async () => {
      const mockItems = [
        {
          review: {
            id: reviewId,
            slug: 'test-review',
            title: 'Test Review',
            category: 'game',
            images: ['https://example.com/image.jpg'],
            score: 85,
          },
          progress: 75,
          scrollDepth: 80,
          dwellTime: 120,
          lastReadAt: new Date().toISOString(),
        },
      ];

      mockGetReadingHistory.mockResolvedValueOnce({
        items: mockItems,
        nextCursor: '2024-01-01T00:00:00.000Z',
      });

      const request = new NextRequest(new URL('/api/reading-history?limit=20', 'http://localhost'));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].review.title).toBe('Test Review');
      expect(data.nextCursor).toBe('2024-01-01T00:00:00.000Z');
      expect(mockGetReadingHistory).toHaveBeenCalledWith(userId, null, 20);
    });

    it('should parse cursor and limit from query', async () => {
      const cursor = '2024-01-01T00:00:00.000Z';
      const request = new NextRequest(new URL(`/api/reading-history?cursor=${cursor}&limit=10`, 'http://localhost'));
      await GET(request);

      expect(mockGetReadingHistory).toHaveBeenCalledWith(userId, cursor, 10);
    });

    it('should return 400 for invalid limit', async () => {
      const request = new NextRequest(new URL('/api/reading-history?limit=100', 'http://localhost'));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Ungültige Query-Parameter');
    });

    it('should return 400 for invalid cursor', async () => {
      const request = new NextRequest(new URL('/api/reading-history?cursor=invalid', 'http://localhost'));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Ungültige Query-Parameter');
    });
  });

  describe('DELETE /api/reading-history (clear all)', () => {
    it('should return 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const request = new NextRequest(new URL('/api/reading-history', 'http://localhost'), {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('should clear history and revalidate cache', async () => {
      mockClearReadingHistory.mockResolvedValueOnce(10);

      const request = new NextRequest(new URL('/api/reading-history', 'http://localhost'), {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deletedCount).toBe(10);
      expect(mockClearReadingHistory).toHaveBeenCalledWith(userId);
      expect(mockRevalidateTag).toHaveBeenCalledWith(`reading-history:${userId}`);
    });
  });

  describe('DELETE /api/reading-history/[reviewId]', () => {
    it('should return 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const request = new NextRequest(new URL(`/api/reading-history/${reviewId}`, 'http://localhost'), {
        method: 'DELETE',
      });
      const response = await DELETE_SINGLE(request, { params: Promise.resolve({ reviewId }) });
      await response.json();

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid reviewId', async () => {
      const request = new NextRequest(new URL('/api/reading-history/invalid', 'http://localhost'), {
        method: 'DELETE',
      });
      const response = await DELETE_SINGLE(request, { params: Promise.resolve({ reviewId: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Ungültige Review-ID');
    });

    it('should delete entry and revalidate cache', async () => {
      mockDeleteReadingHistoryEntry.mockResolvedValueOnce(true);

      const request = new NextRequest(new URL(`/api/reading-history/${reviewId}`, 'http://localhost'), {
        method: 'DELETE',
      });
      const response = await DELETE_SINGLE(request, { params: Promise.resolve({ reviewId }) });
      const _data = await response.json();

      expect(response.status).toBe(200);
      expect(_data.success).toBe(true);
      expect(mockDeleteReadingHistoryEntry).toHaveBeenCalledWith(userId, reviewId);
      expect(mockRevalidateTag).toHaveBeenCalledWith(`reading-history:${userId}`);
    });

    it('should return 404 when entry not found', async () => {
      mockDeleteReadingHistoryEntry.mockResolvedValueOnce(false);

      const request = new NextRequest(new URL(`/api/reading-history/${reviewId}`, 'http://localhost'), {
        method: 'DELETE',
      });
      const response = await DELETE_SINGLE(request, { params: Promise.resolve({ reviewId }) });
      const _data = await response.json();

      expect(response.status).toBe(404);
      expect(_data.error).toBe('Eintrag nicht gefunden');
    });
  });

  describe('POST /api/reading-history/track', () => {
    it('should return 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const request = new NextRequest(new URL('/api/reading-history/track', 'http://localhost'), {
        method: 'POST',
        body: JSON.stringify({ reviewId, progress: 50, scrollDepth: 50, dwellTime: 30 }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST_TRACK(request);
      await response.json();

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid body', async () => {
      const request = new NextRequest(new URL('/api/reading-history/track', 'http://localhost'), {
        method: 'POST',
        body: JSON.stringify({ reviewId: 'invalid', progress: 50 }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST_TRACK(request);
      const _data = await response.json();

      expect(response.status).toBe(400);
      expect(_data.error).toBe('Ungültige Daten');
    });

    it('should track reading and revalidate cache', async () => {
      // Mock returns the input values
      mockTrackReadingAtomic.mockResolvedValueOnce({
        id: 'entry-id',
        userId,
        reviewId,
        progress: 75,
        scrollDepth: 80,
        dwellTime: 120,
        lastReadAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest(new URL('/api/reading-history/track', 'http://localhost'), {
        method: 'POST',
        body: JSON.stringify({ reviewId, progress: 75, scrollDepth: 80, dwellTime: 120 }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST_TRACK(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.entry.reviewId).toBe(reviewId);
      expect(data.entry.progress).toBe(75);
      expect(mockTrackReadingAtomic).toHaveBeenCalledWith(userId, {
        reviewId,
        progress: 75,
        scrollDepth: 80,
        dwellTime: 120,
      });
      expect(mockRevalidateTag).toHaveBeenCalledWith(`reading-history:${userId}`);
    });
  });
});