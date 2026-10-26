import { z } from "zod";

export const searchParamsSchema = z.object({
  query: z.string().trim().max(200).optional(),
  category: z.enum(["game", "movie", "series", "hardware", "all"]).default("all"),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  tags: z.string().transform((s) => s.split(",").filter(Boolean)).optional(),
  sort: z.enum(["relevance", "date-desc", "date-asc", "score-desc", "score-asc"]).default("relevance"),
  limit: z.coerce.number().int().min(1).transform((v) => Math.min(v, 50)).default(12),
  page: z.coerce.number().int().min(1).default(1),
  // NEU: Erweiterte Filter
  releaseDateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((s) => new Date(s))
    .optional(),
  releaseDateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((s) => new Date(s))
    .optional(),
  minPrice: z.coerce.number().min(0).max(100000).optional(),
  maxPrice: z.coerce.number().min(0).max(100000).optional(),
  platforms: z.string().transform((s) => s.split(",").filter(Boolean)).optional(),
  hasVideo: z.coerce.boolean().optional(),
  hasDeal: z.coerce.boolean().optional(),
  developer: z.string().trim().max(100).optional(),
  publisher: z.string().trim().max(100).optional(),
}).refine(
  (d) => !d.minPrice || !d.maxPrice || d.minPrice <= d.maxPrice,
  {
    message: "minPrice muss <= maxPrice sein",
    path: ["minPrice"],
  }
).refine(
  (d) => !d.releaseDateFrom || !d.releaseDateTo || d.releaseDateFrom <= d.releaseDateTo,
  {
    message: "releaseDateFrom muss <= releaseDateTo sein",
    path: ["releaseDateFrom"],
  }
);

export type SearchParams = z.infer<typeof searchParamsSchema>;