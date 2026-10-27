import "dotenv/config";
import openai, { OPENAI_MODEL } from "@/lib/openai";

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: "Gib mir JSON: {\"test\": true}" }],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });
    const msg: any = response.choices[0]?.message;
    console.log("content:", msg?.content);
    console.log("reasoning:", msg?.reasoning?.substring(0, 100));
  } catch (e) {
    console.error("err", e);
  }
}
test();
