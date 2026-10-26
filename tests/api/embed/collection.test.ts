// ============================================
// Embed Collection API Integration Tests
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/embed/collection/[slug]/route';
import { getEmbedCollectionData } from '@/lib/embed-data';

vi.mock('@/lib/embed-data');
vi.mock('@/lib/feature-flags', () => ({
  isReviewEmbedEnabled: vi.fn(() => true),
  FEATURE_REVIEW_EMBED: true,
}));

import { getEmbedCollectionData as mockGetEmbedCollectionData } from '@/lib/embed-data';

describe('api/embed/collection/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns 404 when feature disabled', async () => {
    vi.doMock('@/lib/feature-flags', () => ({
      isReviewEmbedEnabled: vi.fn(() => false),
    }));

    const req = new NextRequest('http://localhost/api/embed/collection/test');
    const params = Promise.resolve({ slug: 'test' });
    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid slug', async () => {
    const req = new NextRequest('http://localhost/api/embed/collection/');
    const params = Promise.resolve({ slug: '' });
    const response = await GET(req, { params });
    expect(response.status).toBe(400);
  });

  it('returns 404 when collection not found', async () => {
    vi.mocked(mockGetEmbedCollectionData).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/embed/collection/not-found');
    const params = Promise.resolve({ slug: 'not-found' });
    const response = await GET(req, { params });
    expect(response.status).toBe(404);
  });

  it('returns 200 with collection data', async () => {
    const mockData = {
      type: 'collection' as const,
      slug: 'best-rpgs',
      title: 'Best RPGs 2024',
      description: 'Top RPGs',
      itemCount: 2,
      owner: { username: 'max', displayName: 'Max Mustermann', avatar: 'https://example.com/avatar.png' },
      coverImage: 'https://example.com/cover.jpg',
      createdAt: '2024-01-15T10:00:00.000Z',
      url: 'https://nerdiction.de/listen/best-rpgs',
      items: [
        { position: 1, review: { slug: 'game-1', title: 'Game 1', score: 9, coverImage: 'https://example.com/g1.jpg' } },
        { position: 2, review: { slug: 'game-2', title: 'Game 2', score: 8.5, coverImage: null } },
      ],
    };

    vi.mocked(mockGetEmbedCollectionData).mockResolvedValue(mockData);

    const req = new NextRequest('http://localhost/api/embed/collection/best-rpgs');
    const params = Promise.resolve({ slug: 'best-rpgs' });
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual(mockData);
    expect(json.cachedAt).toBeDefined();
  });
});