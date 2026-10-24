'use client';

import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ReadingHistoryList } from '@/components/reading-history/ReadingHistoryList';
import { cn } from '@/lib/utils';

interface ReadingHistoryClientProps {
  initialData: {
    items: import('@/types/reading-history').ReadingHistoryEntry[];
    nextCursor: string | null;
  } | null;
  isAuthenticated: boolean;
}

export function ReadingHistoryClient({ initialData, isAuthenticated }: ReadingHistoryClientProps) {
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12" role="main">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <svg className="size-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20M6.5 2a2.5 2.5 0 0 0 0 5H20" />
              <path d="M2 8h20" />
              <path d="M2 13h20" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Leseverlauf</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Melde dich an, um deinen Leseverlauf zu sehen. Dein Fortschritt wird automatisch gespeichert, wenn du Reviews liest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg',
                'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                'transition-colors font-medium'
              )}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Anmelden
            </Link>
            <Link
              href="/register"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 py-3 border border-border bg-background',
                'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'transition-colors font-medium'
              )}
            >
              Registrieren
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12" role="main">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leseverlauf</h1>
        <p className="text-muted-foreground mt-2">
          Hier siehst du, welche Reviews du bereits gelesen hast und wie weit du gekommen bist.
          Dein Fortschritt wird automatisch erfasst (ab 50% Scroll-Tiefe oder 30 Sekunden Lesedauer).
        </p>
      </header>

      <ReadingHistoryList
        initialData={initialData ?? { items: [], nextCursor: null }}
        isEn={false}
      />
    </main>
  );
}