import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const r = await p.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'review_collections' ORDER BY ordinal_position`;
  console.log('review_collections columns:', r);
  
  const e = await p.$queryRaw`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType') ORDER BY enumsortorder`;
  console.log('NotificationType enum values:', e);
  
  await p.$disconnect();
}

main().catch(console.error);