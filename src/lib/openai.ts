import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_CUSTOM_BASE_URL || "https://api.openai.com/v1",
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4";

export default openai;

