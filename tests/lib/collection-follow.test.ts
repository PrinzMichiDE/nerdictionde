import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    reviewCollection: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    collectionFollow: {
      upsert: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { default: mockPrisma };
});

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/lib/schemas/collection-follow-schema', () => ({
  isCollectionFollowEnabled: vi.fn(() => true),
}));

import * as collectionFollowModule from '@/lib/collection-follow';
import * as schemasModule from '@/lib/schemas/collection-follow-schema';
import prisma from '@/lib/prisma';

describe('collection-follow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(schemasModule.isCollectionFollowEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('followCollection', () => {
    it('should follow a collection and increment followersCount', async () => {
      const collectionId = 'collection-123';
      const userId = 'user-123';

      prisma.reviewCollection.findUnique
        .mockResolvedValueOnce({
          id: collectionId,
          ownerId: 'owner-456',
          isPublic: true,
          deletedAt: null,
        })
        .mockResolvedValueOnce({
          followersCount: 5,
        });

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionFollow: {
            upsert: vi.fn().mockResolvedValue({ id: 'follow-123' }),
          },
          reviewCollection: {
            update: vi.fn().mockResolvedValue({}),
          },
          notification: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const result = await collectionFollowModule.followCollection(userId, collectionId);

      expect(result.followed).toBe(true);
      expect(result.followersCount).toBe(5);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if collection not found', async () => {
      prisma.reviewCollection.findUnique.mockResolvedValue(null);

      await expect(
        collectionFollowModule.followCollection('user-123', 'collection-123')
      ).rejects.toThrow('Liste nicht gefunden');
    });

    it('should throw error if collection is not public', async () => {
      prisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'collection-123',
        ownerId: 'owner-456',
        isPublic: false,
        deletedAt: null,
      });

      await expect(
        collectionFollowModule.followCollection('user-123', 'collection-123')
      ).rejects.toThrow('Liste nicht verfügbar');
    });

    it('should throw error if collection is deleted', async () => {
      prisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'collection-123',
        ownerId: 'owner-456',
        isPublic: true,
        deletedAt: new Date(),
      });

      await expect(
        collectionFollowModule.followCollection('user-123', 'collection-123')
      ).rejects.toThrow('Liste nicht verfügbar');
    });
  });

  describe('unfollowCollection', () => {
    it('should unfollow a collection and decrement followersCount', async () => {
      const userId = 'user-123';
      const collectionId = 'collection-123';

      prisma.collectionFollow.findUnique.mockResolvedValue({ id: 'follow-123' });

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionFollow: { delete: vi.fn().mockResolvedValue({}) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      prisma.reviewCollection.findUnique.mockResolvedValue({
        followersCount: 3,
      });

      const result = await collectionFollowModule.unfollowCollection(userId, collectionId);

      expect(result.followed).toBe(false);
      expect(result.followersCount).toBe(3);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if not following', async () => {
      prisma.collectionFollow.findUnique.mockResolvedValue(null);

      await expect(
        collectionFollowModule.unfollowCollection('user-123', 'collection-123')
      ).rejects.toThrow('Nicht gefolgt');
    });
  });

  describe('isFollowingCollection', () => {
    it('should return true if following', async () => {
      prisma.collectionFollow.findUnique.mockResolvedValue({ id: 'follow-123' });

      const result = await collectionFollowModule.isFollowingCollection('user-123', 'collection-123');

      expect(result).toBe(true);
    });

    it('should return false if not following', async () => {
      prisma.collectionFollow.findUnique.mockResolvedValue(null);

      const result = await collectionFollowModule.isFollowingCollection('user-123', 'collection-123');

      expect(result).toBe(false);
    });

    it('should return false if feature disabled', async () => {
      vi.mocked(schemasModule.isCollectionFollowEnabled).mockReturnValue(false);

      const result = await collectionFollowModule.isFollowingCollection('user-123', 'collection-123');

      expect(result).toBe(false);
    });
  });

  describe('getFollowStatus', () => {
    it('should return follow status and count for authenticated user', async () => {
      prisma.collectionFollow.findUnique.mockResolvedValue({ id: 'follow-123' });
      prisma.reviewCollection.findUnique.mockResolvedValue({ followersCount: 10 });

      const result = await collectionFollowModule.getFollowStatus('user-123', 'collection-123');

      expect(result.isFollowing).toBe(true);
      expect(result.followersCount).toBe(10);
    });

    it('should return false for unauthenticated user', async () => {
      prisma.reviewCollection.findUnique.mockResolvedValue({ followersCount: 10 });

      const result = await collectionFollowModule.getFollowStatus(undefined, 'collection-123');

      expect(result.isFollowing).toBe(false);
      expect(result.followersCount).toBe(10);
    });
  });

  describe('getFollowedCollections', () => {
    it('should return paginated followed collections', async () => {
      const follows = [
        {
          id: 'follow-1',
          createdAt: new Date('2024-01-01'),
          collection: {
            id: 'collection-1',
            slug: 'best-games',
            title: 'Best Games 2024',
            description: 'Top games',
            itemCount: 10,
            followersCount: 50,
            updatedAt: new Date('2024-01-15'),
            owner: {
              id: 'owner-1',
              username: 'curator1',
              displayName: 'Curator One',
              profileImageUrl: null,
            },
          },
        },
        {
          id: 'follow-2',
          createdAt: new Date('2024-01-02'),
          collection: {
            id: 'collection-2',
            slug: 'hidden-gems',
            title: 'Hidden Gems',
            description: 'Underrated games',
            itemCount: 5,
            followersCount: 20,
            updatedAt: new Date('2024-01-10'),
            owner: {
              id: 'owner-2',
              username: 'curator2',
              displayName: 'Curator Two',
              profileImageUrl: null,
            },
          },
        },
      ];

      prisma.collectionFollow.findMany.mockResolvedValue(follows);

      const result = await collectionFollowModule.getFollowedCollections('user-123', undefined, 20);

      expect(result.collections).toHaveLength(2);
      expect(result.collections[0].title).toBe('Best Games 2024');
      expect(result.collections[0].isFollowing).toBe(true);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle pagination with cursor', async () => {
      const follows = Array.from({ length: 21 }, (_, i) => ({
        id: `follow-${i}`,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        collection: {
          id: `collection-${i}`,
          slug: `collection-${i}`,
          title: `Collection ${i}`,
          description: null,
          itemCount: 10,
          followersCount: 10,
          updatedAt: new Date(),
          owner: {
            id: 'owner-1',
            username: 'curator1',
            displayName: 'Curator One',
            profileImageUrl: null,
          },
        },
      }));

      prisma.collectionFollow.findMany.mockResolvedValue(follows);

      const result = await collectionFollowModule.getFollowedCollections('user-123', undefined, 20);

      expect(result.collections).toHaveLength(20);
      expect(result.nextCursor).toBe('follow-20');
    });

    it('should filter out deleted/private collections', async () => {
      const follows = [
        {
          id: 'follow-1',
          createdAt: new Date(),
          collection: {
            id: 'collection-1',
            slug: 'public-collection',
            title: 'Public Collection',
            description: null,
            itemCount: 10,
            followersCount: 10,
            updatedAt: new Date(),
            owner: { id: 'owner-1', username: 'curator1', displayName: 'Curator One', profileImageUrl: null },
          },
        },
        {
          id: 'follow-2',
          createdAt: new Date(),
          collection: null, // deleted/private
        },
      ];

      prisma.collectionFollow.findMany.mockResolvedValue(follows);

      const result = await collectionFollowModule.getFollowedCollections('user-123', undefined, 20);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].title).toBe('Public Collection');
    });
  });

  describe('toggleCollectionFollow', () => {
    it('should follow when not following', async () => {
      // Mock isFollowingCollection to return false
      prisma.collectionFollow.findUnique.mockResolvedValue(null);

      // Mock followCollection behavior
      prisma.reviewCollection.findUnique
        .mockResolvedValueOnce({
          id: 'collection-123',
          ownerId: 'owner-456',
          isPublic: true,
          deletedAt: null,
        })
        .mockResolvedValueOnce({
          followersCount: 5,
        });

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionFollow: { upsert: vi.fn().mockResolvedValue({ id: 'follow-123' }) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
          notification: { create: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const result = await collectionFollowModule.toggleCollectionFollow('user-123', 'collection-123');

      expect(result.followed).toBe(true);
      expect(result.followersCount).toBe(5);
    });

    it('should unfollow when following', async () => {
      // Mock isFollowingCollection to return true
      prisma.collectionFollow.findUnique.mockResolvedValue({ id: 'follow-123' });

      // Mock unfollowCollection behavior
      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionFollow: { delete: vi.fn().mockResolvedValue({}) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      prisma.reviewCollection.findUnique.mockResolvedValue({
        followersCount: 4,
      });

      const result = await collectionFollowModule.toggleCollectionFollow('user-123', 'collection-123');

      expect(result.followed).toBe(false);
      expect(result.followersCount).toBe(4);
    });
  });

  describe('createCollectionUpdateNotification', () => {
    it('should create notifications for all followers except actor', async () => {
      prisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'collection-123',
        title: 'Test Collection',
        ownerId: 'owner-123',
      });

      prisma.collectionFollow.findMany.mockResolvedValue([
        { userId: 'follower-1' },
        { userId: 'follower-2' },
        { userId: 'actor-123' }, // Should be excluded
      ]);

      await collectionFollowModule.createCollectionUpdateNotification(
        'collection-123',
        'item_added',
        'actor-123',
        'Actor Name'
      );

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'follower-1', type: 'collection_update' }),
          expect.objectContaining({ userId: 'follower-2', type: 'collection_update' }),
        ]),
      });
    });

    it('should not create notifications if no followers', async () => {
      prisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'collection-123',
        title: 'Test Collection',
        ownerId: 'owner-123',
      });

      prisma.collectionFollow.findMany.mockResolvedValue([]);

      await collectionFollowModule.createCollectionUpdateNotification(
        'collection-123',
        'item_added',
        'actor-123',
        'Actor Name'
      );

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});