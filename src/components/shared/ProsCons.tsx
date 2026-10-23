interface ProsConsProps {
  pros: string[];
  cons: string[];
}

export function ProsCons({ pros, cons }: ProsConsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pros.length > 0 && (
        <section>
          <h3 className="kicker mb-2 text-sm font-semibold text-foreground">Pro</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: "var(--chart-3)" }}>✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {cons.length > 0 && (
        <section>
          <h3 className="kicker mb-2 text-sm font-semibold text-foreground">Contra</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: "var(--chart-1)" }}>✗</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
