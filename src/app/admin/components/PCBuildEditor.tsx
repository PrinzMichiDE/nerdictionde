"use client";

import { useState, useEffect } from "react";
import { PCBuild, PCComponent, PCComponentType } from "@/types/pc-build";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, ArrowLeft, MoveUp, MoveDown } from "lucide-react";
import axios from "axios";

const COMPONENT_TYPES: PCComponentType[] = [
  "CPU", "GPU", "Motherboard", "RAM", "SSD", "PSU", "Case", "Cooler", "Monitor", "Other"
];

interface PCBuildEditorProps {
  build: Partial<PCBuild> & { components: any[] };
  onSave: () => void;
  onCancel: () => void;
}

export function PCBuildEditor({ build: initialBuild, onSave, onCancel }: PCBuildEditorProps) {
  const [build, setBuild] = useState(initialBuild);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setBuild((prev) => ({ ...prev, [field]: value }));
  };

  const handleComponentChange = (index: number, field: string, value: any) => {
    const newComponents = [...(build.components || [])];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setBuild((prev) => ({ ...prev, components: newComponents }));
  };

  const addComponent = () => {
    const newComponents = [
      ...(build.components || []),
      { type: "Other", name: "", price: 0, currency: "EUR", sortOrder: (build.components?.length || 0) }
    ];
    setBuild((prev) => ({ ...prev, components: newComponents }));
  };

  const removeComponent = (index: number) => {
    const newComponents = (build.components || []).filter((_, i) => i !== index);
    setBuild((prev) => ({ ...prev, components: newComponents }));
  };

  const moveComponent = (index: number, direction: "up" | "down") => {
    const newComponents = [...(build.components || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newComponents.length) return;
    
    [newComponents[index], newComponents[newIndex]] = [newComponents[newIndex], newComponents[index]];
    setBuild((prev) => ({ ...prev, components: newComponents }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (build.id) {
        await axios.patch(`/api/gaming-pcs/${build.id}`, build);
      } else {
        await axios.post("/api/gaming-pcs", build);
      }
      onSave();
    } catch (error) {
      console.error("Save build failed:", error);
      alert("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  // Auto-calculate total price
  useEffect(() => {
    const total = (build.components || []).reduce((acc, comp) => {
      const price = typeof comp.price === 'string' ? parseFloat(comp.price) : (comp.price || 0);
      return acc + (isNaN(price) ? 0 : price);
    }, 0);
    if (total !== build.totalPrice) {
      setBuild(prev => ({ ...prev, totalPrice: total }));
    }
  }, [build.components]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">
            {build.id ? `Edit: ${build.title}` : "Neuer Gaming PC"}
          </h2>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Speichert..." : "Speichern"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Allgemeine Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preisklasse (€)</Label>
                <Input 
                  type="number" 
                  value={build.pricePoint || ""} 
                  onChange={(e) => handleChange("pricePoint", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={build.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="published">Veröffentlicht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Titel (DE)</Label>
              <Input 
                value={build.title || ""} 
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="z.B. Bester 400 Euro Gaming PC"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input 
                value={build.slug || ""} 
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="bester-400-euro-gaming-pc"
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung (DE)</Label>
              <Textarea 
                value={build.description || ""} 
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Affiliate-Link (Gesamt-Build)</Label>
              <Input 
                value={build.affiliateLink || ""} 
                onChange={(e) => handleChange("affiliateLink", e.target.value)}
                placeholder="Link zu Geizhals Wunschliste"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance & Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Berechneter Gesamtpreis</p>
              <p className="text-4xl font-black">{build.totalPrice?.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
            </div>
            
            <div className="space-y-2 pt-4">
              <Label>Titel (EN)</Label>
              <Input 
                value={build.title_en || ""} 
                onChange={(e) => handleChange("title_en", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung (EN)</Label>
              <Textarea 
                value={build.description_en || ""} 
                onChange={(e) => handleChange("description_en", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold uppercase tracking-tight">Komponenten</h3>
          <Button variant="outline" size="sm" onClick={addComponent} className="gap-2">
            <Plus className="h-4 w-4" />
            Komponente hinzufügen
          </Button>
        </div>

        <div className="grid gap-4">
          {build.components?.map((comp, index) => (
            <Card key={index} className="bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => moveComponent(index, "up")} disabled={index === 0}>
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveComponent(index, "down")} disabled={index === (build.components?.length || 0) - 1}>
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-grow">
                    <div className="space-y-1 col-span-1 sm:col-span-1">
                      <Label className="text-xs">Typ</Label>
                      <Select value={comp.type} onValueChange={(v) => handleComponentChange(index, "type", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPONENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2">
                      <Label className="text-xs">Name</Label>
                      <Input 
                        value={comp.name || ""} 
                        onChange={(e) => handleComponentChange(index, "name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2">
                      <Label className="text-xs">Bild URL</Label>
                      <Input 
                        value={comp.image || ""} 
                        onChange={(e) => handleComponentChange(index, "image", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <Label className="text-xs">Preis (€)</Label>
                      <Input 
                        type="number"
                        value={comp.price || ""} 
                        onChange={(e) => handleComponentChange(index, "price", parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-3">
                      <Label className="text-xs">Beschreibung / Erklärung</Label>
                      <Input 
                        value={comp.description || ""} 
                        onChange={(e) => handleComponentChange(index, "description", e.target.value)}
                        placeholder="Warum dieses Teil?"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-2">
                      <Label className="text-xs">Geizhals/Amazon Link</Label>
                      <Input 
                        value={comp.affiliateLink || ""} 
                        onChange={(e) => handleComponentChange(index, "affiliateLink", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-2">
                      <Label className="text-xs">Review Slug/ID (Optional)</Label>
                      <Input 
                        value={comp.reviewId || ""} 
                        onChange={(e) => handleComponentChange(index, "reviewId", e.target.value)}
                      />
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeComponent(index)} className="text-destructive mt-6">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

