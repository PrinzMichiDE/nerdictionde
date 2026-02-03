/**
 * Replace ![[IMAGE_X]] placeholders in review content with real image markdown.
 * IMAGE_1 -> first image URL, IMAGE_2 -> second, etc. (1-based placeholder, 0-based array).
 */

const PLACEHOLDER_REGEX = /!\[\[IMAGE_(\d+)\]\]/g;

/**
 * Replaces all ![[IMAGE_N]] placeholders in markdown content with markdown image syntax
 * using the provided image URLs. IMAGE_1 maps to images[0], IMAGE_2 to images[1], etc.
 * Placeholders without a matching image are removed (replaced with empty string).
 */
export function replaceImagePlaceholders(
  content: string,
  imageUrls: string[],
  altPrefix = "Image"
): string {
  if (!content || typeof content !== "string") return content;
  if (!imageUrls?.length) return content;

  return content.replace(PLACEHOLDER_REGEX, (_, numStr) => {
    const index = parseInt(numStr, 10);
    if (Number.isNaN(index) || index < 1) return "";
    const url = imageUrls[index - 1];
    if (!url) return "";
    const alt = `${altPrefix} ${index}`;
    return `![${alt}](${url})`;
  });
}

/**
 * Count how many ![[IMAGE_N]] placeholders exist in content (max N).
 */
export function countImagePlaceholders(content: string): number[] {
  const indices: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((m = re.exec(content)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n >= 1 && !indices.includes(n)) indices.push(n);
  }
  return indices.sort((a, b) => a - b);
}
