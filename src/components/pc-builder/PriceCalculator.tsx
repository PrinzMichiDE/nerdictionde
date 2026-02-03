"use client";

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  price?: number | null;
}

interface PriceCalculatorProps {
  selected: Record<string, ComponentItem>;
  totalPrice: number;
}

export function PriceCalculator({ selected, totalPrice }: PriceCalculatorProps) {
  const entries = Object.entries(selected).filter(([, c]) => c.price != null && c.price > 0);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Preisübersicht</h3>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {entries.map(([type, c]) => (
          <li key={type} className="flex justify-between">
            <span className="capitalize">{type}</span>
            <span>{(c.price ?? 0).toFixed(2)} €</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t pt-3 font-bold text-lg">
        <span>Gesamt</span>
        <span className="text-primary">{totalPrice.toFixed(2)} €</span>
      </div>
    </div>
  );
}
