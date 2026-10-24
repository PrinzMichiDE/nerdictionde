import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.twitchUser.findMany({
    select: { id: true, username: true, displayName: true },
    take: 10,
  });
  console.log("Users:", JSON.stringify(users, null, 2));
  const count = await prisma.twitchUser.count();
  console.log("Total Users:", count);
  
  // Check users with profile
  const usersWithProfile = await prisma.twitchUser.findMany({
    where: { userProfile: { isNot: null } },
    select: { id: true, username: true },
    take: 5,
  });
  console.log("Users with profile:", usersWithProfile.length);
  
  // Check users without profile
  const usersWithoutProfile = await prisma.twitchUser.findMany({
    where: { userProfile: null },
    select: { id: true, username: true },
    take: 5,
  });
  console.log("Users without profile:", usersWithoutProfile.length);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });