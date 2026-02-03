"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  manufacturer?: string | null;
  price?: number | null;
}

interface ComponentSelectorProps {
  type: string;
  items: ComponentItem[];
  selected?: ComponentItem;
  onSelect: (item: ComponentItem | null) => void;
}

export function ComponentSelector({
  type,
  items,
  selected,
  onSelect,
}: ComponentSelectorProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="w-32 text-sm font-medium capitalize">{type}</label>
      <Select
        value={selected?.id ?? undefined}
        onValueChange={(id) => {
          if (id === "__none__") {
            onSelect(null);
          } else {
            const item = items.find((i) => i.id === id) ?? null;
            onSelect(item);
          }
        }}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={`${type} wählen`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Keine —</SelectItem>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
              {item.price != null ? ` — ${item.price.toFixed(2)} €` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
