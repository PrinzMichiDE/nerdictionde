import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth-twitch', () => ({
  requireTwitchAuth: vi.fn(),
}));

vi.mock('@/lib/review-reactions', () => ({
  getCachedReviewReactions: vi.fn(),
  toggleReaction: vi.fn(),
  removeReaction: vi.fn(),
  ensureReviewPublished: vi.fn(),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_REVIEW_REACTIONS: true,
}));

import { requireTwitchAuth } from '@/lib/auth-twitch';
import { getCachedReviewReactions, toggleReaction, removeReaction, ensureReviewPublished } from '@/lib/review-reactions';
import { GET, POST, DELETE } from '@/app/api/reviews/[id]/reactions/route';

const mockRequireTwitchAuth = vi.mocked(requireTwitchAuth);
const mockGetCachedReviewReactions = vi.mocked(getCachedReviewReactions);
const mockToggleReaction = vi.mocked(toggleReaction);
const mockRemoveReaction = vi.mocked(removeReaction);
const mockEnsureReviewPublished = vi.mocked(ensureReviewPublished);

function createRequest(method: string, url: string, body?: object, cookies?: Record<string, string>) {
  const headers = new Headers();
  if (body) headers.set('Content-Type', 'application/json');
  if (cookies) {
    headers.set('Cookie', Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '));
  }
  return new NextRequest(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

describe('Review Reactions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureReviewPublished.mockResolvedValue(true);
  });

  describe('GET /api/reviews/[id]/reactions', () => {
    it('returns 400 for invalid review ID', async () => {
      const request = createRequest('GET', 'http://localhost/api/reviews/not-a-cuid/reactions');
      const response = await GET(request, { params: Promise.resolve({ id: 'not-a-cuid' }) });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Ungültige Review-ID');
    });

    it('returns 404 when review not published', async () => {
      mockEnsureReviewPublished.mockResolvedValue(false);
      
      const request = createRequest('GET', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions');
      const response = await GET(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(404);
    });

    it('returns reaction counts for authenticated user', async () => {
      mockGetCachedReviewReactions.mockResolvedValue({
        counts: { THUMBS_UP: 5, HEART: 2, PARTY: 1, THINKING: 0, CRY: 0, ANGRY: 0 },
        total: 8,
        myReaction: 'THUMBS_UP',
      });
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user-1' });
      
      const request = createRequest('GET', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions', undefined, { twitch_session: 'token' });
      const response = await GET(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total).toBe(8);
      expect(data.myReaction).toBe('THUMBS_UP');
    });

    it('returns reaction counts for unauthenticated user', async () => {
      mockGetCachedReviewReactions.mockResolvedValue({
        counts: { THUMBS_UP: 5, HEART: 2, PARTY: 1, THINKING: 0, CRY: 0, ANGRY: 0 },
        total: 8,
        myReaction: null,
      });
      mockRequireTwitchAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      
      const request = createRequest('GET', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions');
      const response = await GET(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total).toBe(8);
      expect(data.myReaction).toBeNull();
    });
  });

  describe('POST /api/reviews/[id]/reactions', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      
      const request = createRequest('POST', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions', { type: 'THUMBS_UP' });
      const response = await POST(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid reaction type', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user-1' });
      
      const request = createRequest('POST', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions', { type: 'INVALID' });
      const response = await POST(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Ungültiger Reaktionstyp');
    });

    it('toggles reaction and returns updated counts', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user-1' });
      mockToggleReaction.mockResolvedValue({
        counts: { THUMBS_UP: 6, HEART: 2, PARTY: 1, THINKING: 0, CRY: 0, ANGRY: 0 },
        total: 9,
        myReaction: 'THUMBS_UP',
      });
      
      const request = createRequest('POST', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions', { type: 'THUMBS_UP' }, { twitch_session: 'token' });
      const response = await POST(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.total).toBe(9);
      expect(data.myReaction).toBe('THUMBS_UP');
      expect(mockToggleReaction).toHaveBeenCalledWith('user-1', 'clx1234567890abcdefghijkl', 'THUMBS_UP');
    });
  });

  describe('DELETE /api/reviews/[id]/reactions', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireTwitchAuth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      
      const request = createRequest('DELETE', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions?type=THUMBS_UP');
      const response = await DELETE(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(401);
    });

    it('returns 400 when type parameter missing', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user-1' });
      
      const request = createRequest('DELETE', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions');
      const response = await DELETE(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(400);
    });

    it('removes reaction and returns updated counts', async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user-1' });
      mockRemoveReaction.mockResolvedValue({
        counts: { THUMBS_UP: 4, HEART: 2, PARTY: 1, THINKING: 0, CRY: 0, ANGRY: 0 },
        total: 7,
        myReaction: null,
      });
      
      const request = createRequest('DELETE', 'http://localhost/api/reviews/clx1234567890abcdefghijkl/reactions?type=THUMBS_UP', undefined, { twitch_session: 'token' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'clx1234567890abcdefghijkl' }) });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total).toBe(7);
      expect(data.myReaction).toBeNull();
      expect(mockRemoveReaction).toHaveBeenCalledWith('user-1', 'clx1234567890abcdefghijkl', 'THUMBS_UP');
    });
  });
});