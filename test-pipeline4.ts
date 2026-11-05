import { phase5QaAndPublish } from "@/lib/content-pipeline";
import prisma from "@/lib/prisma";

prisma.articleDraft.findFirst({ orderBy: { createdAt: 'desc' } }).then(draft => {
  if (!draft) { console.log('no draft'); process.exit(0); }
  return phase5QaAndPublish(draft.id);
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error("ERR:", e.message);
  console.error(e.stack?.split('\n').slice(0,6).join('\n'));
  process.exit(1);
});
