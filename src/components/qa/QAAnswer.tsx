'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { QAVoteButtons } from './QAVoteButtons';
import { QAAnswerForm } from './QAAnswerForm';
import { CheckCircle, Edit, Trash2 } from 'lucide-react';
import type { QAAnswerWithUserVote } from '@/types/qa';

interface QAAnswerProps {
  answer: QAAnswerWithUserVote;
  isQuestionAuthor: boolean;
  isAnswerAuthor: boolean;
  onVote: (answerId: string, value: 1 | -1 | 0) => Promise<void>;
  onAccept: (answerId: string) => Promise<void>;
  onDelete: (answerId: string) => Promise<void>;
  onEdit: (answerId: string, data: { body: string }) => Promise<void>;
  isAccepted: boolean;
  className?: string;
}

export function QAAnswer({
  answer,
  isQuestionAuthor,
  isAnswerAuthor,
  onVote,
  onAccept,
  onDelete,
  onEdit,
  isAccepted,
  className,
}: QAAnswerProps) {
  const [showEditForm, setShowEditForm] = useState(false);

  const handleVote = async (value: 1 | -1 | 0) => {
    await onVote(answer.id, value);
  };

  const handleAccept = async () => {
    await onAccept(answer.id);
  };

  const handleDelete = async () => {
    if (!confirm('Antwort wirklich löschen?')) return;
    await onDelete(answer.id);
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleEditSubmit = async (data: { body: string }) => {
    await onEdit(answer.id, data);
    setShowEditForm(false);
  };

  const handleCancelEdit = async () => {
    setShowEditForm(false);
  };

  return (
    <article
      className={`border rounded-lg p-4 ${answer.isAccepted ? 'border-green-300 bg-green-50' : ''} ${className || ''}`}
      data-answer-id={answer.id}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <QAVoteButtons
            score={answer.score}
            userVote={answer.userVote}
            onVote={handleVote}
            disabled={isAnswerAuthor}
            ariaLabelUpvote={`Antwort upvoten (Score: ${answer.score})`}
            ariaLabelDownvote={`Antwort downvoten (Score: ${answer.score})`}
          />
          {isAccepted && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-green-600" title="Akzeptierte Antwort">
              <CheckCircle className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>👤</span>
              <span className="font-medium">{answer.author.displayName || answer.author.username}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true, locale: de })}
            </span>
            {answer.editedAt && (
              <span className="text-xs text-muted-foreground">(bearbeitet)</span>
            )}
            {isAccepted && answer.isAccepted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                <CheckCircle className="h-3 w-3" />
                Lösung
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none mb-3">
            {answer.body}
          </div>
          <div className="flex items-center gap-2">
            {isQuestionAuthor && !isAccepted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAccept}
                className="gap-1"
                aria-pressed={isAccepted}
              >
                <CheckCircle className="h-3 w-3" />
                Als Lösung markieren
              </Button>
            )}
            {isAnswerAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                  className="gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Bearbeiten
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(answer.id)}
                  className="gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Löschen
                </Button>
              </>
            )}
          </div>
          {showEditForm && (
            <QAAnswerForm
              questionId=""
              answer={answer}
              onSuccess={handleEditSubmit}
              onCancel={handleCancelEdit}
            />
          )}
        </div>
      </div>
    </article>
  );
}