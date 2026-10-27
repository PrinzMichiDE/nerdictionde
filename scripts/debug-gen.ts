import "dotenv/config";
import openai, { OPENAI_MODEL } from "@/lib/openai";

async function test() {
  const prompt = `Erstelle genau 2 extrem realistische Forum-Diskussionsthemen zum Bereich "Gaming".
Antworte NUR mit einem JSON-Objekt im Format:
{
  "threads": [
    {
      "title": "Titel des Threads",
      "content": "Einleitungstext...",
      "excerpt": "Kurzbeschreibung",
      "author": "Username"
    }
  ]
}`;
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });
    const msg: any = response.choices[0]?.message;
    console.log("===CONTENT===");
    console.log(msg?.content);
    console.log("===REASONING===");
    console.log(msg?.reasoning?.substring(0, 200));
  } catch (e) {
    console.error("err", e);
  }
}
test();
