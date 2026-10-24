'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronDown, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QAVoteButtons } from './QAVoteButtons';
import { QAAnswers } from './QAAnswers';
import { QAQuestionForm } from './QAQuestionForm';
import { QAAnswerForm } from './QAAnswerForm';
import { useQAMutations } from '@/hooks/useQA';
import { useToast } from '@/hooks/use-toast';
import type { QAQuestionListItem } from '@/types/qa';

interface QAQuestionProps {
  question: QAQuestionListItem;
  onVote: (value: 1 | -1 | 0) => Promise<void>;
  isOwnQuestion: boolean;
  currentUserId?: string;
  className?: string;
}

export function QAQuestion({
  question,
  onVote,
  isOwnQuestion,
  currentUserId,
  className,
}: QAQuestionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const { deleteQuestion, updateQuestion, acceptAnswer, isMutating } = useQAMutations('');
  const { toast } = useToast();

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  const handleDelete = async () => {
    if (!confirm('Frage wirklich löschen? Alle Antworten werden ebenfalls gelöscht.')) return;
    try {
      await deleteQuestion(question.id);
      toast({ title: 'Erfolg', description: 'Frage gelöscht' });
      window.location.reload();
    } catch {}
  };

  const handleEdit = async (data: { title?: string; body?: string }) => {
    try {
      await updateQuestion(question.id, data);
      toast({ title: 'Erfolg', description: 'Frage aktualisiert' });
      setShowEditForm(false);
      window.location.reload();
    } catch {}
  };

  const handleAccept = async (answerId: string) => {
    try {
      await acceptAnswer(question.id, answerId);
      toast({ title: 'Erfolg', description: question.acceptedAnswerId === answerId ? 'Akzeptierung aufgehoben' : 'Antwort als Lösung markiert' });
      window.location.reload();
    } catch {}
  };

  const statusBadge = question.status === 'RESOLVED' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
      <CheckCircle className="h-3 w-3" />
      Gelöst
    </span>
  ) : question.status === 'CLOSED' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
      Geschlossen
    </span>
  ) : null;

  return (
    <article className={`border rounded-lg overflow-hidden ${className || ''}`}>
      <details className="group" open={isExpanded}>
        <summary
          className="flex items-start gap-3 p-4 cursor-pointer list-none focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button, a, [role="button"]')) {
              e.preventDefault();
            } else {
              handleToggleExpand();
            }
          }}
          aria-expanded={isExpanded}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="font-medium text-lg line-clamp-2">{question.title}</h3>
              {statusBadge}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span>👤</span>
                {question.author.displayName || question.author.username}
              </span>
              <span className="flex items-center gap-1">
                <span>🕐</span>
                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true, locale: de })}
              </span>
              <QAVoteButtons
                score={question.score}
                userVote={question.userVote}
                onVote={onVote}
                disabled={isOwnQuestion}
                ariaLabelUpvote={`Frage upvoten (Score: ${question.score})`}
                ariaLabelDownvote={`Frage downvoten (Score: ${question.score})`}
              />
              {question.answerCount > 0 && (
                <span className="flex items-center gap-1">
                  <span>💬</span>
                  {question.answerCount} Antwort{question.answerCount > 1 ? 'en' : ''}
                </span>
              )}
            </div>
            {question.body && (
              <div className="mt-2 text-sm text-muted-foreground prose prose-sm max-w-none">
                {question.body}
              </div>
            )}
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </summary>

        {isExpanded && (
          <div className="border-t bg-muted/30">
            <div className="p-4 space-y-4">
              {isOwnQuestion && !showEditForm && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditForm(true)}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Löschen
                  </Button>
                </div>
              )}

              {showEditForm && (
                <QAQuestionForm
                  reviewSlug=""
                  initialData={{ title: question.title, body: question.body ?? undefined }}
                  onSuccess={handleEdit}
                  onCancel={async () => { setShowEditForm(false); }}
                />
              )}

              <QAAnswers
                answers={question.answers}
                questionAuthorId={question.author.id}
                currentUserId={currentUserId}
                onVote={async (answerId: string, value: 1 | -1 | 0) => {
                  // Vote on answer - would need questionId
                }}
                onAccept={handleAccept}
                onDelete={async (answerId: string) => {
                  // Delete answer
                }}
                onEdit={async (answerId: string, data: { body: string }) => {
                  setEditingAnswerId(answerId);
                }}
                acceptedAnswerId={question.acceptedAnswerId}
              />

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswerForm(true)}
                  className="w-full gap-1"
                >
                  Antwort schreiben
                </Button>
              </div>

              {showAnswerForm && (
                <QAAnswerForm
                  questionId={question.id}
                  onSuccess={async () => {
                    setShowAnswerForm(false);
                    window.location.reload();
                  }}
                  onCancel={async () => { setShowAnswerForm(false); }}
                />
              )}

              {editingAnswerId && (
                <QAAnswerForm
                  questionId={question.id}
                  answer={question.answers.find(a => a.id === editingAnswerId) || null}
                  onSuccess={async () => {
                    setEditingAnswerId(null);
                    window.location.reload();
                  }}
                  onCancel={async () => { setEditingAnswerId(null); }}
                />
              )}
            </div>
          </div>
        )}
      </details>
    </article>
  );
}