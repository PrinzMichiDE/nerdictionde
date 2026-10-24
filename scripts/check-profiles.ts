import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.userProfile.findMany({ take: 5 });
  console.log("Profiles:", JSON.stringify(profiles, null, 2));
  const count = await prisma.userProfile.count();
  console.log("Total:", count);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });