'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ClearHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isEn?: boolean;
}

export function ClearHistoryDialog({
  open,
  onOpenChange,
  onConfirm,
  isEn = false,
}: ClearHistoryDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast({
        title: isEn ? 'History cleared' : 'Verlauf geleert',
        description: isEn
          ? 'Your reading history has been deleted.'
          : 'Dein Leseverlauf wurde gelöscht.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: isEn ? 'Error' : 'Fehler',
        description: error instanceof Error ? error.message : (isEn ? 'Failed to clear history' : 'Verlauf konnte nicht geleert werden'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="clear-history-title">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 animate-in fade-in zoom-in-95">
        <h3 id="clear-history-title" className="text-lg font-semibold mb-2">
          {isEn ? 'Clear reading history?' : 'Leseverlauf leeren?'}
        </h3>
        <p className="text-muted-foreground mb-6">
          {isEn
            ? 'This will permanently delete all your reading history entries. This action cannot be undone.'
            : 'Dadurch werden alle deine Leseverlauf-Einträge dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              'bg-muted text-muted-foreground hover:bg-muted/80',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isEn ? 'Cancel' : 'Abbrechen'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isDeleting
              ? (isEn ? 'Deleting...' : 'Lösche...')
              : (isEn ? 'Clear all' : 'Alles löschen')}
          </button>
        </div>
      </div>
    </div>
  );
}