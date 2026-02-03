"use client";

import { useState, useEffect } from "react";
import { ComponentSelector } from "./ComponentSelector";
import { PriceCalculator } from "./PriceCalculator";
import { CompatibilityChecker } from "./CompatibilityChecker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  manufacturer?: string | null;
  price?: number | null;
  specs?: unknown;
}

interface ComponentsByType {
  type: string;
  items: ComponentItem[];
}

export function PCBuilder() {
  const [componentsByType, setComponentsByType] = useState<ComponentsByType[]>([]);
  const [selected, setSelected] = useState<Record<string, ComponentItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buildName, setBuildName] = useState("Mein Build");
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pc-builder/components")
      .then((res) => res.json())
      .then((data) => {
        if (data.components) setComponentsByType(data.components);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalPrice = Object.values(selected).reduce(
    (sum, c) => sum + (c.price ?? 0),
    0
  );

  const handleSelect = (type: string, item: ComponentItem | null) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (item) next[type] = item;
      else delete next[type];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pc-builder/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: buildName,
          components: Object.entries(selected).map(([type, c]) => ({ type, id: c.id, name: c.name, price: c.price })),
          totalPrice,
        }),
      });
      const data = await res.json();
      if (data.id) setSavedId(data.id);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold">Komponenten wählen</h2>
        {componentsByType.map(({ type, items }) => (
          <ComponentSelector
            key={type}
            type={type}
            items={items}
            selected={selected[type]}
            onSelect={(item) => handleSelect(type, item)}
          />
        ))}
      </div>
      <aside className="space-y-6">
        <Card className="border-2 sticky top-24">
          <CardContent className="p-6 space-y-6">
            <PriceCalculator selected={selected} totalPrice={totalPrice} />
            <CompatibilityChecker selected={selected} />
            <div className="space-y-2">
              <label htmlFor="build-name" className="text-sm font-medium">
                Build-Name
              </label>
              <Input
                id="build-name"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder="Mein Build"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || Object.keys(selected).length === 0}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Build speichern
            </Button>
            {savedId && (
              <p className="text-sm text-muted-foreground">
                Gespeichert. ID: <code className="text-xs">{savedId}</code>
              </p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
