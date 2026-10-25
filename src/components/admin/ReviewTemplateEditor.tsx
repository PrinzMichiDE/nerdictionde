"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewTemplate, TemplateField, TemplateData, validateTemplateData } from "@/lib/review-templates-schema";
import { useToast } from "@/hooks/use-toast";

interface ReviewTemplateEditorProps {
  template: ReviewTemplate | null;
  templateData: TemplateData;
  onTemplateDataChange: (data: TemplateData) => void;
  onTemplateChange?: (template: ReviewTemplate) => void;
  availableTemplates?: ReviewTemplate[];
  readOnly?: boolean;
  className?: string;
}

function TemplateFieldInput({
  field,
  value,
  onChange,
  error,
  readOnly,
}: {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  readOnly?: boolean;
}) {
  const id = `template-field-${field.id}`;

  switch (field.type) {
    case "textarea": {
      const isMarkdown = field.markdown !== false;
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className={cn(error && "text-destructive")}>
            {field.label}
            {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </Label>
          {field.helpText && !error && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "min-h-[120px] resize-none font-mono text-sm",
              isMarkdown && "font-mono",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20"
            )}
            readOnly={readOnly}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : field.helpText ? `${id}-help` : undefined}
          />
          {error && (
            <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          {field.helpText && !error && (
            <p id={`${id}-help`} className="text-xs text-muted-foreground">
              {field.helpText}
            </p>
          )}
        </div>
      );
    }

    case "text": {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className={cn(error && "text-destructive")}>
            {field.label}
            {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </Label>
          {field.helpText && !error && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && "border-destructive focus:border-destructive focus:ring-destructive/20")}
            readOnly={readOnly}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : field.helpText ? `${id}-help` : undefined}
          />
          {error && (
            <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    case "select": {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className={cn(error && "text-destructive")}>
            {field.label}
            {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </Label>
          {field.helpText && !error && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Select
            value={value}
            onValueChange={onChange}
            disabled={readOnly}
            aria-invalid={!!error}
          >
            <SelectTrigger id={id} className={cn(error && "border-destructive focus:border-destructive")}>
              <SelectValue placeholder={field.placeholder || "Auswählen..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    case "number": {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className={cn(error && "text-destructive")}>
            {field.label}
            {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </Label>
          {field.helpText && !error && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn("font-mono", error && "border-destructive focus:border-destructive focus:ring-destructive/20")}
            readOnly={readOnly}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : field.helpText ? `${id}-help` : undefined}
          />
          {error && (
            <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    case "rating": {
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className={cn(error && "text-destructive")}>
            {field.label}
            {field.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </Label>
          {field.helpText && !error && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          <div className="flex items-center gap-2" role="group" aria-label={field.label}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => !readOnly && onChange(String(num))}
                disabled={readOnly}
                className={cn(
                  "w-8 h-8 rounded border-2 font-medium transition-all",
                  value === String(num)
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-background border-border hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  readOnly && "opacity-50 cursor-not-allowed"
                )}
                aria-pressed={value === String(num)}
                aria-label={`${num} von 10`}
              >
                {num}
              </button>
            ))}
          </div>
          {error && (
            <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function TemplateSection({
  template,
  templateData,
  errors,
  onFieldChange,
  readOnly,
  variant = "tabs",
}: {
  template: ReviewTemplate;
  templateData: TemplateData;
  errors: Record<string, string>;
  onFieldChange: (fieldId: string, value: string) => void;
  readOnly?: boolean;
  variant: "tabs" | "accordion";
}) {
  const requiredFields = template.fields.filter((f) => f.required);
  const optionalFields = template.fields.filter((f) => !f.required);
  const hasOptionalContent = optionalFields.some((f) => templateData[f.id]?.trim());

  const renderFields = (fields: TemplateField[]) => (
    <div className="space-y-6 p-4">
      {fields.map((field) => (
        <TemplateFieldInput
          key={field.id}
          field={field}
          value={templateData[field.id] || ""}
          onChange={(value) => onFieldChange(field.id, value)}
          error={errors[field.id]}
          readOnly={readOnly}
        />
      ))}
    </div>
  );

  if (variant === "accordion") {
    return (
      <Accordion type="multiple" className="w-full">
        {requiredFields.length > 0 && (
          <AccordionItem value="required">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">*</span>
                Pflichtfelder ({requiredFields.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>{renderFields(requiredFields)}</AccordionContent>
          </AccordionItem>
        )}
        {optionalFields.length > 0 && (
          <AccordionItem value="optional">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                Optionale Felder ({optionalFields.length})
                {hasOptionalContent && (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>{renderFields(optionalFields)}</AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    );
  }

  return (
    <Tabs defaultValue="required" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        {requiredFields.length > 0 && (
          <TabsTrigger value="required" className="data-[state=active]:bg-primary">
            <span className="flex items-center gap-1.5">
              <span className="text-primary font-bold" aria-hidden="true">*</span>
              Pflichtfelder ({requiredFields.length})
            </span>
          </TabsTrigger>
        )}
        {optionalFields.length > 0 && (
          <TabsTrigger value="optional" className="data-[state=active]:bg-primary">
            <span className="flex items-center gap-1.5">
              Optionale Felder ({optionalFields.length})
              {hasOptionalContent && <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />}
            </span>
          </TabsTrigger>
        )}
      </TabsList>
      {requiredFields.length > 0 && (
        <TabsContent value="required" className="pt-4 focus-visible:ring-0">
          {renderFields(requiredFields)}
        </TabsContent>
      )}
      {optionalFields.length > 0 && (
        <TabsContent value="optional" className="pt-4 focus-visible:ring-0">
          {renderFields(optionalFields)}
        </TabsContent>
      )}
    </Tabs>
  );
}

export function ReviewTemplateEditor({
  template,
  templateData,
  onTemplateDataChange,
  onTemplateChange,
  availableTemplates = [],
  readOnly = false,
  className,
}: ReviewTemplateEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);
  const { toast } = useToast();

  // Validate on templateData change
  useEffect(() => {
    if (!template) return;

    const timer = setTimeout(() => {
      setIsValidating(true);
      const validation = validateTemplateData(templateData, template);
      setErrors(validation.errors);
      setIsValidating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [templateData, template]);

  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      onTemplateDataChange({ ...templateData, [fieldId]: value });
    },
    [templateData, onTemplateDataChange]
  );

  const handleTemplateSwitch = useCallback(
    async (newTemplate: ReviewTemplate) => {
      if (!template || newTemplate.id === template.id) return;

      // Preview migration
      // const migrated = templateData; // TODO: Use mapTemplateData from review-templates.ts
      setShowMigrationWarning(true);
    },
    [template]
  );

  const confirmTemplateSwitch = useCallback(
    (newTemplate: ReviewTemplate) => {
      const migrated = templateData; // TODO: Use mapTemplateData
      onTemplateDataChange(migrated);
      onTemplateChange?.(newTemplate);
      setShowMigrationWarning(false);
      toast({
        title: "Template gewechselt",
        description: `Inhalte wurden zu „${newTemplate.name}“ migriert.`,
      });
    },
    [templateData, onTemplateDataChange, onTemplateChange, toast]
  );

  const cancelTemplateSwitch = useCallback(() => {
    setShowMigrationWarning(false);
  }, []);

  const isValid = template ? Object.keys(errors).length === 0 : false;
  const hasRequiredErrors = template
    ? template.fields.some((f) => f.required && errors[f.id])
    : false;

  if (!template) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Kein Template ausgewählt</p>
          <p className="text-sm text-muted-foreground/70">
            Wählen Sie links ein Template aus, um den strukturierten Editor zu sehen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const variant = isMobile ? "accordion" : "tabs";

  const requiredFields = template.fields.filter((f) => f.required);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Template Header */}
      <Card className={cn("border-primary/20 bg-primary/5", availableTemplates.length > 1 && "mb-4")}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </div>
            {availableTemplates.length > 1 && !readOnly && (
              <Select
                value={template.id}
                onValueChange={(id) => {
                  const t = availableTemplates.find((x) => x.id === id);
                  if (t) handleTemplateSwitch(t);
                }}
                disabled={readOnly}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Template wechseln" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.default && "(Standard)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded bg-muted font-medium capitalize">{template.category}</span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {template.fields.length} Felder
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {requiredFields.length} Pflichtfelder
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Migration Warning */}
      {showMigrationWarning && (
        <Alert variant="warning" className="border-warning/30 bg-warning/5">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1 space-y-2">
            <AlertTitle>Template wechseln?</AlertTitle>
            <AlertDescription>
              Beim Wechsel zu einem anderen Template werden nur Felder mit derselben ID übernommen.
              Inhalte in Feldern, die im neuen Template nicht existieren, gehen verloren.
            </AlertDescription>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancelTemplateSwitch}>
                Abbrechen
              </Button>
              <Button size="sm" onClick={() => confirmTemplateSwitch(availableTemplates.find((t) => t.id !== template.id)!)}>
                Wechseln & Migrieren
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Validation Summary */}
      {(hasRequiredErrors || isValidating) && (
        <Alert variant={hasRequiredErrors ? "destructive" : "default"} className="border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            {isValidating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Validiere Felder...</AlertDescription>
              </div>
            ) : (
              <>
                <AlertTitle>Pflichtfelder fehlen</AlertTitle>
                <AlertDescription>
                  Bitte füllen Sie alle markierten Pflichtfelder aus, bevor Sie speichern.
                </AlertDescription>
              </>
            )}
          </div>
        </Alert>
      )}

      {/* Template Fields */}
      <Card>
        <CardContent className="pt-0">
          <TemplateSection
            template={template}
            templateData={templateData}
            errors={errors}
            onFieldChange={handleFieldChange}
            readOnly={readOnly}
            variant={variant}
          />
        </CardContent>
      </Card>

      {/* Validation Status */}
      <div
        className={cn(
          "flex items-center justify-between px-2 py-2 rounded-lg text-sm",
          isValid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}
        role="status"
        aria-live="polite"
      >
        <span className="flex items-center gap-1.5">
          {isValid ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {isValid ? "Alle Pflichtfelder ausgefüllt" : "Pflichtfelder fehlen"}
        </span>
        <span className="font-mono tabular-nums">
          {Object.keys(templateData).filter((k) => templateData[k]?.trim()).length} / {template.fields.length} Felder befüllt
        </span>
      </div>
    </div>
  );
}