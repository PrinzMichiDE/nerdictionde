import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('Tables:', tables);
  await p.$disconnect();
}

main().catch(console.error);