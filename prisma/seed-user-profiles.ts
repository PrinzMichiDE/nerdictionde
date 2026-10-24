#!/usr/bin/env tsx
/**
 * Seed script: Create UserProfile for all existing TwitchUser records
 * Run with: npx tsx prisma/seed-user-profiles.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Creating UserProfile records for existing TwitchUsers...");

  // Find all TwitchUsers without a UserProfile
  const usersWithoutProfile = await prisma.twitchUser.findMany({
    where: {
      userProfile: null,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });

  console.log(`Found ${usersWithoutProfile.length} users without profile`);

  if (usersWithoutProfile.length === 0) {
    console.log("✅ All users already have profiles");
    return;
  }

  // Create UserProfile for each user
  const result = await prisma.userProfile.createMany({
    data: usersWithoutProfile.map((user) => ({
      userId: user.id,
      // Defaults: isPublic=true, showRatings=true, showBookmarks=true, followerCount=0, followingCount=0
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Created ${result.count} UserProfile records`);

  // Verify
  const totalProfiles = await prisma.userProfile.count();
  const totalUsers = await prisma.twitchUser.count();
  console.log(`📊 Total Users: ${totalUsers}, Total Profiles: ${totalProfiles}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });