"use client";

import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, FileText, Cpu, Film, Tv, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewTemplate } from "@/lib/review-templates-schema";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="h-5 w-5" />,
  hardware: <Cpu className="h-5 w-5" />,
  movie: <Film className="h-5 w-5" />,
  series: <Tv className="h-5 w-5" />,
  other: <FileText className="h-5 w-5" />,
};

export function ReviewTemplateSelector({
  onSelect,
  selectedTemplateId,
  className,
}: ReviewTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/templates/reviews");
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Failed to load templates" }));
          throw new Error(err.error || "Failed to load templates");
        }
        const data = await response.json();
        if (data.success && data.templates) {
          setTemplates(data.templates);
        } else {
          throw new Error(data.error || "Invalid response format");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Fehler beim Laden der Templates";
        setError(message);
        toast({
          title: "Template-Fehler",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [toast]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <CardTitle className="h-6 w-3/4" />
                <CardDescription className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full" />
                <div className="h-4 w-1/2" />
                <div className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || templates.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          {error ? `Fehler: ${error}` : "Keine Templates verfügbar"}
        </p>
      </div>
    );
  }

  const defaultTemplate = templates.find((t) => t.default) || templates[0];
  const initialSelection = selectedTemplateId || defaultTemplate?.id;

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={initialSelection}
        onValueChange={(value: string) => {
          const template = templates.find((t) => t.id === value);
          if (template) onSelect(template);
        }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {templates.map((template) => (
          <RadioGroupItem
            key={template.id}
            value={template.id}
            className={cn(
              "relative flex flex-col h-full border-2 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5",
              "hover:border-primary/50"
            )}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                  </div>
                  <div
                    className={cn(
                      "flex-shrink-0 p-2 rounded-full",
                      template.category && CATEGORY_ICONS[template.category]
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                    aria-hidden="true"
                  >
                    {CATEGORY_ICONS[template.category] || <FileText className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted font-medium capitalize">
                    {template.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {template.fields.length} Felder
                  </span>
                  {template.default && (
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle className="h-3 w-3" />
                      Standard
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {template.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div
                        key={field.id}
                        className={cn(
                          "flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-muted/50",
                          field.required && "border-l-2 border-primary"
                        )}
                      >
                        {field.required && (
                          <span className="text-primary" aria-hidden="true">
                            *
                          </span>
                        )}
                        <span className="font-medium truncate">{field.label}</span>
                        <span className="text-muted-foreground/70 capitalize">{field.type}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Checkmark overlay when selected */}
            <div
              className={cn(
                "absolute top-2 right-2 z-10 p-1 rounded-full bg-primary text-primary-foreground",
                "opacity-0 transition-opacity data-[state=checked]:opacity-100"
              )}
              aria-hidden="true"
            >
              <CheckCircle className="h-5 w-5" />
            </div>
          </RadioGroupItem>
        ))}
      </RadioGroup>

      <div className="text-sm text-muted-foreground text-center">
        <p>Pflichtfelder sind mit <span className="text-primary font-bold" aria-hidden="true">*</span> markiert</p>
      </div>
    </div>
  );
}

interface ReviewTemplateSelectorProps {
  onSelect: (template: ReviewTemplate) => void;
  selectedTemplateId?: string;
  className?: string;
}