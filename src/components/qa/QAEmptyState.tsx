'use client';

import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface QAEmptyStateProps {
  onAskQuestion: () => void;
  className?: string;
}

export function QAEmptyState({ onAskQuestion, className }: QAEmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className || ''}`} role="status" aria-live="polite">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <HelpCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium mb-2">Noch keine Fragen</h3>
      <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
        Sei der Erste, der eine Frage zu diesem Review stellt!
      </p>
      <Button onClick={onAskQuestion} size="lg" className="gap-2">
        <HelpCircle className="h-4 w-4" />
        Frage stellen
      </Button>
    </div>
  );
}