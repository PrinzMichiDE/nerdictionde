import { unstable_cache } from "next/cache";
import prisma from "./prisma";

export type PublicProfile = {
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
    createdAt: Date;
    userProfile: {
      bio: string | null;
      isPublic: boolean;
      showRatings: boolean;
      showBookmarks: boolean;
      followerCount: number;
      followingCount: number;
    } | null;
  };
  ratings: {
    items: Array<{
      id: string;
      score: number;
      text: string | null;
      review: {
        id: string;
        title: string;
        slug: string;
        category: string;
        score: number;
        images: string[];
      };
    }>;
    totalCount: number;
    nextCursor: string | null;
  };
  bookmarks: {
    items: Array<{
      id: string;
      review: {
        id: string;
        title: string;
        slug: string;
        category: string;
        score: number;
        images: string[];
      };
    }>;
    totalCount: number;
    nextCursor: string | null;
  };
};

const PROFILE_CACHE_TAG = "user-profile";
const PROFILE_CACHE_TTL = 60; // seconds

/**
 * Get public profile by username
 * Cached for 60 seconds
 */
export const getUserProfile = unstable_cache(
  async (username: string): Promise<PublicProfile | null> => {
    const user = await prisma.twitchUser.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImageUrl: true,
        createdAt: true,
        userProfile: {
          select: {
            bio: true,
            isPublic: true,
            showRatings: true,
            showBookmarks: true,
            followerCount: true,
            followingCount: true,
          },
        },
      },
    });

    if (!user) return null;

    // Check if profile is public
    if (user.userProfile && !user.userProfile.isPublic) {
      return null; // Treat as not found for privacy
    }

    return user as unknown as PublicProfile;
  },
  ["user-profile"],
  { tags: [PROFILE_CACHE_TAG], revalidate: PROFILE_CACHE_TTL }
);

/**
 * Get profile by userId (for settings page)
 */
export async function getUserProfileById(userId: string) {
  return prisma.twitchUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImageUrl: true,
      createdAt: true,
      userProfile: {
        select: {
          bio: true,
          isPublic: true,
          showRatings: true,
          showBookmarks: true,
          followerCount: true,
          followingCount: true,
        },
      },
    },
  });
}

/**
 * Update user profile settings
 */
export async function updateUserProfile(
  userId: string,
  data: {
    bio?: string | null;
    isPublic?: boolean;
    showRatings?: boolean;
    showBookmarks?: boolean;
  }
) {
  const result = await prisma.userProfile.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });

  // Revalidate cache
  const user = await prisma.twitchUser.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  return { result, username: user?.username };
}

/**
 * Get user's ratings (paginated, cursor-based)
 */
export async function getProfileRatings(
  userId: string,
  cursor?: string,
  limit = 12
) {
  const where = cursor
    ? { id: { lt: cursor } }
    : {};

  const [items, totalCount] = await Promise.all([
    prisma.userRating.findMany({
      where: { userId, ...where },
      include: {
        review: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            score: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Take one extra to check if there's a next page
    }),
    prisma.userRating.count({ where: { userId } }),
  ]);

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop(); // Remove the extra item
    nextCursor = nextItem!.id;
  }

  return { items, totalCount, nextCursor };
}

/**
 * Get user's bookmarks (paginated, cursor-based)
 */
export async function getProfileBookmarks(
  userId: string,
  cursor?: string,
  limit = 12
) {
  const where = cursor
    ? { id: { lt: cursor } }
    : {};

  const [items, totalCount] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId, ...where },
      include: {
        review: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            score: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return { items, totalCount, nextCursor };
}

/**
 * Increment follower count
 */
export async function incrementFollowerCount(userId: string) {
  return prisma.userProfile.update({
    where: { userId },
    data: { followerCount: { increment: 1 } },
  });
}

/**
 * Decrement follower count
 */
export async function decrementFollowerCount(userId: string) {
  return prisma.userProfile.update({
    where: { userId },
    data: { followerCount: { decrement: 1 } },
  });
}

/**
 * Increment following count
 */
export async function incrementFollowingCount(userId: string) {
  return prisma.userProfile.update({
    where: { userId },
    data: { followingCount: { increment: 1 } },
  });
}

/**
 * Decrement following count
 */
export async function decrementFollowingCount(userId: string) {
  return prisma.userProfile.update({
    where: { userId },
    data: { followingCount: { decrement: 1 } },
  });
}

/**
 * Get follower count
 */
export async function getFollowerCount(userId: string): Promise<number> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { followerCount: true },
  });
  return profile?.followerCount ?? 0;
}

/**
 * Get following count
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { followingCount: true },
  });
  return profile?.followingCount ?? 0;
}