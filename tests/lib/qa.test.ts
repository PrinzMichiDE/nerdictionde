import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the module
const mockPrisma = {
  review: { findUnique: vi.fn() },
  reviewQA: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  qAAnswer: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  qAVote: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  notification: { create: vi.fn(), createMany: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

import {
  getQAList,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  toggleVote,
  acceptAnswer,
  getQAById,
} from "@/lib/qa";

describe("QA Server Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getQAList", () => {
    it("should fetch questions with answers and votes", async () => {
      const mockQuestions = [
        {
          id: "qa_1",
          reviewId: "review_1",
          authorId: "user_1",
          title: "Test Frage",
          body: "Body text",
          status: "OPEN",
          score: 5,
          answerCount: 2,
          acceptedAnswerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          editedAt: null,
          deletedAt: null,
          author: { id: "user_1", username: "user1", displayName: "User One", profileImageUrl: null },
          answers: [
            {
              id: "ans_1",
              questionId: "qa_1",
              body: "Antwort 1",
              score: 3,
              isAccepted: false,
              author: { id: "user_2", username: "user2", displayName: "User Two", profileImageUrl: null },
              createdAt: new Date(),
              updatedAt: new Date(),
              editedAt: null,
              deletedAt: null,
              votes: [{ userId: "user_3", value: 1 }],
            },
            {
              id: "ans_2",
              questionId: "qa_1",
              body: "Antwort 2",
              score: 1,
              isAccepted: true,
              author: { id: "user_3", username: "user3", displayName: "User Three", profileImageUrl: null },
              createdAt: new Date(),
              updatedAt: new Date(),
              editedAt: null,
              deletedAt: null,
              votes: [],
            },
          ],
          votes: [{ userId: "user_1", value: 1 }],
          _count: { answers: 2, votes: 1 },
        },
      ];

      mockPrisma.review.findUnique.mockResolvedValue({ id: "review_1" });
      mockPrisma.reviewQA.findMany.mockResolvedValue(mockQuestions);
      mockPrisma.reviewQA.count.mockResolvedValue(1);

      const result = await getQAList("review_1", undefined, 10, "relevance", undefined, "user_1");

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].id).toBe("qa_1");
      expect(result.questions[0].userVote).toBe(1);
      expect(result.questions[0].answers).toHaveLength(2);
      expect(result.questions[0].answers[0].userVote).toBeNull();
      expect(result.questions[0].answers[1].userVote).toBeNull();
    });

    it("should sort by relevance: resolved first, then score, then newest", async () => {
      const mockQuestions = [
        {
          id: "qa_1",
          reviewId: "review_1",
          authorId: "user_1",
          title: "Open Question",
          body: null,
          status: "OPEN",
          score: 10,
          answerCount: 1,
          acceptedAnswerId: null,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
          editedAt: null,
          deletedAt: null,
          author: { id: "user_1", username: "user1", displayName: "User One", profileImageUrl: null },
          answers: [],
          votes: [],
          _count: { answers: 0, votes: 0 },
        },
        {
          id: "qa_2",
          reviewId: "review_1",
          authorId: "user_2",
          title: "Resolved Question",
          body: null,
          status: "RESOLVED",
          score: 5,
          answerCount: 3,
          acceptedAnswerId: "ans_1",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          editedAt: null,
          deletedAt: null,
          author: { id: "user_2", username: "user2", displayName: "User Two", profileImageUrl: null },
          answers: [],
          votes: [],
          _count: { answers: 3, votes: 0 },
        },
      ];

      mockPrisma.review.findUnique.mockResolvedValue({ id: "review_1" });
      mockPrisma.reviewQA.findMany.mockResolvedValue(mockQuestions);
      mockPrisma.reviewQA.count.mockResolvedValue(2);

      const result = await getQAList("review_1", undefined, 10, "relevance");

      expect(result.questions[0].id).toBe("qa_2");
      expect(result.questions[1].id).toBe("qa_1");
    });
  });

  describe("getQAById", () => {
    it("should fetch single question with answers", async () => {
      const mockQuestion = {
        id: "qa_1",
        reviewId: "review_1",
        authorId: "user_1",
        title: "Test Frage",
        body: "Body",
        status: "OPEN",
        score: 5,
        answerCount: 1,
        acceptedAnswerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        editedAt: null,
        deletedAt: null,
        author: { id: "user_1", username: "user1", displayName: "User One", profileImageUrl: null },
        review: { id: "review_1", slug: "test-review", title: "Test Review" },
        answers: [
          {
            id: "ans_1",
            questionId: "qa_1",
            body: "Antwort",
            score: 2,
            isAccepted: false,
            author: { id: "user_2", username: "user2", displayName: "User Two", profileImageUrl: null },
            createdAt: new Date(),
            updatedAt: new Date(),
            editedAt: null,
            deletedAt: null,
            votes: [],
          },
        ],
        votes: [{ userId: "user_1", value: 1 }],
      };

      mockPrisma.reviewQA.findUnique.mockResolvedValue(mockQuestion);

      const result = await getQAById("qa_1", "user_1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("qa_1");
      expect(result?.userVote).toBe(1);
      expect(result?.answers).toHaveLength(1);
    });
  });

  describe("createQuestion", () => {
    it("should create a new question", async () => {
      const mockQuestion = {
        id: "qa_new",
        reviewId: "review_1",
        authorId: "user_1",
        title: "Neue Frage",
        body: "Details",
        status: "OPEN",
        score: 0,
        answerCount: 0,
        acceptedAnswerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        editedAt: null,
        deletedAt: null,
        author: { id: "user_1", username: "user1", displayName: "User One", profileImageUrl: null },
      };

      mockPrisma.review.findUnique.mockResolvedValue({ id: "review_1", status: "published" });
      mockPrisma.reviewQA.create.mockResolvedValue(mockQuestion);

      const result = await createQuestion("review_1", "user_1", "Neue Frage", "Details");

      expect(result.id).toBe("qa_new");
      expect(result.title).toBe("Neue Frage");
    });
  });

  describe("updateQuestion", () => {
    it("should update question if owner", async () => {
      const mockQuestion = { id: "qa_1", authorId: "user_1" };
      const mockUpdated = { ...mockQuestion, title: "Updated", editedAt: new Date() };

      mockPrisma.reviewQA.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.reviewQA.update.mockResolvedValue(mockUpdated);

      const result = await updateQuestion("qa_1", "user_1", { title: "Updated" });

      expect(result?.title).toBe("Updated");
    });

    it("should throw if not owner", async () => {
      mockPrisma.reviewQA.findUnique.mockResolvedValue({ id: "qa_1", authorId: "user_2" });

      await expect(updateQuestion("qa_1", "user_1", { title: "Updated" })).rejects.toThrow(
        "Nicht autorisiert"
      );
    });
  });

  describe("deleteQuestion", () => {
    it("should soft delete question and cascade to answers", async () => {
      mockPrisma.reviewQA.findUnique.mockResolvedValue({ id: "qa_1", authorId: "user_1" });
      mockPrisma.$transaction.mockResolvedValue(undefined);

      await deleteQuestion("qa_1", "user_1");

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("createAnswer", () => {
    it("should create answer and increment answerCount", async () => {
      const mockQuestion = { id: "qa_1", reviewId: "review_1", authorId: "user_2" };
      const mockAnswer = {
        id: "ans_1",
        questionId: "qa_1",
        authorId: "user_1",
        body: "Antwort",
        score: 0,
        isAccepted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        editedAt: null,
        deletedAt: null,
        author: { id: "user_1", username: "user1", displayName: "User One", profileImageUrl: null },
      };

      mockPrisma.reviewQA.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          qAAnswer: { create: vi.fn().mockResolvedValue(mockAnswer) },
          reviewQA: { update: vi.fn() },
        };
        return fn(tx);
      });

      const result = await createAnswer("qa_1", "user_1", "Antwort");

      expect(result.body).toBe("Antwort");
    });
  });

  describe("toggleVote", () => {
    it("should add vote and update score", async () => {
      mockPrisma.reviewQA.findUnique.mockResolvedValue({ id: "qa_1", authorId: "user_2" });
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          qAVote: {
            upsert: vi.fn(),
            findMany: vi.fn().mockResolvedValue([{ value: 1 }]),
          },
          reviewQA: { update: vi.fn() },
        };
        return fn(tx);
      });

      const result = await toggleVote("user_1", 1, "qa_1");

      expect(result.score).toBe(1);
      expect(result.userVote).toBe(1);
    });

    it("should throw if voting on own question", async () => {
      mockPrisma.reviewQA.findUnique.mockResolvedValue({ id: "qa_1", authorId: "user_1" });

      await expect(toggleVote("user_1", 1, "qa_1")).rejects.toThrow("Eigene Inhalte");
    });
  });

  describe("acceptAnswer", () => {
    it("should accept answer and update question status", async () => {
      const mockQuestion = {
        id: "qa_1",
        authorId: "user_1",
        acceptedAnswerId: null,
        reviewId: "review_1",
      };
      const mockAnswer = { id: "ans_1", authorId: "user_2" };

      mockPrisma.reviewQA.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          qAAnswer: {
            update: vi.fn(),
            findUnique: vi.fn().mockResolvedValue(mockAnswer),
          },
          reviewQA: { update: vi.fn() },
        };
        return fn(tx);
      });

      const result = await acceptAnswer("qa_1", "ans_1", "user_1");

      expect(result.acceptedAnswerId).toBe("ans_1");
      expect(result.status).toBe("RESOLVED");
    });
  });
});