interface MethodNoteProps {
  text: string;
}

export function MethodNote({ text }: MethodNoteProps) {
  return (
    <aside className="rounded-lg border border-border bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground">{text}</p>
    </aside>
  );
}
