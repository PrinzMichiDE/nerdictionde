'use client';

import { useState, useCallback } from 'react';
import type { QAVoteValue } from '@/types/qa';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook für Vote auf Frage
 * Optimistic UI: sofortiger Update, Rollback bei Fehler
 */
export function useQAVote(
  reviewSlug: string,
  questionId: string,
  initialScore: number,
  initialUserVote: QAVoteValue
) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<QAVoteValue>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const vote = useCallback(
    async (value: 1 | -1 | 0) => {
      // Optimistic Update
      const prevScore = score;
      const prevUserVote = userVote;

      let newScore = score;
      let newUserVote: QAVoteValue = null;

      if (value === 0) {
        // Vote entfernen
        if (userVote === 1) newScore = score - 1;
        else if (userVote === -1) newScore = score + 1;
        newUserVote = null;
      } else if (value === userVote) {
        // Gleicher Vote -> entfernen (toggle)
        if (value === 1) newScore = score - 1;
        else newScore = score + 1;
        newUserVote = null;
      } else {
        // Anderer Vote oder neuer Vote
        if (userVote === 1) newScore = score - 1;
        else if (userVote === -1) newScore = score + 1;
        if (value === 1) newScore = newScore + 1;
        else newScore = newScore - 1;
        newUserVote = value;
      }

      setScore(newScore);
      setUserVote(newUserVote);
      setIsVoting(true);

      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Voten');
        }

        const data = await res.json();
        // Server-Antwort als Quelle der Wahrheit
        setScore(data.score);
        setUserVote(data.userVote);
      } catch (err) {
        // Rollback
        setScore(prevScore);
        setUserVote(prevUserVote);
        const message = err instanceof Error ? err.message : 'Fehler beim Voten';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
      } finally {
        setIsVoting(false);
      }
    },
    [reviewSlug, questionId, score, userVote, toast]
  );

  return {
    score,
    userVote,
    isVoting,
    vote,
  };
}

/**
 * Hook für Vote auf Antwort
 * Optimistic UI: sofortiger Update, Rollback bei Fehler
 */
export function useQAAnswerVote(
  reviewSlug: string,
  answerId: string,
  initialScore: number,
  initialUserVote: QAVoteValue
) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<QAVoteValue>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  // Extract questionId from answerId (format: ans_<id>, but we need questionId for API)
  // Since answerId doesn't contain questionId, we need to pass it separately
  // For now, we'll use a different approach: the questionId should be passed as param
  // But to keep API consistent, we'll assume the answerId format allows extraction
  // Actually, better to pass questionId as parameter

  const vote = useCallback(
    async (value: 1 | -1 | 0, questionId: string) => {
      // Optimistic Update
      const prevScore = score;
      const prevUserVote = userVote;

      let newScore = score;
      let newUserVote: QAVoteValue = null;

      if (value === 0) {
        if (userVote === 1) newScore = score - 1;
        else if (userVote === -1) newScore = score + 1;
        newUserVote = null;
      } else if (value === userVote) {
        if (value === 1) newScore = score - 1;
        else newScore = score + 1;
        newUserVote = null;
      } else {
        if (userVote === 1) newScore = score - 1;
        else if (userVote === -1) newScore = score + 1;
        if (value === 1) newScore = newScore + 1;
        else newScore = newScore - 1;
        newUserVote = value;
      }

      setScore(newScore);
      setUserVote(newUserVote);
      setIsVoting(true);

      try {
        const res = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}/answers/${answerId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Fehler beim Voten');
        }

        const data = await res.json();
        setScore(data.score);
        setUserVote(data.userVote);
      } catch (err) {
        setScore(prevScore);
        setUserVote(prevUserVote);
        const message = err instanceof Error ? err.message : 'Fehler beim Voten';
        toast({ title: 'Fehler', description: message, variant: 'destructive' });
      } finally {
        setIsVoting(false);
      }
    },
    [reviewSlug, answerId, score, userVote, toast]
  );

  return {
    score,
    userVote,
    isVoting,
    vote,
  };
}