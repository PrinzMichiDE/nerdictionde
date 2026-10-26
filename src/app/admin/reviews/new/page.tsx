"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Save, CheckCircle, ArrowLeft, FileText, ImagePlus, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewTemplate, TemplateData } from "@/lib/review-templates-schema";
import { ReviewTemplateSelector } from "@/components/admin/ReviewTemplateSelector";
import { ReviewTemplateEditor } from "@/components/admin/ReviewTemplateEditor";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { featureFlags } from "@/lib/feature-flags";

const CATEGORIES = [
  { value: "game", label: "Game" },
  { value: "hardware", label: "Hardware" },
  { value: "movie", label: "Film" },
  { value: "series", label: "Serie" },
] as const;

type ReviewCategory = (typeof CATEGORIES)[number]["value"];

interface NewReviewFormData {
  title: string;
  title_en: string;
  slug: string;
  category: ReviewCategory;
  score: number;
  status: "draft" | "published";
  images: string[];
  youtubeVideos: string[];
  specs: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

function NewReviewPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<ReviewTemplate | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<ReviewTemplate[]>([]);
  const [templateData, setTemplateData] = useState<TemplateData>({});
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Basic form state
  const [formData, setFormData] = useState<NewReviewFormData>({
    title: "",
    title_en: "",
    slug: "",
    category: "game",
    score: 0,
    status: "draft",
    images: [],
    youtubeVideos: [],
    specs: null,
    metadata: null,
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"template" | "basic" | "media" | "advanced">("template");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("/api/templates/reviews");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.templates) {
            setAvailableTemplates(data.templates);
            // Auto-select default template
            const defaultTemplate = data.templates.find((t: ReviewTemplate) => t.default) || data.templates[0];
            if (defaultTemplate) {
              setSelectedTemplate(defaultTemplate);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setTemplatesLoading(false);
      }
    }

    if (featureFlags.reviewTemplates) {
      loadTemplates();
    } else {
      setTemplatesLoading(false);
    }
  }, []);

  // Sync category from template
  useEffect(() => {
    if (selectedTemplate) {
      setFormData((prev) => {
        if (prev.category !== selectedTemplate.category) {
          return { ...prev, category: selectedTemplate.category as ReviewCategory };
        }
        return prev;
      });
    }
  }, [selectedTemplate]);

  // Generate slug from title
  useEffect(() => {
    setFormData((prev) => {
      if (!prev.slug && prev.title) {
        const slug = prev.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return { ...prev, slug };
      }
      return prev;
    });
  }, [formData.title]);

  // Track dirty state
  useEffect(() => {
    setDirty(true);
  }, [formData, templateData, selectedTemplate?.id]);

  const handleFormChange = useCallback(<K extends keyof NewReviewFormData>(field: K, value: NewReviewFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTemplateDataChange = useCallback((data: TemplateData) => {
    setTemplateData(data);
    setDirty(true);
  }, []);

  const handleTemplateChange = useCallback((template: ReviewTemplate) => {
    setSelectedTemplate(template);
    // Migrate template data (simple field ID matching)
    setTemplateData((prev) => {
      const migrated: TemplateData = {};
      for (const field of template.fields) {
        if (prev[field.id] !== undefined) {
          migrated[field.id] = prev[field.id];
        }
      }
      return migrated;
    });
    setDirty(true);
  }, []);

  const validateForm = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.title.trim()) errors.push("Titel ist erforderlich");
    if (!formData.slug.trim()) errors.push("Slug ist erforderlich");
    if (!formData.category) errors.push("Kategorie ist erforderlich");
    if (formData.score < 0 || formData.score > 100) errors.push("Score muss zwischen 0 und 100 liegen");

    // Template validation
    if (selectedTemplate) {
      const templateErrors = Object.entries(templateData)
        .filter(([key, value]) => {
          const field = selectedTemplate.fields.find((f) => f.id === key);
          return field?.required && !value?.trim();
        })
        .map(([key]) => {
          const field = selectedTemplate.fields.find((f) => f.id === key);
          return `Template-Feld "${field?.label || key}" ist erforderlich`;
        });
      errors.push(...templateErrors);
    }

    return { valid: errors.length === 0, errors };
  }, [formData, selectedTemplate, templateData]);

  const handleSave = useCallback(async (status: "draft" | "published" = "draft") => {
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Validierung fehlgeschlagen",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return false;
    }

    if (saving || publishing) return false;

    setSaving(true);
    setPublishing(status === "published");

    try {
      const payload = {
        ...formData,
        status,
        templateId: selectedTemplate?.id || null,
        templateData: selectedTemplate ? templateData : undefined,
      };

      const response = await axios.post("/api/reviews", payload);
      const review = response.data;

      toast({
        title: status === "published" ? "Review veröffentlicht" : "Entwurf gespeichert",
        description: `"${review.title}" wurde erfolgreich erstellt.`,
      });

      router.push(`/admin/reviews/${review.id}/edit`);
      return true;
    } catch (error: unknown) {
      console.error("Save failed:", error);
      const err = error as { response?: { data?: { error?: string; details?: Record<string, string> } } };
      let message = err.response?.data?.error || "Fehler beim Speichern";

      if (err.response?.data?.details) {
        message += ": " + Object.values(err.response.data.details).join(", ");
      }

      toast({
        title: "Speichern fehlgeschlagen",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }, [formData, selectedTemplate, templateData, validateForm, router, toast, saving, publishing]);

  const handleImageUpload = async (file: File) => {
    try {
      const formData_upload = new FormData();
      formData_upload.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData_upload,
      });

      if (!response.ok) throw new Error("Upload fehlgeschlagen");

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Das Bild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  if (!featureFlags.reviewTemplates) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Neuer Review</h1>
          <p className="text-sm text-muted-foreground">Review-Templates sind aktuell deaktiviert.</p>
        </div>
        <Alert variant="info">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature deaktiviert</AlertTitle>
          <AlertDescription>
            Das Review-Template-System ist über das Feature-Flag <code>FEATURE_REVIEW_TEMPLATES</code> gesteuert.
            Aktivieren Sie es in der <code>.env</code> Datei, um Templates zu nutzen.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[480px] flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin?tab=list")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Zurück zur Liste</span>
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold md:text-xl">
              {formData.title || "Neuer Review"}
            </h2>
            <div className="flex flex-wrap items-center gap-y-0.5 text-xs text-muted-foreground">
              <span className="capitalize">{formData.category}</span>
              <span aria-hidden="true" className="mr-2 text-muted-foreground/50">,</span>
              <span className={formData.status === "published" ? "font-medium text-success" : "font-medium text-warning"}>
                {formData.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
              {dirty && (
                <>
                  <span aria-hidden="true" className="mr-2 text-muted-foreground/50">,</span>
                  <span className="font-medium text-warning">Ungespeicherte Änderungen</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={saving || publishing}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Als Entwurf speichern
          </Button>
          <Button size="sm" onClick={() => handleSave("published")} disabled={saving || publishing}>
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Veröffentlichen
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="basic">Basisdaten</TabsTrigger>
            <TabsTrigger value="media">Medien</TabsTrigger>
            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
          </TabsList>

          {/* Template Tab */}
          <TabsContent value="template" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
            {templatesLoading ? (
              <div className="space-y-4 animate-pulse">
                <Card>
                  <CardHeader>
                    <CardTitle className="h-6 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full" />
                    <div className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                {/* Template Selector + Editor */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template auswählen</CardTitle>
                      <CardDescription>
                        Wählen Sie eine Struktur für Ihren Review. Das Template bestimmt die Abschnitte und Pflichtfelder.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ReviewTemplateSelector
                        onSelect={handleTemplateChange}
                        selectedTemplateId={selectedTemplate?.id}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>

                  {selectedTemplate && (
                    <ReviewTemplateEditor
                      template={selectedTemplate}
                      templateData={templateData}
                      onTemplateDataChange={handleTemplateDataChange}
                      onTemplateChange={handleTemplateChange}
                      availableTemplates={availableTemplates}
                    />
                  )}
                </div>

                {/* Preview Sidebar */}
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Vorschau</CardTitle>
                    <CardDescription>So sieht der Review mit dem gewählten Template aus.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                    {selectedTemplate ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Titel</Label>
                          <p className="font-bold text-lg">{formData.title || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Kategorie</Label>
                          <p className="capitalize">{selectedTemplate.category}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Template-Felder</Label>
                          <div className="space-y-1">
                            {selectedTemplate.fields
                              .sort((a, b) => a.order - b.order)
                              .map((field) => (
                                <div
                                  key={field.id}
                                  className={cn(
                                    "text-xs px-2 py-1 rounded bg-muted/50",
                                    field.required && "border-l-2 border-primary"
                                  )}
                                >
                                  <span className="font-medium">{field.label}</span>
                                  {templateData[field.id]?.trim() && (
                                    <span className="ml-2 text-success">✓</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Wählen Sie ein Template für die Vorschau</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Basic Data Tab */}
          <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Titel & Inhalt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titel (DE)</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleFormChange("title", e.target.value)}
                        placeholder="z.B. Elden Ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title_en">Titel (EN)</Label>
                      <Input
                        id="title_en"
                        value={formData.title_en}
                        onChange={(e) => handleFormChange("title_en", e.target.value)}
                        placeholder="Optional: English title"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kategorie & Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategorie</Label>
                        <Select value={formData.category} onValueChange={(v) => handleFormChange("category", v as ReviewCategory)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="score">Score (0-100)</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.score}
                            onChange={(e) => handleFormChange("score", parseInt(e.target.value) || 0)}
                            className="flex-1 accent-primary"
                            aria-label="Score"
                          />
                          <Input
                            id="score"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.score}
                            onChange={(e) => handleFormChange("score", parseInt(e.target.value) || 0)}
                            className="w-24 shrink-0"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v) => handleFormChange("status", v as "draft" | "published")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Entwurf</SelectItem>
                          <SelectItem value="published">Veröffentlicht</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Slug</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Label htmlFor="slug">URL-Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleFormChange("slug", e.target.value)}
                      placeholder="wird automatisch generiert"
                    />
                    <p className="text-xs text-muted-foreground">
                      Eindeutiger Identifier für die URL. Wird aus dem Titel generiert, falls leer.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Speichern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => handleSave("draft")} disabled={saving || publishing}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Als Entwurf speichern
                  </Button>
                  <Button className="w-full" variant="default" onClick={() => handleSave("published")} disabled={saving || publishing}>
                    {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Veröffentlichen
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {dirty ? "Ungespeicherte Änderungen" : "Alle Änderungen gespeichert"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImagePlus className="h-4 w-4" />
                      Bilder
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((url, i) => (
                        <div key={i} className="group relative aspect-video overflow-hidden rounded-md border">
                          <img src={url} alt={`Bild ${i}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleFormChange("images", formData.images.filter((_, idx) => idx !== i))}
                            className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <FileText className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/5 transition-colors hover:border-primary/50">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleImageUpload(file);
                              if (url) handleFormChange("images", [...formData.images, url]);
                            }
                          }}
                        />
                        <ImagePlus className="mb-1 h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Hochladen</span>
                      </label>
                    </div>
                    {formData.images.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-4">Noch keine Bilder hochgeladen.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Youtube className="h-4 w-4" />
                      YouTube Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {formData.youtubeVideos.map((videoId, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-sm text-muted-foreground">{videoId}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormChange("youtubeVideos", formData.youtubeVideos.filter((_, idx) => idx !== i))}
                            className="shrink-0 text-destructive"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="YouTube URL oder Video-ID"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                              handleFormChange("youtubeVideos", [...formData.youtubeVideos, e.currentTarget.value.trim()]);
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Would need a separate state for this, keeping simple
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Speichern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => handleSave("draft")} disabled={saving || publishing}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Als Entwurf speichern
                  </Button>
                  <Button className="w-full" variant="default" onClick={() => handleSave("published")} disabled={saving || publishing}>
                    {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Veröffentlichen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="min-h-0 flex-1 overflow-y-auto pt-4 scrollbar-hide">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Systemanforderungen (JSON)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Textarea
                      className="min-h-[200px] resize-none font-mono text-xs"
                      value={JSON.stringify(formData.specs || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const val = JSON.parse(e.target.value);
                          handleFormChange("specs", val);
                        } catch {
                          // Ignore invalid JSON while typing
                        }
                      }}
                      placeholder='{ "cpu": "Intel i5-12400", "gpu": "RTX 3060", "ram": "16 GB" }'
                    />
                    <p className="text-xs text-muted-foreground italic">Nur für Hardware- und Game-Reviews relevant.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Metadaten (JSON)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Textarea
                      className="min-h-[200px] resize-none font-mono text-xs"
                      value={JSON.stringify(formData.metadata || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const val = JSON.parse(e.target.value);
                          handleFormChange("metadata", val);
                        } catch {
                          // Ignore invalid JSON while typing
                        }
                      }}
                      placeholder='{ "developer": "FromSoftware", "publisher": "Bandai Namco", "genres": ["Action", "RPG"] }'
                    />
                    <p className="text-xs text-muted-foreground italic">Zusätzliche Metadaten wie Developer, Publisher, Genres, etc.</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Speichern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => handleSave("draft")} disabled={saving || publishing}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Als Entwurf speichern
                  </Button>
                  <Button className="w-full" variant="default" onClick={() => handleSave("published")} disabled={saving || publishing}>
                    {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Veröffentlichen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <NewReviewPageContent />
    </Suspense>
  );
}