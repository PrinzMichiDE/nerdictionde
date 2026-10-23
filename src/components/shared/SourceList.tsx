interface SourceItem {
  name: string;
  url?: string;
}

interface SourceListProps {
  sources: SourceItem[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {sources.map((source) => (
        <li key={source.name}>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {source.name}
            </a>
          ) : (
            source.name
          )}
        </li>
      ))}
    </ul>
  );
}
