import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const r = await p.$queryRaw`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at`;
  console.log(r);
  await p.$disconnect();
}

main().catch(console.error);