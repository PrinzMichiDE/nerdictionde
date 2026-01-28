import { z } from "zod";

export const createCommentSchema = z.object({
  reviewId: z.string().min(1, "reviewId is required"),
  text: z.string().min(1, "Comment text is required").max(2000, "Comment too long"),
  author: z
    .union([z.string().min(1).max(100), z.literal("")])
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined))
    .default("Besucher"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const getCommentsQuerySchema = z.object({
  reviewId: z.string().min(1, "reviewId is required"),
});

export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;
