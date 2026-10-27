import "dotenv/config";
import openai, { OPENAI_MODEL } from "@/lib/openai";

async function test() {
  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: "Gib mir JSON: {\"test\": true}" }],
    response_format: { type: "json_object" },
    max_tokens: 100,
  });
  console.log(response.choices[0]?.message?.content);
}
test();
