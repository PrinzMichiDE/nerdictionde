import { format } from "date-fns";
import { de } from "date-fns/locale";

interface MetaLineProps {
  author?: string;
  date?: Date | string;
  category?: string;
  readingTime?: number;
}

export function MetaLine({ author, date, category, readingTime }: MetaLineProps) {
  const items: string[] = [];
  if (author) items.push(author);
  if (date) {
    const d = typeof date === "string" ? new Date(date) : date;
    items.push(format(d, "dd. MMMM yyyy", { locale: de }));
  }
  if (readingTime) items.push(`${readingTime} Min. Lesezeit`);
  if (category) items.push(category);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">·</span>}
          {item}
        </span>
      ))}
    </div>
  );
}
