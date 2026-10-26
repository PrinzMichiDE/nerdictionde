'use client';

import { useQAList } from '@/hooks/useQA';
import { QAQuestion } from './QAQuestion';
import { QAEmptyState } from './QAEmptyState';
import { QASkeleton } from './QASkeleton';
import { Button } from '@/components/ui/button';
import { useQAMutations } from '@/hooks/useQA';
import { useState } from 'react';
import type { QAListResponse, QAQuestionListItem } from '@/types/qa';
import { ChevronDown } from 'lucide-react';

interface QAListProps {
  reviewSlug: string;
  initialData?: QAListResponse;
  className?: string;
}

export function QAList({ reviewSlug, initialData, className }: QAListProps) {
  const {
    questions,
    isLoading,
    isError,
    error,
    nextCursor,
    totalCount,
    loadMore,
    hasMore,
    refetch,
  } = useQAList(reviewSlug, initialData);

  const { createQuestion, isMutating: isCreating } = useQAMutations(reviewSlug);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateQuestion = async (data: { title: string; body?: string }) => {
    setIsSubmitting(true);
    try {
      await createQuestion(data);
      setShowForm(false);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
    setShowForm(false);
  };

  if (isLoading && !initialData) {
    return <QASkeleton count={5} className={className} />;
  }

  return (
    <section className={`space-y-4 ${className || ''}`} aria-labelledby="qa-heading">
      <header className="flex items-center justify-between">
        <h2 id="qa-heading" className="text-xl font-semibold">
          Fragen & Antworten <span className="text-muted-foreground text-sm font-normal">({totalCount})</span>
        </h2>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
          disabled={isCreating}
          className="gap-1"
        >
          Frage stellen
        </Button>
      </header>

      {showForm && (
        <QAQuestionForm
          reviewSlug={reviewSlug}
          onSuccess={handleCreateQuestion}
          onCancel={handleCancelCreate}
          isSubmitting={isSubmitting}
        />
      )}

      {isError ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Fehler beim Laden der Fragen</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Erneut versuchen
          </Button>
        </div>
      ) : questions.length === 0 ? (
        <QAEmptyState onAskQuestion={() => setShowForm(true)} />
      ) : (
        <>
          <ul className="space-y-3" role="list" aria-label="Fragen & Antworten">
            {questions.map((question) => (
              <li key={question.id}>
                <QAQuestion
                  question={question}
                  isOwnQuestion={false}
                  onVote={async (value: 1 | -1 | 0) => {
                    // Vote is handled by useQAVote hook inside QAQuestion
                    // This is a fallback for when the hook doesn't handle it
                  }}
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                Mehr laden
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// Inline Form Component für Frage erstellen
function QAQuestionForm({
  reviewSlug,
  onSuccess,
  onCancel,
  isSubmitting,
}: {
  reviewSlug: string;
  onSuccess: (data: { title: string; body?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { createQuestion } = useQAMutations(reviewSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSuccess({ title: title.trim(), body: body.trim() || undefined });
    setTitle('');
    setBody('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <label htmlFor="qa-title" className="block text-sm font-medium mb-1">
          Titel der Frage <span className="text-red-500">*</span>
        </label>
        <input
          id="qa-title"
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="z. B. Läuft das Spiel auf RTX 3060?"
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {title.length}/120 Zeichen
        </p>
      </div>
      <div>
        <label htmlFor="qa-body" className="block text-sm font-medium mb-1">
          Details (optional, Markdown unterstützt)
        </label>
        <textarea
          id="qa-body"
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
          placeholder="Zusätzliche Informationen..."
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {body.length}/2000 Zeichen
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Wird erstellt...' : 'Frage stellen'}
        </Button>
      </div>
    </form>
  );
}