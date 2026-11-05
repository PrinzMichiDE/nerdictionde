import { phase2FactCheck } from "@/lib/content-pipeline";

phase2FactCheck("temp", {productName: "Test", category: "game", specs: {}, price: null}).then(r => {
  console.log(JSON.stringify(r));
  process.exit(0);
}).catch(e => {
  console.error("ERR:", e.message);
  console.error(e.stack);
  process.exit(1);
});
