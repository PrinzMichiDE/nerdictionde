'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  QAQuestionListItem,
  QAAnswerWithUserVote,
  QAListResponse,
  QAQuestionFormData,
  QAAnswerFormData,
  QAAcceptAnswerResponse,
  UseQAListReturn,
  UseQAMutationsReturn,
} from '@/types/qa';

/**
 * Hook für Q&A Liste mit Pagination und SSR-Support
 */
export function useQAList(reviewSlug: string, initialData?: QAListResponse): UseQAListReturn {
  const [questions, setQuestions] = useState<QAQuestionListItem[]>(initialData?.questions ?? []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData?.nextCursor ?? null);
  const [totalCount, setTotalCount] = useState<number>(initialData?.totalCount ?? 0);

  const fetchQuestions = useCallback(
    async (cursor?: string, append = false) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '10');
        params.set('sort', 'relevance');

        const response = await fetch(`/api/reviews/${reviewSlug}/qa?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Fragen');
        }

        const data: QAListResponse = await response.json();

        if (append) {
          setQuestions((prev) => [...prev, ...data.questions]);
        } else {
          setQuestions(data.questions);
        }
        setNextCursor(data.nextCursor);
        setTotalCount(data.totalCount);
      } catch (err) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
      } finally {
        setIsLoading(false);
      }
    },
    [reviewSlug]
  );

  const loadMore = useCallback(async () => {
    if (nextCursor && !isLoading) {
      await fetchQuestions(nextCursor, true);
    }
  }, [fetchQuestions, nextCursor, isLoading]);

  const refetch = useCallback(async () => {
    await fetchQuestions();
  }, [fetchQuestions]);

  // Initial fetch if no initialData
  useEffect(() => {
    if (!initialData) {
      fetchQuestions();
    }
  }, [initialData, fetchQuestions]);

  return {
    questions,
    isLoading,
    isError,
    error,
    nextCursor,
    totalCount,
    loadMore,
    hasMore: !!nextCursor,
    refetch,
  };
}

/**
 * Hook für Q&A Mutations (Create, Update, Delete, Accept)
 */
export function useQAMutations(): UseQAMutationsReturn {
  const [isMutating, setIsMutating] = useState(false);

  const apiCall = useCallback(
    async <T>(url: string, options: RequestInit): Promise<T> => {
      setIsMutating(true);
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return response.json();
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const createQuestion = useCallback(
    async (reviewSlug: string, data: QAQuestionFormData): Promise<QAQuestionListItem> => {
      const result = await apiCall<{ question: QAQuestionListItem }>(`/api/reviews/${reviewSlug}/qa`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.question;
    },
    [apiCall]
  );

  const updateQuestion = useCallback(
    async (reviewSlug: string, questionId: string, data: Partial<QAQuestionFormData>): Promise<QAQuestionListItem> => {
      const result = await apiCall<{ question: QAQuestionListItem }>(
        `/api/reviews/${reviewSlug}/qa/${questionId}`,
        { method: 'PATCH', body: JSON.stringify(data) }
      );
      return result.question;
    },
    [apiCall]
  );

  const deleteQuestion = useCallback(
    async (reviewSlug: string, questionId: string): Promise<void> => {
      await apiCall(`/api/reviews/${reviewSlug}/qa/${questionId}`, { method: 'DELETE' });
    },
    [apiCall]
  );

  const createAnswer = useCallback(
    async (reviewSlug: string, questionId: string, data: QAAnswerFormData): Promise<QAAnswerWithUserVote> => {
      const result = await apiCall<{ answer: QAAnswerWithUserVote }>(
        `/api/reviews/${reviewSlug}/qa/${questionId}/answers`,
        { method: 'POST', body: JSON.stringify(data) }
      );
      return result.answer;
    },
    [apiCall]
  );

  const updateAnswer = useCallback(
    async (reviewSlug: string, questionId: string, answerId: string, data: QAAnswerFormData): Promise<QAAnswerWithUserVote> => {
      const result = await apiCall<{ answer: QAAnswerWithUserVote }>(
        `/api/reviews/${reviewSlug}/qa/${questionId}/answers/${answerId}`,
        { method: 'PATCH', body: JSON.stringify(data) }
      );
      return result.answer;
    },
    [apiCall]
  );

  const deleteAnswer = useCallback(
    async (reviewSlug: string, questionId: string, answerId: string): Promise<void> => {
      await apiCall(`/api/reviews/${reviewSlug}/qa/${questionId}/answers/${answerId}`, { method: 'DELETE' });
    },
    [apiCall]
  );

  const acceptAnswer = useCallback(
    async (reviewSlug: string, questionId: string, answerId: string): Promise<QAAcceptAnswerResponse> => {
      const result = await apiCall<QAAcceptAnswerResponse>(
        `/api/reviews/${reviewSlug}/qa/${questionId}/accept`,
        { method: 'POST', body: JSON.stringify({ answerId }) }
      );
      return result;
    },
    [apiCall]
  );

  return {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createAnswer,
    updateAnswer,
    deleteAnswer,
    acceptAnswer,
    isMutating,
  };
}