import { z } from "zod";

export const createCommentSchema = z.object({
  reviewId: z.string().min(1, "reviewId is required"),
  text: z.string().min(1, "Comment text is required").max(2000, "Comment too long"),
  author: z.string().min(1, "Author is required").max(100).optional().default("Besucher"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const getCommentsQuerySchema = z.object({
  reviewId: z.string().min(1, "reviewId is required"),
});

export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;
