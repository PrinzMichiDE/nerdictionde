import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { isCommunityQAEnabled } from '@/lib/qa-schema';
import type {
  QAStatus,
  ReviewQA,
  QAAnswer,
  QAVote,
  TwitchUser,
  Review,
  PrismaClient,
} from '@prisma/client';

// Type für Transaktions-Client
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

/**
 * Server Logic für Community Q&A Feature
 * Reine Funktionen (kein Next.js), wiederverwendbar für API & Scripts
 * Patterns aus review-reactions.ts, collections-follow.ts wiederverwendet
 */

// ============================================
// Feature Flag Guard
// ============================================

function checkFeatureEnabled() {
  if (!isCommunityQAEnabled()) {
    throw new Error('Community Q&A Feature ist deaktiviert');
  }
}

// ============================================
// Cache Keys & Tags
// ============================================

const CACHE_TTL = 60; // Sekunden

const QA_LIST_TAG = (reviewId: string) => `review:${reviewId}:qa`;
const QA_DETAIL_TAG = (questionId: string) => `qa:question:${questionId}`;
const USER_QA_TAG = (userId: string) => `user:${userId}:qa`;

// ============================================
// Include-Objekte (Factory Functions für mutable Types)
// ============================================

function getQuestionInclude(): {
  author: { select: { id: true; username: true; displayName: true; profileImageUrl: true } };
  answers: {
    where: { deletedAt: null };
    include: {
      author: { select: { id: true; username: true; displayName: true; profileImageUrl: true } };
      votes: { select: { userId: true; value: true } };
    };
    orderBy: Array<{ isAccepted: 'desc' } | { score: 'desc' } | { createdAt: 'asc' }>;
  };
  votes: { select: { userId: true; value: true } };
  _count: { select: { answers: true; votes: true } };
} {
  return {
    author: {
      select: { id: true, username: true, displayName: true, profileImageUrl: true },
    },
    answers: {
      where: { deletedAt: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, profileImageUrl: true } },
        votes: { select: { userId: true, value: true } },
      },
      orderBy: [{ isAccepted: 'desc' }, { score: 'desc' }, { createdAt: 'asc' }],
    },
    votes: { select: { userId: true, value: true } },
    _count: { select: { answers: true, votes: true } },
  };
}

function getAnswerInclude(): {
  author: { select: { id: true; username: true; displayName: true; profileImageUrl: true } };
  votes: { select: { userId: true; value: true } };
} {
  return {
    author: { select: { id: true, username: true, displayName: true, profileImageUrl: true } },
    votes: { select: { userId: true, value: true } },
  };
}

// ============================================
// Helper: User Vote aus Votes-Array extrahieren
// ============================================

function extractUserVote(votes: { userId: string; value: number }[], userId: string | undefined): 1 | -1 | null {
  if (!userId) return null;
  const vote = votes.find((v) => v.userId === userId);
  return vote ? (vote.value as 1 | -1) : null;
}

// ============================================
// Helper: Score berechnen (Summe aller Votes)
// ============================================

function calculateScore(votes: { value: number }[]): number {
  return votes.reduce((sum, v) => sum + v.value, 0);
}

// ============================================
// READ Operations (gecacht)
// ============================================

/**
 * Holt Fragen-Liste für ein Review (paginiert, sortiert)
 * Gecacht für 60 Sekunden mit Tag-Invaliderung
 */
export const getQAList = unstable_cache(
  async (
    reviewId: string,
    cursor?: string,
    limit = 10,
    sort: 'relevance' | 'newest' | 'oldest' | 'score' | 'answers' = 'relevance',
    status?: QAStatus,
    userId?: string
  ): Promise<{
    questions: Array<ReviewQA & {
      author: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
      answers: Array<QAAnswer & {
        author: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
        votes: { userId: string; value: number }[];
        userVote: 1 | -1 | null;
      }>;
      votes: { userId: string; value: number }[];
      _count: { answers: number; votes: number };
      userVote: 1 | -1 | null;
    }>;
    nextCursor: string | null;
    totalCount: number;
  }> => {
    checkFeatureEnabled();

    // Review existiert prüfen
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });
    if (!review) {
      throw new Error('Review nicht gefunden');
    }

    // Build where clause
    const where: Record<string, unknown> = {
      reviewId,
      deletedAt: null,
    };
    if (status) where.status = status;

    // Cursor-based pagination
    if (cursor) {
      where.id = { lt: cursor };
    }

    // Sortierung
    let orderBy: Record<string, string>[] = [];
    switch (sort) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }];
        break;
      case 'score':
        orderBy = [{ score: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'answers':
        orderBy = [{ answerCount: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'relevance':
      default:
        orderBy = [{ status: 'asc' }, { score: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const take = limit + 1; // +1 to check if there's more

    const questions = await prisma.reviewQA.findMany({
      where,
      include: getQuestionInclude(),
      orderBy: sort === 'relevance'
        ? [{ status: 'asc' }, { score: 'desc' }, { createdAt: 'desc' }]
        : orderBy,
      take,
    });

    // Post-process for relevance sort: RESOLVED first
    let sortedQuestions = questions;
    if (sort === 'relevance') {
      sortedQuestions = questions.sort((a: typeof questions[0], b: typeof questions[0]) => {
        // Resolved first
        if (a.status === 'RESOLVED' && b.status !== 'RESOLVED') return -1;
        if (b.status === 'RESOLVED' && a.status !== 'RESOLVED') return 1;
        // Then by score
        if (b.score !== a.score) return b.score - a.score;
        // Then newest
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    const hasMore = sortedQuestions.length > limit;
    const items = hasMore ? sortedQuestions.slice(0, limit) : sortedQuestions;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Total count
    const totalCount = await prisma.reviewQA.count({ where });

    // Transform: add userVote to each question and answers
    const transformedQuestions = items.map((q: typeof items[0]) => ({
      ...q,
      userVote: extractUserVote(q.votes, userId),
      answers: q.answers.map((ans: typeof q.answers[0]) => ({
        ...ans,
        userVote: extractUserVote(ans.votes, userId),
      })),
    }));

    return {
      questions: transformedQuestions,
      nextCursor,
      totalCount,
    };
  },
  ['qa-list'],
  { tags: ['qa-list'], revalidate: CACHE_TTL }
);

/**
 * Holt einzelne Frage mit Antworten (für Detail/SSR)
 * Gecacht für 60 Sekunden
 */
export const getQAById = unstable_cache(
  async (
    questionId: string,
    userId?: string
  ): Promise<
    | (ReviewQA & {
        author: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
        review: Pick<Review, 'id' | 'slug' | 'title'>;
        answers: Array<QAAnswer & {
          author: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'>;
          votes: { userId: string; value: number }[];
          userVote: 1 | -1 | null;
        }>;
        votes: { userId: string; value: number }[];
        userVote: 1 | -1 | null;
      })
    | null
  > => {
    checkFeatureEnabled();

    const question = await prisma.reviewQA.findUnique({
      where: { id: questionId, deletedAt: null },
      include: {
        ...getQuestionInclude(),
        review: { select: { id: true, slug: true, title: true } },
      },
    });

    if (!question) return null;

    return {
      ...question,
      userVote: extractUserVote(question.votes, userId),
      answers: question.answers.map((ans: typeof question.answers[0]) => ({
        ...ans,
        userVote: extractUserVote(ans.votes, userId),
      })),
    };
  },
  ['qa-detail'],
  { tags: ['qa-detail'], revalidate: CACHE_TTL }
);

/**
 * Holt Review ID aus Slug (für API Routes)
 */
export async function getReviewIdBySlug(slug: string): Promise<string | null> {
  const review = await prisma.review.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });
  if (!review || review.status !== 'published') return null;
  return review.id;
}

// ============================================
// WRITE Operations (Mutations)
// ============================================

/**
 * Erstellt neue Frage
 */
export async function createQuestion(
  reviewId: string,
  authorId: string,
  title: string,
  body?: string
): Promise<ReviewQA & { author: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'> }> {
  checkFeatureEnabled();

  // Review prüfen
  const review = await prisma.review.findUnique({
    where: { id: reviewId, status: 'published' },
    select: { id: true },
  });
  if (!review) {
    throw new Error('Review nicht gefunden oder nicht veröffentlicht');
  }

  const question = await prisma.reviewQA.create({
    data: {
      reviewId,
      authorId,
      title,
      body,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, profileImageUrl: true } },
    },
  });

  // Notification für Review-Autor: Review hat keinen Author, also skip
  // In Zukunft: Category-Subscriber benachrichtigen

  return question;
}

/**
 * Aktualisiert Frage (nur Owner)
 */
export async function updateQuestion(
  questionId: string,
  authorId: string,
  data: { title?: string; body?: string }
): Promise<ReviewQA | null> {
  checkFeatureEnabled();

  const question = await prisma.reviewQA.findUnique({
    where: { id: questionId, deletedAt: null },
    select: { authorId: true },
  });

  if (!question) {
    throw new Error('Frage nicht gefunden');
  }
  if (question.authorId !== authorId) {
    throw new Error('Nicht autorisiert');
  }

  return prisma.reviewQA.update({
    where: { id: questionId },
    data: {
      ...data,
      editedAt: new Date(),
    },
  });
}

/**
 * Löscht Frage (Soft-Delete, kaskadiert zu Antworten)
 */
export async function deleteQuestion(
  questionId: string,
  authorId: string
): Promise<void> {
  checkFeatureEnabled();

  const question = await prisma.reviewQA.findUnique({
    where: { id: questionId, deletedAt: null },
    select: { authorId: true },
  });

  if (!question) {
    throw new Error('Frage nicht gefunden');
  }
  if (question.authorId !== authorId) {
    throw new Error('Nicht autorisiert');
  }

  await prisma.$transaction(async (tx: TxClient) => {
    // Frage soft-delete
    await tx.reviewQA.update({
      where: { id: questionId },
      data: { deletedAt: new Date() },
    });

    // Alle Antworten soft-delete
    await tx.qAAnswer.updateMany({
      where: { questionId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  });
}

/**
 * Erstellt neue Antwort
 */
export async function createAnswer(
  questionId: string,
  authorId: string,
  body: string
): Promise<QAAnswer & { author: Pick<TwitchUser, 'id' | 'username' | 'displayName' | 'profileImageUrl'> }> {
  checkFeatureEnabled();

  const question = await prisma.reviewQA.findUnique({
    where: { id: questionId, deletedAt: null },
    select: { id: true, reviewId: true, authorId: true },
  });

  if (!question) {
    throw new Error('Frage nicht gefunden');
  }

  const answer = await prisma.$transaction(async (tx: TxClient) => {
    const newAnswer = await tx.qAAnswer.create({
      data: {
        questionId,
        authorId,
        body,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, profileImageUrl: true } },
      },
    });

    // Question answerCount & updatedAt inkrementieren
    await tx.reviewQA.update({
      where: { id: questionId },
      data: {
        answerCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return newAnswer;
  });

  // Notification für Fragesteller (falls nicht selbst)
  if (question.authorId !== authorId) {
    await createQANotification(question.reviewId, 'qa_answer_added', authorId, question.id, answer.id);
  }

  return answer;
}

/**
 * Aktualisiert Antwort (nur Owner)
 */
export async function updateAnswer(
  answerId: string,
  authorId: string,
  body: string
): Promise<QAAnswer | null> {
  checkFeatureEnabled();

  const answer = await prisma.qAAnswer.findUnique({
    where: { id: answerId, deletedAt: null },
    select: { authorId: true },
  });

  if (!answer) {
    throw new Error('Antwort nicht gefunden');
  }
  if (answer.authorId !== authorId) {
    throw new Error('Nicht autorisiert');
  }

  return prisma.qAAnswer.update({
    where: { id: answerId },
    data: {
      body,
      editedAt: new Date(),
    },
  });
}

/**
 * Löscht Antwort (Soft-Delete)
 */
export async function deleteAnswer(
  answerId: string,
  authorId: string
): Promise<void> {
  checkFeatureEnabled();

  const answer = await prisma.qAAnswer.findUnique({
    where: { id: answerId, deletedAt: null },
    select: { authorId: true, questionId: true, isAccepted: true },
  });

  if (!answer) {
    throw new Error('Antwort nicht gefunden');
  }
  if (answer.authorId !== authorId) {
    throw new Error('Nicht autorisiert');
  }

  await prisma.$transaction(async (tx: TxClient) => {
    await tx.qAAnswer.update({
      where: { id: answerId },
      data: { deletedAt: new Date() },
    });

    // Question answerCount dekrementieren
    await tx.reviewQA.update({
      where: { id: answer.questionId },
      data: {
        answerCount: { decrement: 1 },
        // Wenn accepted answer gelöscht wird: status zurück auf OPEN
        ...(answer.isAccepted
          ? { acceptedAnswerId: null, status: 'OPEN' as QAStatus }
          : {}),
      },
    });
  });
}

/**
 * Vote auf Frage oder Antwort (Upsert + Score denormalisiert)
 * value: +1 (up), -1 (down), 0 (remove)
 */
export async function toggleVote(
  userId: string,
  value: 1 | -1 | 0,
  questionId?: string,
  answerId?: string
): Promise<{ score: number; userVote: 1 | -1 | 0 | null }> {
  checkFeatureEnabled();

  if (!questionId && !answerId) {
    throw new Error('questionId oder answerId erforderlich');
  }
  if (questionId && answerId) {
    throw new Error('Nur questionId ODER answerId, nicht beides');
  }

  const targetId = questionId ?? answerId!;
  const isQuestion = !!questionId;

  // Prüfen ob User Owner des Targets ist
  if (isQuestion) {
    const question = await prisma.reviewQA.findUnique({
      where: { id: questionId, deletedAt: null },
      select: { authorId: true },
    });
    if (question?.authorId === userId) {
      throw new Error('Eigene Inhalte können nicht bewertet werden');
    }
  } else {
    const answer = await prisma.qAAnswer.findUnique({
      where: { id: answerId, deletedAt: null },
      select: { authorId: true },
    });
    if (answer?.authorId === userId) {
      throw new Error('Eigene Inhalte können nicht bewertet werden');
    }
  }

  const result = await prisma.$transaction(async (tx: TxClient) => {
    // Vote upsert/delete
    if (value === 0) {
      // Vote entfernen
      if (isQuestion) {
        await tx.qAVote.deleteMany({
          where: { userId, questionId },
        });
      } else {
        await tx.qAVote.deleteMany({
          where: { userId, answerId },
        });
      }
    } else {
      // Vote setzen/updaten
      if (isQuestion) {
        await tx.qAVote.upsert({
          where: { userId_questionId: { userId, questionId: questionId! } },
          create: { userId, questionId: questionId!, value },
          update: { value },
        });
      } else {
        await tx.qAVote.upsert({
          where: { userId_answerId: { userId, answerId: answerId! } },
          create: { userId, answerId: answerId!, value },
          update: { value },
        });
      }
    }

    // Denormalisierten Score neu berechnen
    const votes = isQuestion
      ? await tx.qAVote.findMany({ where: { questionId: targetId }, select: { value: true } })
      : await tx.qAVote.findMany({ where: { answerId: targetId }, select: { value: true } });

    const newScore = calculateScore(votes);

    // Score updaten
    if (isQuestion) {
      await tx.reviewQA.update({
        where: { id: targetId },
        data: { score: newScore },
      });
    } else {
      await tx.qAAnswer.update({
        where: { id: targetId },
        data: { score: newScore },
      });
    }

    // User vote für Response
    const userVote = votes.find((v) => v.value === value) ? value : null;

    return { score: newScore, userVote };
  });

  return result;
}

/**
 * Antwort als akzeptiert markieren (nur Fragesteller)
 * Toggelt: wenn bereits akzeptiert → aufheben, sonst → akzeptieren
 */
export async function acceptAnswer(
  questionId: string,
  answerId: string,
  requesterId: string
): Promise<{ acceptedAnswerId: string | null; status: QAStatus }> {
  checkFeatureEnabled();

  const question = await prisma.reviewQA.findUnique({
    where: { id: questionId, deletedAt: null },
    select: { authorId: true, acceptedAnswerId: true, reviewId: true },
  });

  if (!question) {
    throw new Error('Frage nicht gefunden');
  }
  if (question.authorId !== requesterId) {
    throw new Error('Nur der Fragesteller kann eine Antwort akzeptieren');
  }

  const isCurrentlyAccepted = question.acceptedAnswerId === answerId;

  return prisma.$transaction(async (tx: TxClient) => {
    if (isCurrentlyAccepted) {
      // Accept aufheben
      await tx.qAAnswer.update({
        where: { id: answerId },
        data: { isAccepted: false },
      });
      await tx.reviewQA.update({
        where: { id: questionId },
        data: { acceptedAnswerId: null, status: 'OPEN' },
      });
      return { acceptedAnswerId: null, status: 'OPEN' as QAStatus };
    } else {
      // Vorherige accepted Answer zurücksetzen
      if (question.acceptedAnswerId) {
        await tx.qAAnswer.update({
          where: { id: question.acceptedAnswerId },
          data: { isAccepted: false },
        });
      }
      // Neue Answer akzeptieren
      await tx.qAAnswer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      });
      await tx.reviewQA.update({
        where: { id: questionId },
        data: { acceptedAnswerId: answerId, status: 'RESOLVED' },
      });

      // Notification für Answer-Autor
      const answer = await tx.qAAnswer.findUnique({
        where: { id: answerId },
        select: { authorId: true },
      });
      if (answer && answer.authorId !== requesterId) {
        await createQANotification(question.reviewId, 'qa_answer_accepted', requesterId, questionId, answerId);
      }

      return { acceptedAnswerId: answerId, status: 'RESOLVED' as QAStatus };
    }
  });
}

// ============================================
// Notification Helper
// ============================================

async function createQANotification(
  reviewId: string,
  type: 'qa_new_question' | 'qa_answer_added' | 'qa_answer_accepted',
  actorId: string,
  questionId: string,
  answerId?: string
): Promise<void> {
  // Review, Actor, Question parallel laden
  const [review, actor, question] = await Promise.all([
    prisma.review.findUnique({ where: { id: reviewId }, select: { title: true, slug: true } }),
    prisma.twitchUser.findUnique({ where: { id: actorId }, select: { displayName: true } }),
    prisma.reviewQA.findUnique({ where: { id: questionId }, select: { title: true, authorId: true } }),
  ]);

  if (!review || !actor || !question) return;

  const titles: Record<string, string> = {
    qa_new_question: `Neue Frage zu "${review.title}"`,
    qa_answer_added: `Neue Antwort auf deine Frage`,
    qa_answer_accepted: `Deine Antwort wurde als Lösung markiert`,
  };

  const messages: Record<string, string> = {
    qa_new_question: `${actor.displayName} fragt: "${question.title}"`,
    qa_answer_added: `${actor.displayName} hat deine Frage beantwortet`,
    qa_answer_accepted: `${actor.displayName} hat deine Antwort als Lösung akzeptiert`,
  };

  // Target User bestimmen
  let targetUserId: string;
  if (type === 'qa_new_question') {
    // Review hat keinen Author -> keine Notification (später: Category-Subscriber)
    return;
  } else if (type === 'qa_answer_added') {
    // Fragesteller benachrichtigen
    targetUserId = question.authorId;
  } else {
    // Answer-Autor benachrichtigen (answerId wird für qa_answer_accepted übergeben)
    if (!answerId) return;
    const answer = await prisma.qAAnswer.findUnique({ where: { id: answerId }, select: { authorId: true } });
    targetUserId = answer?.authorId ?? actorId;
  }

  if (targetUserId === actorId) return; // No self-notification

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: type as any,
      title: titles[type],
      message: messages[type],
      data: {
        reviewId,
        reviewSlug: review.slug,
        reviewTitle: review.title,
        questionId,
        questionTitle: question.title,
        answerId,
        actorId,
        actorDisplayName: actor.displayName,
      },
    },
  });
}

// ============================================
// Cache Invaliderung (Platzhalter für API Routes)
// ============================================

export function invalidateQACache(reviewId: string, questionId?: string): void {
  // Note: Next.js unstable_cache doesn't have direct invalidation
  // Would need to use revalidateTag in API Routes
  // This function is a placeholder for future use with revalidateTag
}

export function revalidateQAList(reviewId: string): void {
  // Called from API Routes after mutations
  // revalidateTag(QA_LIST_TAG(reviewId))
}

export function revalidateQADetail(questionId: string): void {
  // Called from API Routes after mutations
  // revalidateTag(QA_DETAIL_TAG(questionId))
}

export function revalidateUserQA(userId: string): void {
  // Called from API Routes after user mutations
  // revalidateTag(USER_QA_TAG(userId))
}