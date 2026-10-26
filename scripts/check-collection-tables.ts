import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const r = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%collection%'`;
  console.log(r);
  await p.$disconnect();
}

main().catch(console.error);