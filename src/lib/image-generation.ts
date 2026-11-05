export async function generateReviewImages(): Promise<string[]> {
  return [];
}
export interface ImageGenerationOptions {
  productName: string;
  productType?: string;
  manufacturer?: string;
  style?: string;
  aspectRatio?: string;
  count?: number;
  tavilySearchResults?: any;
}
