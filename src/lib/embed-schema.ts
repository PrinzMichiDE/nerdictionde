// ============================================
// Embed Zod Schemas
// ============================================

import { z } from 'zod';
import type { EmbedType, EmbedTheme, EmbedData, EmbedReviewData, EmbedCollectionData, EmbedSeriesData } from '@/types/embed';

export const embedTypeSchema = z.enum(['review', 'collection', 'series']);
export const embedThemeSchema = z.enum(['auto', 'light', 'dark']);

export const embedAuthorSchema = z.object({
  username: z.string().min(1),
  displayName: z.string().min(1),
  avatar: z.string().url().nullable(),
});

const specValueSchema = z.union([z.string(), z.array(z.string())]);
const specsSchema = z.record(z.string(), specValueSchema);

export const embedReviewDataSchema = z.object({
  type: z.literal('review'),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string(),
  score: z.number().min(0).max(10),
  scoreLabel: z.string().min(1),
  category: z.string().min(1),
  categoryLabel: z.string().min(1),
  coverImage: z.string().url().nullable(),
  coverAlt: z.string().min(1),
  author: embedAuthorSchema.optional(),
  publishedAt: z.string().datetime(),
  url: z.string().url(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  specs: specsSchema.default({}),
}) satisfies z.ZodType<EmbedReviewData>;

export const embedCollectionItemSchema = z.object({
  position: z.number().int().positive(),
  review: z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    score: z.number().min(0).max(10),
    coverImage: z.string().url().nullable(),
  }),
});

export const embedCollectionDataSchema = z.object({
  type: z.literal('collection'),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  itemCount: z.number().int().nonnegative(),
  owner: embedAuthorSchema,
  coverImage: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  url: z.string().url(),
  items: z.array(embedCollectionItemSchema).default([]),
}) satisfies z.ZodType<EmbedCollectionData>;

export const embedSeriesPartSchema = z.object({
  order: z.number().int().positive(),
  review: z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    score: z.number().min(0).max(10),
  }),
});

export const embedSeriesDataSchema = z.object({
  type: z.literal('series'),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  partCount: z.number().int().nonnegative(),
  owner: embedAuthorSchema,
  coverImage: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  url: z.string().url(),
  parts: z.array(embedSeriesPartSchema).default([]),
}) satisfies z.ZodType<EmbedSeriesData>;

export const embedDataSchema = z.discriminatedUnion('type', [
  embedReviewDataSchema,
  embedCollectionDataSchema,
  embedSeriesDataSchema,
]) satisfies z.ZodType<EmbedData>;

export const embedApiResponseSchema = <T extends EmbedData>(dataSchema: z.ZodType<T>) =>
  z.object({
    data: dataSchema,
    cachedAt: z.string().datetime(),
  });

export const embedWidgetPropsSchema = z.object({
  type: embedTypeSchema,
  slug: z.string().min(1),
  theme: embedThemeSchema.default('auto'),
  consent: z.boolean().default(true),
  compact: z.boolean().default(false),
});

// Feature-Flag Guard Functions
import { isReviewEmbedEnabled } from '@/lib/feature-flags';

export function checkReviewEmbedEnabled(): void {
  if (!isReviewEmbedEnabled()) {
    throw new Error('Review Embed feature is disabled');
  }
}

// Input validation schemas for API routes
export const embedParamsSchema = z.object({
  type: embedTypeSchema,
  slug: z.string().min(1).max(200),
});

// Query schema for future extensibility (e.g., version, format)
export const embedQuerySchema = z.object({
  v: z.string().optional(), // version for cache busting
  fields: z.string().optional(), // comma-separated field selection
});

export type EmbedParams = z.infer<typeof embedParamsSchema>;
export type EmbedQuery = z.infer<typeof embedQuerySchema>;
export type EmbedWidgetProps = z.infer<typeof embedWidgetPropsSchema>;