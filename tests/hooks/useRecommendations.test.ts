import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useRecommendations, useReviewRecommendations } from '@/hooks/useRecommendations';

// Mock fetch globally
const mockFetch = vi.fn();
Object.defineProperty(window, 'fetch', {
  value: mockFetch,
  writable: true,
});

describe('useRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('fetches recommendations on mount when autoFetch is true', async () => {
    const mockData = {
      recommendations: [
        { 
          review: { 
            id: 'rev1', slug: 'test', title: 'Test', category: 'game', score: 80, 
            images: [], metaDescription: null, releaseDate: null, userRatingAvg: null, 
            userRatingCount: null, metadata: null 
          }, 
          reason: { type: 'trending', label: 'Trending' }, 
          score: 0.8 
        }
      ],
      strategy: 'cold-start',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useRecommendations({ autoFetch: true, limit: 5 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/recommendations?limit=5', expect.any(Object));
  });

  it('does not fetch on mount when autoFetch is false', () => {
    const { result } = renderHook(() => useRecommendations({ autoFetch: false }));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useRecommendations({ autoFetch: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Server error');
    expect(result.current.data).toBeNull();
  });

  it('refetches with custom limit', async () => {
    const mockData = { recommendations: [], strategy: 'trending' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useRecommendations({ autoFetch: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.fetch({ limit: 3 });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenLastCalledWith('/api/recommendations?limit=3', expect.any(Object));
  });

  it('dismisses recommendation optimistically', async () => {
    const initialData = {
      recommendations: [
        { 
          review: { id: 'rev1', slug: 'test1', title: 'Test 1', category: 'game', score: 80, images: [], metaDescription: null, releaseDate: null, userRatingAvg: null, userRatingCount: null, metadata: null }, 
          reason: { type: 'trending', label: 'Trending' }, 
          score: 0.8 
        },
        { 
          review: { id: 'rev2', slug: 'test2', title: 'Test 2', category: 'game', score: 85, images: [], metaDescription: null, releaseDate: null, userRatingAvg: null, userRatingCount: null, metadata: null }, 
          reason: { type: 'trending', label: 'Trending' }, 
          score: 0.9 
        },
      ],
      strategy: 'trending',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialData),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useRecommendations({ autoFetch: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.recommendations).toHaveLength(2);

    await act(async () => {
      await result.current.dismiss('rev1', 'not_interested');
    });

    // Optimistic update should be immediate, no loading state change
    expect(result.current.data?.recommendations).toHaveLength(1);
    expect(result.current.data?.recommendations[0].review.id).toBe('rev2');
    expect(mockFetch).toHaveBeenCalledWith('/api/recommendations/dismiss', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ reviewId: 'rev1', reason: 'not_interested' }),
    }));
  });

  it('refetches on dismiss error', async () => {
    const initialData = {
      recommendations: [
        { 
          review: { id: 'rev1', slug: 'test1', title: 'Test 1', category: 'game', score: 80, images: [], metaDescription: null, releaseDate: null, userRatingAvg: null, userRatingCount: null, metadata: null }, 
          reason: { type: 'trending', label: 'Trending' }, 
          score: 0.8 
        },
      ],
      strategy: 'trending',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(initialData),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recommendations: [], strategy: 'trending' }),
      });

    const { result } = renderHook(() => useRecommendations({ autoFetch: true }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.dismiss('rev1')).rejects.toThrow();

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
  });
});

describe('useReviewRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('fetches recommendations for a review slug', async () => {
    const mockData = {
      recommendations: [
        { 
          review: { 
            id: 'rev1', slug: 'test', title: 'Test', category: 'game', score: 80, 
            images: [], metaDescription: null, releaseDate: null, userRatingAvg: null, 
            userRatingCount: null, metadata: null 
          }, 
          reason: { type: 'tag_overlap', label: 'Thematisch ähnlich' }, 
          score: 0.7 
        }
      ],
      strategy: 'content-based',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useReviewRecommendations({ autoFetch: false }));

    await result.current.fetch('test-review', { limit: 3 });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith('/api/reviews/test-review/recommendations?limit=3', expect.any(Object));
  });

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    const { result } = renderHook(() => useReviewRecommendations({ autoFetch: false }));

    await act(async () => {
      await result.current.fetch('invalid-slug');
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it('refetches with same slug', async () => {
    const mockData = { recommendations: [], strategy: 'content-based' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useReviewRecommendations({ autoFetch: false }));

    await result.current.fetch('test-review');
    await result.current.refetch('test-review');

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockFetch).toHaveBeenLastCalledWith('/api/reviews/test-review/recommendations?limit=5', expect.any(Object));
  });
});