import { unstable_cache } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { ReviewTemplate, TemplateField, validateTemplateData, TemplateData, reviewTemplateSchema } from '@/lib/review-templates-schema';

// Use the Zod schema for validation
const ReviewTemplateSchema = reviewTemplateSchema;

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates', 'reviews');

// ============================================
// Template Loading & Validation
// ============================================

export function loadTemplateFile(filename: string): ReviewTemplate | null {
  try {
    const filePath = path.join(TEMPLATES_DIR, filename);
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    // Validate against schema
    const result = ReviewTemplateSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`[ReviewTemplates] Invalid template ${filename}:`, result.error.flatten());
      return null;
    }

    return result.data;
  } catch (error) {
    console.error(`[ReviewTemplates] Failed to load ${filename}:`, error);
    return null;
  }
}

export function loadAllTemplates(): ReviewTemplate[] {
  try {
    const files = fs.readdirSync(TEMPLATES_DIR)
      .filter(f => f.endsWith('.json') && f !== 'template.schema.json');

    const templates = files
      .map(loadTemplateFile)
      .filter((t): t is ReviewTemplate => t !== null);

    // Sort: default first, then by name
    return templates.sort((a, b) => {
      if (a.default && !b.default) return -1;
      if (!a.default && b.default) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('[ReviewTemplates] Failed to load templates:', error);
    return [];
  }
}

// Cached versions for production
export const getTemplates = unstable_cache(
  async (): Promise<ReviewTemplate[]> => loadAllTemplates(),
  ['review-templates'],
  { tags: ['templates:reviews'], revalidate: 300 }
);

export const getTemplate = unstable_cache(
  async (id: string): Promise<ReviewTemplate | null> => {
    const templates = await getTemplates();
    return templates.find(t => t.id === id) ?? null;
  },
  ['review-template'],
  { tags: ['templates:reviews'], revalidate: 300 }
);

// Dev-mode hot reload: bypass cache
export function getTemplatesDev(): ReviewTemplate[] {
  return loadAllTemplates();
}

export function getTemplateDev(id: string): ReviewTemplate | null {
  return loadTemplateFile(`${id}.json`);
}

// ============================================
// Template Data Validation
// ============================================

export function validateTemplateDataForTemplate(
  data: TemplateData,
  templateId: string
): { valid: boolean; errors: Record<string, string> } {
  const template = loadTemplateFile(`${templateId}.json`);
  if (!template) {
    return { valid: false, errors: { _template: `Template nicht gefunden: ${templateId}` } };
  }
  return validateTemplateData(data, template);
}

export function getDefaultTemplate(): ReviewTemplate | null {
  const templates = loadAllTemplates();
  return templates.find(t => t.default) ?? templates[0] ?? null;
}

// ============================================
// Template Data Mapping (for Template Switching)
// ============================================

export function mapTemplateData(
  sourceData: TemplateData,
  sourceTemplate: ReviewTemplate,
  targetTemplate: ReviewTemplate
): TemplateData {
  const result: TemplateData = {};

  // Map fields by ID (exact match)
  for (const targetField of targetTemplate.fields) {
    if (sourceData[targetField.id] !== undefined) {
      result[targetField.id] = sourceData[targetField.id];
    }
  }

  return result;
}

// ============================================
// Content Extraction for Legacy Reviews
// ============================================

export function extractTemplateDataFromContent(
  content: string,
  template: ReviewTemplate
): TemplateData {
  // Simple heuristic: try to split content by common headers
  // This is a best-effort fallback for migrating legacy reviews
  const result: TemplateData = {};

  // For now, put all content in the first textarea field
  const firstTextarea = template.fields.find(f => f.type === 'textarea' && f.required);
  if (firstTextarea) {
    result[firstTextarea.id] = content;
  }

  return result;
}

// ============================================
// Schema.org Helpers
// ============================================

export interface SchemaOrgReview {
  '@context': 'https://schema.org';
  '@type': 'Review';
  itemReviewed: SchemaOrgItemReviewed;
  reviewRating: SchemaOrgRating;
  author: SchemaOrgPerson;
  datePublished: string;
  reviewBody: string;
  pros?: SchemaOrgItemList;
  cons?: SchemaOrgItemList;
}

export interface SchemaOrgItemReviewed {
  '@type': 'Game' | 'Product' | 'Movie' | 'TVSeries';
  name: string;
  category?: string;
  image?: string;
  url?: string;
}

export interface SchemaOrgRating {
  '@type': 'Rating';
  ratingValue: number;
  bestRating: number;
  worstRating: number;
}

export interface SchemaOrgPerson {
  '@type': 'Person';
  name: string;
  url?: string;
}

export interface SchemaOrgItemList {
  '@type': 'ItemList';
  itemListElement: SchemaOrgListItem[];
}

export interface SchemaOrgListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
}

// Helper to create properly typed ListItem
function createListItem(name: string, position: number): SchemaOrgListItem {
  return { '@type': 'ListItem', position, name };
}

export function buildSchemaOrgReview(
  review: {
    id: string;
    slug: string;
    title: string;
    score: number;
    category: string;
    templateId: string | null;
    templateData: TemplateData | null;
    content: string;
    author: { displayName: string; id: string };
    createdAt: Date;
    images: string[];
  },
  template: ReviewTemplate | null
): SchemaOrgReview | null {
  if (!template || !review.templateData) return null;

  const templateData = review.templateData as TemplateData;

  // Build reviewBody from template fields (concatenated)
  const reviewBody = template.fields
    .map(field => {
      const value = templateData[field.id];
      if (!value) return '';
      return `## ${field.label}\n${value}`;
    })
    .filter(Boolean)
    .join('\n\n');

  // Parse pros/cons if they exist
  const prosItems = templateData.pros
    ?.split('\n')
    .map((line, i) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((name, i) => createListItem(name, i + 1)) ?? [];

  const consItems = templateData.cons
    ?.split('\n')
    .map((line, i) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((name, i) => createListItem(name, i + 1)) ?? [];

  const itemReviewedType = review.category === 'game' ? 'Game'
    : review.category === 'hardware' ? 'Product'
    : review.category === 'movie' ? 'Movie'
    : 'TVSeries';

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': itemReviewedType,
      name: review.title,
      category: review.category,
      image: review.images[0],
      url: `https://nerdiction.de/reviews/${review.slug}`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.score,
      bestRating: 100,
      worstRating: 0,
    },
    author: {
      '@type': 'Person',
      name: review.author.displayName,
      url: `https://nerdiction.de/u/${review.author.id}`,
    },
    datePublished: review.createdAt.toISOString(),
    reviewBody,
    pros: prosItems.length > 0 ? { '@type': 'ItemList', itemListElement: prosItems } : undefined,
    cons: consItems.length > 0 ? { '@type': 'ItemList', itemListElement: consItems } : undefined,
  };
}