'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QAQuestionFormProps {
  reviewSlug: string;
  initialData?: { title?: string; body?: string };
  onSuccess: (data: { title: string; body?: string }) => Promise<void>;
  onCancel: () => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export function QAQuestionForm({
  reviewSlug,
  initialData,
  onSuccess,
  onCancel,
  isSubmitting = false,
  className,
}: QAQuestionFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSuccess({ title: title.trim(), body: body.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 p-4 border rounded-lg bg-card ${className || ''}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{initialData?.title ? 'Frage bearbeiten' : 'Neue Frage stellen'}</h4>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <label htmlFor="qa-title" className="block text-sm font-medium mb-1">
          Titel <span className="text-red-500">*</span>
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
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {title.length}/120 Zeichen
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="qa-body" className="block text-sm font-medium">
            Details (optional, Markdown unterstützt)
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
            id="qa-body-preview"
            className="prose prose-sm max-w-none p-3 border rounded-md bg-muted min-h-[100px]"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
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
        )}
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {body.length}/2000 Zeichen
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Wird gespeichert...' : initialData?.title ? 'Speichern' : 'Frage stellen'}
        </Button>
      </div>
    </form>
  );
}