'use client';

import { useState, useCallback } from 'react';
import type { QAVoteValue, UseQAVoteReturn, UseQAAnswerVoteReturn } from '@/types/qa';

/**
 * Hook für Voting auf Fragen
 */
export function useQAVote(reviewSlug: string, questionId: string): UseQAVoteReturn {
  const [score, setScore] = useState(0);
  const [userVote, setUserVote] = useState<QAVoteValue>(null);
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async (value: 1 | -1 | 0) => {
      if (isVoting) return;
      setIsVoting(true);

      // Optimistic Update
      const previousScore = score;
      const previousUserVote = userVote;

      // Berechne neuen Score optimistisch
      let newScore = score;
      if (userVote === null) {
        newScore += value;
      } else if (userVote === value) {
        // Gleicher Vote -> entfernen
        newScore -= value;
      } else {
        // Wechsel von up zu down oder umgekehrt
        newScore += value * 2;
      }

      setScore(newScore);
      setUserVote(value === 0 ? null : value);

      try {
        const response = await fetch(`/api/reviews/${reviewSlug}/qa/${questionId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setScore(data.score);
        setUserVote(data.userVote);
      } catch (error) {
        // Rollback bei Fehler
        setScore(previousScore);
        setUserVote(previousUserVote);
        console.error('Vote error:', error);
        throw error;
      } finally {
        setIsVoting(false);
      }
    },
    [reviewSlug, questionId, score, userVote, isVoting]
  );

  return { vote, score, userVote, isVoting };
}

/**
 * Hook für Voting auf Antworten
 */
export function useQAAnswerVote(reviewSlug: string, questionId: string, answerId: string): UseQAAnswerVoteReturn {
  const [score, setScore] = useState(0);
  const [userVote, setUserVote] = useState<QAVoteValue>(null);
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async (value: 1 | -1 | 0) => {
      if (isVoting) return;
      setIsVoting(true);

      // Optimistic Update
      const previousScore = score;
      const previousUserVote = userVote;

      let newScore = score;
      if (userVote === null) {
        newScore += value;
      } else if (userVote === value) {
        newScore -= value;
      } else {
        newScore += value * 2;
      }

      setScore(newScore);
      setUserVote(value === 0 ? null : value);

      try {
        const response = await fetch(
          `/api/reviews/${reviewSlug}/qa/${questionId}/answers/${answerId}/vote`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setScore(data.score);
        setUserVote(data.userVote);
      } catch (error) {
        // Rollback bei Fehler
        setScore(previousScore);
        setUserVote(previousUserVote);
        console.error('Answer vote error:', error);
        throw error;
      } finally {
        setIsVoting(false);
      }
    },
    [reviewSlug, questionId, answerId, score, userVote, isVoting]
  );

  return { vote, score, userVote, isVoting };
}