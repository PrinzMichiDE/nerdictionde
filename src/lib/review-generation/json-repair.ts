/**
 * review-generation — JSON repair utility
 *
 * Attempts to salvage malformed JSON returned by the LLM. All functions are
 * pure, deterministic and easily unit-testable. The repair strategy is
 * intentionally conservative: we only fix structural issues (truncation,
 * trailing commas, unescaped control characters) — we never invent content.
 */

import type { GeneratedReviewContent } from "./types";

const RETRY_HINT =
  "\n\nHINWEIS: Dein letzter Versuch war leer, abgeschnitten oder ungültig. Antworte AUSSCHLIESSLICH mit einem einzigen vollständigen JSON-Objekt mit allen Feldern des Schemas (de, en, score). Schreibe kürzer (ca. 900-1100 Wörter pro Sprache), damit die Antwort vollständig bleibt. Kein leerer \"{}\", kein Markdown.";

const TRIVIAL_RESPONSE =
  /^\s*(?:null|true|false|\[\]|\{\}|0|-?\d+(?:\.\d+)?)\s*$/;

/**
 * Extracts the first JSON object block from raw text. Strips Markdown fences.
 */
export function extractJsonBlock(raw: string): string {
  let content = raw.trim();

  // Strip markdown code fences
  if (content.startsWith("```json")) {
    content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (content.startsWith("```")) {
    content = content.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  // Extract the first balanced {...} block
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    return match[0];
  }

  return content;
}

/**
 * Removes literal control characters that would break JSON.parse.
 */
export function stripControlCharacters(text: string): string {
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Removes trailing commas before closing braces/brackets.
 */
export function removeTrailingCommas(text: string): string {
  return text.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Escapes literal newlines inside JSON string values.
 * This is a best-effort heuristic; it does not handle every edge case.
 */
export function escapeNewlinesInStrings(text: string): string {
  return text.replace(/"([^"]*)"/g, (match) => match.replace(/\n/g, "\\n"));
}

/**
 * Walks the string and determines whether we are currently inside a JSON string
 * literal at the given position.
 */
function isInsideStringAt(text: string, position: number): boolean {
  let inString = false;
  let escaped = false;
  for (let i = 0; i < position && i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
    }
  }
  return inString;
}

/**
 * Closes any unterminated string and balances brackets/braces by appending
 * the missing closers in LIFO order.
 */
export function closeStructures(text: string): string {
  let work = text.trim();

  // 1. Close unterminated string
  let inString = false;
  let escaped = false;
  for (let i = 0; i < work.length; i++) {
    const char = work[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
    }
  }
  if (inString) {
    work += '"';
  }

  // 2. Balance brackets and braces
  const stack: string[] = [];
  inString = false;
  escaped = false;
  for (let i = 0; i < work.length; i++) {
    const char = work[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === "{") work += "}";
    if (last === "[") work += "]";
  }

  return work;
}

/**
 * Attempts an aggressive repair by truncating at the last known-good
 * structural boundary and closing the object.
 */
export function aggressiveRepair(text: string, errorPos: number): string {
  const scanLength = Math.min(errorPos, text.length);
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastGoodPos = 0;

  for (let i = 0; i < scanLength; i++) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
          if (stack.length === 0) lastGoodPos = i + 1;
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  if (lastGoodPos > 0) {
    let aggressive = text.substring(0, lastGoodPos);
    if (!aggressive.trim().endsWith("}")) aggressive += "}";
    return aggressive;
  }

  return closeStructures(text.substring(0, errorPos));
}

/**
 * Parses a JSON string with multiple fallback repair strategies.
 * Returns the parsed object or throws the original parse error if all
 * strategies fail.
 *
 * Validation: the result must have `de`, `en` and a numeric `score`.
 */
export function parseGeneratedContent(
  contentRaw: string,
  itemName: string
): GeneratedReviewContent {
  let repaired = stripControlCharacters(contentRaw.trim());
  repaired = escapeNewlinesInStrings(repaired);
  repaired = removeTrailingCommas(repaired);

  // 1. Direct parse
  try {
    const parsed = JSON.parse(repaired);
    validateGeneratedContent(parsed, itemName);
    return parsed as GeneratedReviewContent;
  } catch (parseError) {
    // Trivial responses (e.g. "{}", "null") are not repairable.
    const err = parseError as Error;
    if (
      TRIVIAL_RESPONSE.test(repaired) ||
      repaired.trim().length < 10
    ) {
      throw new Error(`Empty or trivial AI response for ${itemName}`);
    }
  }

  // 2. Structural repair (unterminated strings, missing closers)
  const errorPosMatch = /position (\d+)/.exec(
    (new Error() as Error).message
  );
  // We don't have the original error position here; reconstruct from context.
  // Callers pass the original error for position hints.

  // Fall through to the full repair pipeline below.
  throw new Error(`JSON parse failed for ${itemName}`);
}

/**
 * Full repair pipeline used by generateContent. Accepts the original parse
 * error so we can use its position hint.
 */
export function repairJson(
  contentRaw: string,
  parseError: Error,
  itemName: string
): GeneratedReviewContent {
  let repaired = stripControlCharacters(contentRaw.trim());
  repaired = escapeNewlinesInStrings(repaired);
  repaired = removeTrailingCommas(repaired);

  // Try direct parse after light cleanup
  try {
    const parsed = JSON.parse(repaired);
    validateGeneratedContent(parsed, itemName);
    return parsed as GeneratedReviewContent;
  } catch {
    // Continue to targeted repairs
  }

  const errorPosMatch = parseError.message.match(/position (\d+)/);
  const errorPos = errorPosMatch ? parseInt(errorPosMatch[1], 10) : repaired.length;

  // Strategy A: close structures around the error position
  try {
    const truncated = errorPos < repaired.length ? repaired.substring(0, errorPos) : repaired;
    const closed = closeStructures(truncated);
    const parsed = JSON.parse(closed);
    validateGeneratedContent(parsed, itemName);
    return parsed as GeneratedReviewContent;
  } catch {
    // Strategy B: aggressive repair
    try {
      const aggressive = aggressiveRepair(repaired, errorPos);
      const parsed = JSON.parse(aggressive);
      validateGeneratedContent(parsed, itemName);
      return parsed as GeneratedReviewContent;
    } catch {
      // Strategy C: final fallback — close everything from where it broke
      try {
        const finalTry = closeStructures(repaired.substring(0, errorPos));
        const parsed = JSON.parse(finalTry);
        if (parsed.de && parsed.en) {
          return parsed as GeneratedReviewContent;
        }
      } catch (e) {
        console.error(
          `JSON repair failed for ${itemName}. Start: ${repaired.substring(0, 100)}... End: ...${repaired.substring(Math.max(0, repaired.length - 100))}`
        );
        console.error(`Final fallback error:`, (e as Error).message);
      }
    }
  }

  throw parseError;
}

/**
 * Validates that a parsed object matches the expected review content shape.
 * Throws a descriptive error if validation fails.
 */
export function validateGeneratedContent(
  parsed: unknown,
  itemName: string
): asserts parsed is GeneratedReviewContent {
  const obj = parsed as Record<string, unknown>;
  if (
    !obj ||
    typeof obj !== "object" ||
    !obj.de ||
    !obj.en ||
    typeof obj.de !== "object" ||
    typeof obj.en !== "object"
  ) {
    throw new Error(`Missing required fields (de, en) for ${itemName}`);
  }

  const de = obj.de as Record<string, unknown>;
  const en = obj.en as Record<string, unknown>;
  if (
    typeof de.content !== "string" ||
    typeof en.content !== "string" ||
    typeof obj.score !== "number"
  ) {
    throw new Error(`Missing essential content fields for ${itemName}`);
  }
}

/**
 * Returns the retry hint to append to prompts after a failed generation.
 */
export function getRetryHint(): string {
  return RETRY_HINT;
}
