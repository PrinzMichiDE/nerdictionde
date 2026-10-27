import "dotenv/config";
import openai, { OPENAI_MODEL } from "@/lib/openai";

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: "Gib mir JSON: {\"test\": true}" }],
      response_format: { type: "json_object" },
      max_tokens: 100,
    });
    console.log(JSON.stringify(response));
  } catch (e) {
    console.error("err", e);
  }
}
test();
