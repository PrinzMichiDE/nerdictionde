/**
 * review-generation — AI client
 *
 * Wraps OpenAI chat completions with retry logic and JSON repair.
 * Single responsibility: send a prompt, get back validated structured content.
 */

import openai, { OPENAI_MODEL } from "@/lib/openai";
import type { GeneratedReviewContent } from "./types";
import {
  extractJsonBlock,
  repairJson,
  validateGeneratedContent,
  getRetryHint,
} from "./json-repair";

const MAX_RETRIES = 1;

/**
 * Generates any content using OpenAI with built-in auto-repair.
 *
 * @param prompt - The full prompt to send to the model.
 * @param itemName - Human-readable name of the item (for logging).
 * @param retryCount - Internal retry counter. Do not set manually.
 * @returns Validated generated review content.
 * @throws If generation fails after all retries.
 */
export async function generateContent(
  prompt: string,
  itemName: string,
  retryCount = 0
): Promise<GeneratedReviewContent> {
  const isRetry = retryCount > 0;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 32000,
    });

    let contentRaw = aiResponse.choices[0]?.message?.content || "{}";
    contentRaw = extractJsonBlock(contentRaw);

    try {
      const parsed = JSON.parse(contentRaw);
      validateGeneratedContent(parsed, itemName);
      return parsed as GeneratedReviewContent;
    } catch (parseError) {
      const err = parseError as Error;

      // Trivial responses (e.g. "{}", "null") are not repairable — retry immediately.
      if (
        /^\s*(?:null|true|false|\[\]|\{\}|0|-?\d+(?:\.\d+)?)\s*$/.test(
          contentRaw
        ) ||
        contentRaw.trim().length < 10
      ) {
        if (retryCount < MAX_RETRIES) {
          return generateContent(
            prompt + getRetryHint(),
            itemName,
            retryCount + 1
          );
        }
        throw new Error(`Empty or trivial AI response for ${itemName}`);
      }

      const repaired = repairJson(contentRaw, err, itemName);

      // If the repaired object still lacks essential fields and we can retry, do so.
      if (
        (!repaired.en || !repaired.en.content ||
          typeof repaired.score !== "number") &&
        retryCount < MAX_RETRIES
      ) {
        return generateContent(
          prompt + getRetryHint(),
          itemName,
          retryCount + 1
        );
      }

      return repaired;
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.error(
        `Error in generation for ${itemName}, retrying...`,
        error instanceof Error ? error.message : String(error)
      );
      return generateContent(
        prompt + (retryCount === 0 ? getRetryHint() : ""),
        itemName,
        retryCount + 1
      );
    }
    throw error instanceof Error
      ? error
      : new Error(String(error));
  }
}
