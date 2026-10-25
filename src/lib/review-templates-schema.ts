import { z } from 'zod';

// ============================================
// Template Field Types
// ============================================

export const templateFieldTypeSchema = z.enum([
  'textarea',
  'text',
  'select',
  'number',
  'rating',
]);

export type TemplateFieldType = z.infer<typeof templateFieldTypeSchema>;

export const templateFieldSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/, 'Feld-ID muss kleinbuchstaben und underscore sein'),
  type: templateFieldTypeSchema,
  label: z.string().min(1, 'Label ist erforderlich'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  markdown: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export type TemplateField = z.infer<typeof templateFieldSchema>;

export const templateCategorySchema = z.enum([
  'game',
  'hardware',
  'movie',
  'series',
  'other',
]);

export type TemplateCategory = z.infer<typeof templateCategorySchema>;

// ============================================
// Template Schema
// ============================================

export const reviewTemplateSchema = z.object({
  id: z.string().regex(/^[a-z-]+$/, 'Template-ID muss kleinbuchstaben und bindestrich sein'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  description: z.string().optional(),
  category: templateCategorySchema,
  default: z.boolean().default(false),
  fields: z.array(templateFieldSchema).min(1, 'Mindestens ein Feld erforderlich'),
});

export type ReviewTemplate = z.infer<typeof reviewTemplateSchema>;

// ============================================
// Template Data (User Input)
// ============================================

export const templateDataSchema = z.record(z.string(), z.string());

export type TemplateData = z.infer<typeof templateDataSchema>;

// Validation: TemplateData against Template
export function validateTemplateData(
  data: TemplateData,
  template: ReviewTemplate
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of template.fields) {
    const value = data[field.id]?.trim() ?? '';

    if (field.required && !value) {
      errors[field.id] = `${field.label} ist ein Pflichtfeld`;
      continue;
    }

    if (!value) continue; // Optional field, empty is OK

    // Type-specific validation
    switch (field.type) {
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          errors[field.id] = `${field.label} muss eine Zahl sein`;
        }
        break;
      }
      case 'select': {
        if (field.options && field.options.length > 0 && !field.options.includes(value)) {
          errors[field.id] = `${field.label}: Ungültiger Wert`;
        }
        break;
      }
      case 'rating': {
        const num = Number(value);
        if (isNaN(num) || num < 1 || num > 10 || !Number.isInteger(num)) {
          errors[field.id] = `${field.label} muss eine ganze Zahl zwischen 1 und 10 sein`;
        }
        break;
      }
      case 'text':
      case 'textarea':
        // String validation already done
        break;
    }
  }

  // Check for unknown fields (not in template)
  const knownFields = new Set(template.fields.map(f => f.id));
  for (const key of Object.keys(data)) {
    if (!knownFields.has(key)) {
      errors[key] = `Unbekanntes Feld: ${key}`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// Template List Response
// ============================================

export const templateListResponseSchema = z.object({
  templates: z.array(reviewTemplateSchema),
});

export type TemplateListResponse = z.infer<typeof templateListResponseSchema>;

// ============================================
// Admin Review Template Fields
// ============================================

export const adminReviewTemplateInputSchema = z.object({
  templateId: z.string().optional(),
  templateData: templateDataSchema.optional(),
});

export type AdminReviewTemplateInput = z.infer<typeof adminReviewTemplateInputSchema>;