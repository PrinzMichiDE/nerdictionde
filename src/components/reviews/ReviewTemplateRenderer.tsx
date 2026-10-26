"use client";

import { ReviewTemplate, TemplateData } from "@/lib/review-templates-schema";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface ReviewTemplateRendererProps {
  template: ReviewTemplate | null;
  templateData: TemplateData | null;
  review: {
    title: string;
    slug: string;
    score: number;
    category: string;
    author: { displayName: string };
    createdAt: Date;
    images: string[];
  };
  variant?: "tabs" | "accordion" | "sections";
  className?: string;
}

function TemplateFieldRenderer({
  field,
  value,
}: {
  field: ReviewTemplate["fields"][0];
  value: string;
}) {
  if (!value?.trim()) return null;

  const isMarkdown = field.markdown !== false;

  return (
    <section
      className={cn("space-y-2", "review-field", `review-field-${field.id}`)}
      data-template-field={field.id}
    >
      <header className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">{field.label}</h3>
        {field.required && (
          <Badge variant="default" className="text-xs bg-primary/10 text-primary">
            Pflicht
          </Badge>
        )}
      </header>
      <div
        className={cn(
          "prose prose-sm max-w-none",
          isMarkdown && "prose-md",
          !isMarkdown && "whitespace-pre-wrap font-sans"
        )}
        dangerouslySetInnerHTML={{
          __html: isMarkdown
            ? value
                .replace(/&/g, "&")
                .replace(/</g, "<")
                .replace(/>/g, ">")
                .replace(/\n/g, "<br />")
            : value,
        }}
      />
    </section>
  );
}

function TemplateSectionRenderer({
  template,
  templateData,
  variant = "sections",
}: {
  template: ReviewTemplate;
  templateData: TemplateData | null;
  variant: "tabs" | "accordion" | "sections";
}) {
  if (!templateData) return null;

  const sortedFields = template.fields
    .filter((f) => templateData[f.id]?.trim())
    .sort((a, b) => a.order - b.order);

  const requiredFields = sortedFields.filter((f) => f.required);
  const optionalFields = sortedFields.filter((f) => !f.required);

  if (variant === "accordion") {
    return (
      <Accordion type="multiple" className="w-full space-y-2">
        {requiredFields.length > 0 && (
          <AccordionItem value="required">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold" aria-hidden="true">*</span>
                Pflichtfelder ({requiredFields.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              {requiredFields.map((field) => (
                <TemplateFieldRenderer
                  key={field.id}
                  field={field}
                  value={templateData[field.id] || ""}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
        {optionalFields.length > 0 && (
          <AccordionItem value="optional">
            <AccordionTrigger className="font-medium">
              Optionale Felder ({optionalFields.length})
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              {optionalFields.map((field) => (
                <TemplateFieldRenderer
                  key={field.id}
                  field={field}
                  value={templateData[field.id] || ""}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    );
  }

  if (variant === "tabs") {
    return (
      <Tabs defaultValue={requiredFields.length > 0 ? "required" : "optional"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          {requiredFields.length > 0 && (
            <TabsTrigger value="required">
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-bold" aria-hidden="true">*</span>
                Pflichtfelder ({requiredFields.length})
              </span>
            </TabsTrigger>
          )}
          {optionalFields.length > 0 && (
            <TabsTrigger value="optional">
              Optionale Felder ({optionalFields.length})
            </TabsTrigger>
          )}
        </TabsList>
        {requiredFields.length > 0 && (
          <TabsContent value="required" className="space-y-6 pt-2 focus-visible:ring-0">
            {requiredFields.map((field) => (
              <TemplateFieldRenderer
                key={field.id}
                field={field}
                value={templateData[field.id] || ""}
              />
            ))}
          </TabsContent>
        )}
        {optionalFields.length > 0 && (
          <TabsContent value="optional" className="space-y-6 pt-2 focus-visible:ring-0">
            {optionalFields.map((field) => (
              <TemplateFieldRenderer
                key={field.id}
                field={field}
                value={templateData[field.id] || ""}
              />
            ))}
          </TabsContent>
        )}
      </Tabs>
    );
  }

  // Default: sections
  return (
    <div className="space-y-8">
      {requiredFields.length > 0 && (
        <section className="space-y-6" aria-labelledby="required-heading">
          <header className="flex items-center gap-2 pb-2 border-b">
            <span className="text-primary font-bold" aria-hidden="true">*</span>
            <h2 id="required-heading" className="text-xl font-semibold">
              Hauptinhalt
            </h2>
          </header>
          {requiredFields.map((field) => (
            <TemplateFieldRenderer
              key={field.id}
              field={field}
              value={templateData[field.id] || ""}
            />
          ))}
        </section>
      )}
      {optionalFields.length > 0 && (
        <section className="space-y-6" aria-labelledby="optional-heading">
          <header className="flex items-center gap-2 pb-2 border-b">
            <h2 id="optional-heading" className="text-xl font-semibold">
              Weitere Details
            </h2>
          </header>
          {optionalFields.map((field) => (
            <TemplateFieldRenderer
              key={field.id}
              field={field}
              value={templateData[field.id] || ""}
            />
          ))}
        </section>
      )}
    </div>
  );
}

export function ReviewTemplateRenderer({
  template,
  templateData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  review,
  variant = "sections",
  className,
}: ReviewTemplateRendererProps) {
  if (!template || !templateData) {
    return null;
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const effectiveVariant = isMobile ? "accordion" : variant;

  return (
    <article
      className={cn(
        "review-template-renderer",
        `review-template-${template.id}`,
        className
      )}
      itemScope
      itemType="https://schema.org/Review"
    >
      {/* Template Header */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium capitalize">
              {template.category}
            </span>
            {template.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </CardContent>
      </Card>

      {/* Template Fields */}
      <TemplateSectionRenderer
        template={template}
        templateData={templateData}
        variant={effectiveVariant}
      />

      {/* Schema.org structured data is handled by the parent page */}
    </article>
  );
}