'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  QAListResponse,
  QAQuestionListItem,
  QAQuestionFormData,
  QAAnswerFormData,
  QAAnswerWithUserVote,
  QAAcceptAnswerResponse,
} from '@/types/qa';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook für QA-Liste (Fragen zu einem Review)
 * Lädt initiale Daten via Props (SSR), danach Client-seitig via API
 */
export function useQAList(reviewSlug: string, initialData?: QAListResponse) {
  const [questions, setQuestions] = useState<QAQuestionListItem[]>(initialData?.questions ?? []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData?.nextCursor ?? null);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount ?? 0);
  const { toast } = useToast();

  const fetchQuestions = useCallback(
    async (cursor?: string, append = false) => {
      try {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        params.set('limit', '10');
        params.set('sort', 'relevance');

        const res = await fetch(`/api/reviews/${reviewSlug}/qa?${params.toString()}`);
        if (!res.ok) throw new Error('Fehler beim Laden der Fragen');

        const data: QAListResponse = await res.json();

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
        toast({ title: 'Fehler', description: 'Fragen konnten nicht geladen werden', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [reviewSlug, toast]
  );

  const loadMore = useCallback(async () => {
    if (nextCursor && !isLoading) {
      await fetchQuestions(nextCursor, true);
    }
  }, [nextCursor, isLoading, fetchQuestions]);

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
 * Hook für QA-Mutationen (Create, Update, Delete Fragen & Antworten, Accept)
 */
export function useQAMutations(reviewSlug: string) {
  const { toast } = useToast();
  const [isMutating, setIsMutating] = useState(false);

  const createQuestion = useCallback(
    async (data: QAQuestionFormData): Promise<QAQuestionListItem> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Erstellen der Frage');
        }
        const question = await res.json();
        toast({ title: 'Erfolg', description: 'Frage wurde gestellt' });
        return question;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Erstellen';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
  );

  const updateQuestion = useCallback(
    async (questionId: string, data: Partial<QAQuestionFormData>): Promise<QAQuestionListItem> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Aktualisieren');
        }
        const result = await res.json();
        toast({ title: 'Erfolg', description: 'Frage wurde aktualisiert' });
        return result.question;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
  );

  const deleteQuestion = useCallback(
    async (questionId: string): Promise<void> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Löschen');
        }
        toast({ title: 'Erfolg', description: 'Frage wurde gelöscht' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Löschen';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
  );

  const createAnswer = useCallback(
    async (questionId: string, data: QAAnswerFormData): Promise<QAAnswerWithUserVote> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Erstellen der Antwort');
        }
        const answer = await res.json();
        toast({ title: 'Erfolg', description: 'Antwort wurde erstellt' });
        return answer;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Erstellen';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
  );

  const updateAnswer = useCallback(
    async (answerId: string, data: QAAnswerFormData): Promise<QAAnswerWithUserVote> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${answerId.split('_')[0]}/answers/${answerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Aktualisieren');
        }
        const result = await res.json();
        toast({ title: 'Erfolg', description: 'Antwort wurde aktualisiert' });
        return result.answer;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Aktualisieren';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
  );

  const deleteAnswer = useCallback(
    async (answerId: string): Promise<void> => {
      setIsMutating(true);
      try {
        const questionId = answerId.split('_')[0]; // Extract questionId from answerId if needed
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}/answers/${answerId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Löschen');
        }
        toast({ title: 'Erfolg', description: 'Antwort wurde gelöscht' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Löschen';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
  );

  const acceptAnswer = useCallback(
    async (questionId: string, answerId: string): Promise<QAAcceptAnswerResponse> => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answerId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Akzeptieren');
        }
        const response = await res.json();
        toast({ title: 'Erfolg', description: response.acceptedAnswerId ? 'Antwort als Lösung markiert' : 'Akzeptierung aufgehoben' });
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Akzeptieren';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [reviewSlug, toast]
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