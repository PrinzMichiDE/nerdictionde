export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="text-center py-20">
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
        {description}
      </p>
    </section>
  );
}
