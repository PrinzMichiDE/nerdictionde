'use client';

import { QAAnswer } from './QAAnswer';
import type { QAAnswerWithUserVote } from '@/types/qa';

interface QAAnswersProps {
  answers: QAAnswerWithUserVote[];
  questionAuthorId: string;
  currentUserId: string | undefined;
  onVote: (answerId: string, value: 1 | -1 | 0) => Promise<void>;
  onAccept: (answerId: string) => Promise<void>;
  onDelete: (answerId: string) => Promise<void>;
  onEdit: (answerId: string, data: { body: string }) => Promise<void>;
  acceptedAnswerId: string | null;
  className?: string;
}

export function QAAnswers({
  answers,
  questionAuthorId,
  currentUserId,
  onVote,
  onAccept,
  onDelete,
  onEdit,
  acceptedAnswerId,
  className,
}: QAAnswersProps) {
  if (answers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Noch keine Antworten. Sei der Erste, der antwortet!
      </div>
    );
  }

  // Sort: accepted first, then by score desc, then by date asc
  const sortedAnswers = [...answers].sort((a, b) => {
    if (a.isAccepted && !b.isAccepted) return -1;
    if (!a.isAccepted && b.isAccepted) return 1;
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {sortedAnswers.map((answer) => (
        <QAAnswer
          key={answer.id}
          answer={answer}
          isQuestionAuthor={questionAuthorId === currentUserId}
          isAnswerAuthor={answer.author.id === currentUserId}
          onVote={onVote}
          onAccept={onAccept}
          onDelete={onDelete}
          onEdit={onEdit}
          isAccepted={answer.isAccepted}
        />
      ))}
    </div>
  );
}