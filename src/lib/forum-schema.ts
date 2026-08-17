import { z } from "zod";

export const FORUM_CATEGORIES = ["gaming", "movies", "series"] as const;
export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

export const forumThreadQuerySchema = z.object({
  category: z
    .enum(FORUM_CATEGORIES)
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type ForumThreadQuery = z.infer<typeof forumThreadQuerySchema>;

export const createForumCommentSchema = z.object({
  threadId: z.string().min(1, "threadId is required"),
  text: z
    .string()
    .min(3, "Kommentar muss mindestens 3 Zeichen lang sein")
    .max(2000, "Kommentar darf maximal 2000 Zeichen lang sein"),
  displayName: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(30, "Name darf maximal 30 Zeichen lang sein"),
});

export type CreateForumCommentInput = z.infer<typeof createForumCommentSchema>;

export const forumCommentQuerySchema = z.object({
  threadId: z.string().min(1, "threadId is required"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type ForumCommentQuery = z.infer<typeof forumCommentQuerySchema>;
