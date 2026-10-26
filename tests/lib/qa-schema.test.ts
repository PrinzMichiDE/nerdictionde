import { describe, it, expect } from 'vitest';
import {
  createQuestionSchema,
  updateQuestionSchema,
  createAnswerSchema,
  updateAnswerSchema,
  voteSchema,
  acceptAnswerSchema,
  qaListQuerySchema,
  qaQuestionListItemSchema,
  qaAnswerSchema,
  voteResponseSchema,
  acceptAnswerResponseSchema,
  qaListResponseSchema,
  isCommunityQAEnabled,
  FEATURE_COMMUNITY_QA,
} from '@/lib/qa-schema';

describe('QA Schemas', () => {
  describe('createQuestionSchema', () => {
    it('accepts valid title only', () => {
      const result = createQuestionSchema.safeParse({ title: 'Wie lange ist das Spiel?' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Wie lange ist das Spiel?');
        expect(result.data.body).toBeUndefined();
      }
    });

    it('accepts valid title and body', () => {
      const result = createQuestionSchema.safeParse({
        title: 'Läuft es auf RTX 3060?',
        body: 'Ich habe eine RTX 3060 12GB...',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createQuestionSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects title > 120 chars', () => {
      const result = createQuestionSchema.safeParse({ title: 'a'.repeat(121) });
      expect(result.success).toBe(false);
    });

    it('rejects body > 2000 chars', () => {
      const result = createQuestionSchema.safeParse({ title: 'Test', body: 'a'.repeat(2001) });
      expect(result.success).toBe(false);
    });

    it('trims whitespace', () => {
      const result = createQuestionSchema.safeParse({ title: '  Test Frage  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Frage');
      }
    });
  });

  describe('updateQuestionSchema', () => {
    it('accepts title only', () => {
      const result = updateQuestionSchema.safeParse({ title: 'Neuer Titel' });
      expect(result.success).toBe(true);
    });

    it('accepts body only', () => {
      const result = updateQuestionSchema.safeParse({ body: 'Neuer Body' });
      expect(result.success).toBe(true);
    });

    it('accepts both', () => {
      const result = updateQuestionSchema.safeParse({ title: 'T', body: 'B' });
      expect(result.success).toBe(true);
    });

    it('rejects empty object', () => {
      const result = updateQuestionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('createAnswerSchema', () => {
    it('accepts valid body', () => {
      const result = createAnswerSchema.safeParse({ body: 'Ja, läuft gut.' });
      expect(result.success).toBe(true);
    });

    it('rejects empty body', () => {
      const result = createAnswerSchema.safeParse({ body: '' });
      expect(result.success).toBe(false);
    });

    it('rejects body > 3000 chars', () => {
      const result = createAnswerSchema.safeParse({ body: 'a'.repeat(3001) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateAnswerSchema', () => {
    it('accepts valid body', () => {
      const result = updateAnswerSchema.safeParse({ body: 'Aktualisierte Antwort' });
      expect(result.success).toBe(true);
    });

    it('rejects empty body', () => {
      const result = updateAnswerSchema.safeParse({ body: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('voteSchema', () => {
    it('accepts +1', () => {
      const result = voteSchema.safeParse({ value: 1 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.value).toBe(1);
    });

    it('accepts -1', () => {
      const result = voteSchema.safeParse({ value: -1 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.value).toBe(-1);
    });

    it('accepts 0 (remove vote)', () => {
      const result = voteSchema.safeParse({ value: 0 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.value).toBe(0);
    });

    it('rejects other values', () => {
      expect(voteSchema.safeParse({ value: 2 }).success).toBe(false);
      expect(voteSchema.safeParse({ value: -2 }).success).toBe(false);
      expect(voteSchema.safeParse({ value: 'up' }).success).toBe(false);
    });
  });

  describe('acceptAnswerSchema', () => {
    it('accepts valid answerId', () => {
      const result = acceptAnswerSchema.safeParse({ answerId: 'ans_abc123' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid format', () => {
      const result = acceptAnswerSchema.safeParse({ answerId: 'invalid id!' });
      expect(result.success).toBe(false);
    });
  });

  describe('qaListQuerySchema', () => {
    it('uses defaults', () => {
      const result = qaListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.sort).toBe('relevance');
        expect(result.data.cursor).toBeUndefined();
      }
    });

    it('accepts valid params', () => {
      const result = qaListQuerySchema.safeParse({ cursor: 'qa_123', limit: '20', sort: 'newest', status: 'OPEN' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('qa_123');
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('newest');
        expect(result.data.status).toBe('OPEN');
      }
    });

    it('rejects limit > 50', () => {
      const result = qaListQuerySchema.safeParse({ limit: '100' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid sort', () => {
      const result = qaListQuerySchema.safeParse({ sort: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('Response Schemas', () => {
    it('qaQuestionListItemSchema parses valid question', () => {
      const question = {
        id: 'qa_1',
        title: 'Test Frage',
        body: 'Body text',
        status: 'OPEN' as const,
        score: 5,
        answerCount: 3,
        acceptedAnswerId: null,
        author: { id: 'u1', username: 'user1', displayName: 'User One', profileImageUrl: null },
        createdAt: new Date(),
        updatedAt: new Date(),
        editedAt: null,
        deletedAt: null,
      };
      const result = qaQuestionListItemSchema.safeParse(question);
      expect(result.success).toBe(true);
    });

    it('qaAnswerSchema parses valid answer', () => {
      const answer = {
        id: 'ans_1',
        questionId: 'qa_1',
        body: 'Antwort text',
        score: 3,
        isAccepted: false,
        author: { id: 'u2', username: 'user2', displayName: 'User Two', profileImageUrl: null },
        createdAt: new Date(),
        updatedAt: new Date(),
        editedAt: null,
        deletedAt: null,
        userVote: null,
      };
      const result = qaAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
    });

    it('voteResponseSchema parses valid response', () => {
      const result = voteResponseSchema.safeParse({ success: true, score: 6, userVote: 1 });
      expect(result.success).toBe(true);
    });

    it('acceptAnswerResponseSchema parses valid response', () => {
      const result = acceptAnswerResponseSchema.safeParse({ success: true, acceptedAnswerId: 'ans_1', status: 'RESOLVED' });
      expect(result.success).toBe(true);
    });

    it('qaListResponseSchema parses valid list', () => {
      const list = {
        questions: [],
        nextCursor: null,
        totalCount: 0,
      };
      const result = qaListResponseSchema.safeParse(list);
      expect(result.success).toBe(true);
    });
  });

  describe('Feature Flag', () => {
    it('isCommunityQAEnabled returns true by default', () => {
      const originalEnv = process.env.FEATURE_COMMUNITY_QA;
      delete process.env.FEATURE_COMMUNITY_QA;
      expect(isCommunityQAEnabled()).toBe(true);
      if (originalEnv) process.env.FEATURE_COMMUNITY_QA = originalEnv;
    });

    it('isCommunityQAEnabled returns false when explicitly disabled', () => {
      const originalEnv = process.env.FEATURE_COMMUNITY_QA;
      process.env.FEATURE_COMMUNITY_QA = 'false';
      expect(isCommunityQAEnabled()).toBe(false);
      if (originalEnv) process.env.FEATURE_COMMUNITY_QA = originalEnv;
      else delete process.env.FEATURE_COMMUNITY_QA;
    });

    it('FEATURE_COMMUNITY_QA constant exists', () => {
      expect(FEATURE_COMMUNITY_QA).toBe('FEATURE_COMMUNITY_QA');
    });
  });
});