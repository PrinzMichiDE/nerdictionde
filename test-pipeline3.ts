import { runPipeline } from "@/lib/content-pipeline";

runPipeline({ productName: "Resident Evil 4 Remake", category: "game" }).then(r => {
  console.log(JSON.stringify(r));
  process.exit(0);
}).catch(e => {
  console.error("ERR:", e.message);
  console.error(e.stack?.split('\n').slice(0,8).join('\n'));
  process.exit(1);
});
