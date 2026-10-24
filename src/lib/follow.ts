import prisma from "./prisma";
import { incrementFollowerCount, decrementFollowerCount, incrementFollowingCount, decrementFollowingCount } from "./user-profiles";

export type FollowResult = {
  following: boolean;
  followerCount: number;
  followingCount: number;
};

/**
 * Follow a user
 * Creates Follow record, Notification, and updates denormalized counts
 */
export async function followUser(followerId: string, followingId: string): Promise<FollowResult> {
  if (followerId === followingId) {
    throw new Error("Cannot follow yourself");
  }

  // Check if target user exists
  const targetUser = await prisma.twitchUser.findUnique({
    where: { id: followingId },
    select: { id: true, username: true, displayName: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Use transaction to ensure atomicity
  const [follow] = await prisma.$transaction(async (tx) => {
    // Upsert follow (idempotent - if already following, it will update createdAt)
    const follow = await tx.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      create: {
        followerId,
        followingId,
      },
      update: {
        createdAt: new Date(), // Update timestamp if re-following
      },
    });

    // Create notification for the followed user
    await tx.notification.create({
      data: {
        userId: followingId,
        type: "follow",
        title: "Neuer Follower",
        message: `${targetUser.displayName} (@${targetUser.username}) folgt dir jetzt.`,
        data: {
          followerId,
          followerUsername: targetUser.username,
          followerDisplayName: targetUser.displayName,
        },
      },
    });

    // Update denormalized counts
    await Promise.all([
      tx.userProfile.update({
        where: { userId: followingId },
        data: { followerCount: { increment: 1 } },
      }),
      tx.userProfile.update({
        where: { userId: followerId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    return [follow];
  });

  // Get updated counts
  const [followerCount, followingCount] = await Promise.all([
    getFollowerCount(followingId),
    getFollowingCount(followerId),
  ]);

  return {
    following: true,
    followerCount,
    followingCount,
  };
}

/**
 * Unfollow a user
 * Deletes Follow record and updates denormalized counts
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<FollowResult> {
  if (followerId === followingId) {
    throw new Error("Cannot unfollow yourself");
  }

  // Check if follow exists
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (!existingFollow) {
    throw new Error("Not following this user");
  }

  // Use transaction
  await prisma.$transaction(async (tx) => {
    // Delete follow
    await tx.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    // Update denormalized counts
    await Promise.all([
      tx.userProfile.update({
        where: { userId: followingId },
        data: { followerCount: { decrement: 1 } },
      }),
      tx.userProfile.update({
        where: { userId: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);
  });

  // Get updated counts
  const [followerCount, followingCount] = await Promise.all([
    getFollowerCount(followingId),
    getFollowingCount(followerId),
  ]);

  return {
    following: false,
    followerCount,
    followingCount,
  };
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    select: { id: true },
  });

  return !!follow;
}

/**
 * Get follower count for a user
 */
export async function getFollowerCount(userId: string): Promise<number> {
  return prisma.follow.count({
    where: { followingId: userId },
  });
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userId: string): Promise<number> {
  return prisma.follow.count({
    where: { followerId: userId },
  });
}

/**
 * Get followers list (paginated, cursor-based)
 */
export async function getFollowers(
  userId: string,
  cursor?: string,
  limit = 20
) {
  const where = cursor
    ? { followingId: userId, id: { lt: cursor } }
    : { followingId: userId };

  const items = await prisma.follow.findMany({
    where,
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
          userProfile: {
            select: { followerCount: true, followingCount: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return { items, nextCursor };
}

/**
 * Get following list (paginated, cursor-based)
 */
export async function getFollowing(
  userId: string,
  cursor?: string,
  limit = 20
) {
  const where = cursor
    ? { followerId: userId, id: { lt: cursor } }
    : { followerId: userId };

  const items = await prisma.follow.findMany({
    where,
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
          userProfile: {
            select: { followerCount: true, followingCount: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.id;
  }

  return { items, nextCursor };
}

/**
 * Toggle follow status (follow if not following, unfollow if following)
 */
export async function toggleFollow(followerId: string, followingId: string): Promise<FollowResult> {
  const following = await isFollowing(followerId, followingId);
  
  if (following) {
    return unfollowUser(followerId, followingId);
  } else {
    return followUser(followerId, followingId);
  }
}