"use client";

export default function ForumError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
      <h2 className="font-serif text-2xl font-semibold">Forum konnte nicht geladen werden</h2>
      <p className="text-muted-foreground">Bitte versuche es erneut.</p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Erneut versuchen
      </button>
    </div>
  );
}

