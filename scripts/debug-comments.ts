import "dotenv/config";
import openai, { OPENAI_MODEL } from "@/lib/openai";

async function test() {
  const prompt = `Erstelle genau 5 extrem realistische Forum-Kommentare zu folgendem Thema.

Thema: Warum gleic
Startbeitrag: Test

Antworte NUR mit einem JSON-Objekt im Format:
{
  "comments": [
    { "text": "Kommentartext...", "author": "Username" }
  ]
}`;
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });
    const msg: any = response.choices[0]?.message;
    console.log("===CONTENT===");
    console.log(msg?.content?.substring(0, 200));
  } catch (e) {
    console.error("err", e);
  }
}
test();
