import { z } from 'zod';
import { QAStatus } from '@prisma/client';

/**
 * Zod Schemas für Community Q&A Feature
 * Wiederverwendete Patterns aus review-reactions-schema.ts, collections-follow-schema.ts
 */

// ============================================
// Parameter Schemas
// ============================================

/** Slug-Parameter für Review-Routes */
export const qaReviewParamsSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
});

/** Question ID Parameter */
export const qaQuestionIdParamsSchema = z.object({
  questionId: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
});

/** Answer ID Parameter */
export const qaAnswerIdParamsSchema = z.object({
  answerId: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
});

// ============================================
// Request/Response Schemas — Fragen
// ============================================

/** Frage erstellen Request Body */
export const createQuestionSchema = z.object({
  title: z.string().min(1).max(120).trim(),
  body: z.string().max(2000).trim().optional(),
});

/** Frage aktualisieren Request Body */
export const updateQuestionSchema = z.object({
  title: z.string().min(1).max(120).trim().optional(),
  body: z.string().max(2000).trim().optional(),
}).refine((data) => data.title !== undefined || data.body !== undefined, {
  message: 'Mindestens title oder body muss angegeben werden',
});

/** Frage Response (für Listen) */
export const qaQuestionListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  status: z.nativeEnum(QAStatus),
  score: z.number().int(),
  answerCount: z.number().int(),
  acceptedAnswerId: z.string().nullable(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  _count: z.object({
    answers: z.number().int(),
    votes: z.number().int(),
  }).optional(),
});

/** Frage Response (Detail mit Antworten) */
export const qaQuestionDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  status: z.nativeEnum(QAStatus),
  score: z.number().int(),
  answerCount: z.number().int(),
  acceptedAnswerId: z.string().nullable(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  answers: z.array(z.lazy(() => qaAnswerSchema)),
  userVote: z.number().int().nullable(), // +1, -1, or null
});

// ============================================
// Request/Response Schemas — Antworten
// ============================================

/** Antwort erstellen Request Body */
export const createAnswerSchema = z.object({
  body: z.string().min(1).max(3000).trim(),
});

/** Antwort aktualisieren Request Body */
export const updateAnswerSchema = z.object({
  body: z.string().min(1).max(3000).trim(),
});

/** Antwort Response */
export const qaAnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  body: z.string(),
  score: z.number().int(),
  isAccepted: z.boolean(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    profileImageUrl: z.string().nullable(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  userVote: z.number().int().nullable(), // +1, -1, or null
});

// ============================================
// Request/Response Schemas — Votes
// ============================================

/** Vote Value: +1 (up), -1 (down), 0 (remove) */
export const voteValueSchema = z.union([z.literal(1), z.literal(-1), z.literal(0)]);

/** Vote Request Body (für Frage oder Antwort) */
export const voteSchema = z.object({
  value: voteValueSchema,
});

/** Vote Response */
export const voteResponseSchema = z.object({
  success: z.literal(true),
  score: z.number().int(),
  userVote: voteValueSchema.nullable(),
});

// ============================================
// Request/Response Schemas — Accept Answer
// ============================================

/** Accept Answer Request Body */
export const acceptAnswerSchema = z.object({
  answerId: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
});

/** Accept Answer Response */
export const acceptAnswerResponseSchema = z.object({
  success: z.literal(true),
  acceptedAnswerId: z.string().nullable(),
  status: z.nativeEnum(QAStatus),
});

// ============================================
// Query Schemas
// ============================================

/** QA List Query Parameter (für Pagination & Sortierung) */
export const qaListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['relevance', 'newest', 'oldest', 'score', 'answers']).default('relevance'),
  status: z.nativeEnum(QAStatus).optional(),
});

/** QA List Response */
export const qaListResponseSchema = z.object({
  questions: z.array(qaQuestionListItemSchema),
  nextCursor: z.string().nullable(),
  totalCount: z.number().int().nonnegative(),
});

// ============================================
// Type Exports (inferred from Zod)
// ============================================

export type QAReviewParams = z.infer<typeof qaReviewParamsSchema>;
export type QAQuestionIdParams = z.infer<typeof qaQuestionIdParamsSchema>;
export type QAAnswerIdParams = z.infer<typeof qaAnswerIdParamsSchema>;

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>;
export type UpdateAnswerInput = z.infer<typeof updateAnswerSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type AcceptAnswerInput = z.infer<typeof acceptAnswerSchema>;
export type QAListQuery = z.infer<typeof qaListQuerySchema>;

export type QAQuestionListItem = z.infer<typeof qaQuestionListItemSchema>;
export type QAQuestionDetail = z.infer<typeof qaQuestionDetailSchema>;
export type QAAnswer = z.infer<typeof qaAnswerSchema>;
export type VoteResponse = z.infer<typeof voteResponseSchema>;
export type AcceptAnswerResponse = z.infer<typeof acceptAnswerResponseSchema>;
export type QAListResponse = z.infer<typeof qaListResponseSchema>;

// ============================================
// Feature Flag
// ============================================

export const FEATURE_COMMUNITY_QA = 'FEATURE_COMMUNITY_QA';

export function isCommunityQAEnabled(): boolean {
  return process.env.FEATURE_COMMUNITY_QA !== 'false';
}