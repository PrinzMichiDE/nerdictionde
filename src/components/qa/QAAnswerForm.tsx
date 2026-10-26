'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { QAAnswerWithUserVote } from '@/types/qa';

interface QAAnswerFormProps {
  questionId: string;
  answer?: QAAnswerWithUserVote | null;
  onSuccess: (data: { body: string }) => Promise<void>;
  onCancel: () => Promise<void>;
  className?: string;
}

export function QAAnswerForm({
  questionId,
  answer,
  onSuccess,
  onCancel,
  className,
}: QAAnswerFormProps) {
  const [body, setBody] = useState(answer?.body || '');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (answer?.body) {
      setBody(answer.body);
    }
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await onSuccess({ body: body.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!answer;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 p-4 border rounded-lg bg-card ${className || ''}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{isEditing ? 'Antwort bearbeiten' : 'Antwort schreiben'}</h4>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="qa-answer-body" className="block text-sm font-medium">
            Antwort (Markdown unterstützt)
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1"
          >
            {showPreview ? 'Bearbeiten' : 'Vorschau'}
          </Button>
        </div>
        {showPreview ? (
          <div
            id="qa-answer-body-preview"
            className="prose prose-sm max-w-none p-3 border rounded-md bg-muted min-h-[100px]"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <textarea
            id="qa-answer-body"
            maxLength={3000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
            placeholder="Deine Antwort..."
            required
            disabled={isSubmitting}
          />
        )}
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {body.length}/3000 Zeichen
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting || !body.trim()}>
          {isSubmitting ? 'Wird gespeichert...' : isEditing ? 'Speichern' : 'Antworten'}
        </Button>
      </div>
    </form>
  );
}