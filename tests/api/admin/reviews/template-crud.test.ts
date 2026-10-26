import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/reviews/route";
import { PUT } from "@/app/api/reviews/[id]/route";
import { featureFlags } from "@/lib/feature-flags";
import { validateTemplateDataForTemplate } from "@/lib/review-templates";
import prisma from "@/lib/prisma";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAuth: vi.fn(),
  checkAdminAuth: vi.fn(),
}));

vi.mock("@/lib/review-templates", () => ({
  getTemplate: vi.fn(),
  validateTemplateDataForTemplate: vi.fn(),
  getDefaultTemplate: vi.fn(),
}));

vi.mock("@/lib/comment-generation", () => ({
  generateAndSaveCommentsForReview: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/category-subscriptions", () => ({
  createCategoryNotifications: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/category-mapping", () => ({
  mapReviewCategoryToEnum: vi.fn().mockReturnValue("GAMES"),
}));

vi.mock("@/lib/feature-flags", () => ({
  featureFlags: {
    reviewTemplates: true,
    categorySubscriptions: false, // Disable to avoid notification logic in tests
  },
}));

import { requireAdminAuth } from "@/lib/auth";
import { getTemplate, validateTemplateDataForTemplate as validateTemplateDataForTemplateImport } from "@/lib/review-templates";

const mockPrisma = prisma as any;
const mockRequireAdminAuth = requireAdminAuth as any;
const mockGetTemplate = getTemplate as any;
const mockValidateTemplateData = validateTemplateDataForTemplateImport as any;

describe("Admin Review CRUD with Templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminAuth.mockReturnValue(null); // Auth OK
    mockGetTemplate.mockImplementation(async (id: string) => {
      // Default: return standard-game template for any ID
      return {
        id: "standard-game",
        name: "Standard Game Review",
        description: "Klassischer Game-Review",
        category: "game",
        default: true,
        fields: [
          { id: "intro", type: "textarea", label: "Einleitung", required: true, markdown: true, order: 1 },
          { id: "gameplay", type: "textarea", label: "Gameplay", required: true, markdown: true, order: 2 },
          { id: "pros", type: "textarea", label: "Pros", required: true, markdown: false, order: 3 },
          { id: "cons", type: "textarea", label: "Cons", required: true, markdown: false, order: 4 },
          { id: "verdict", type: "textarea", label: "Fazit", required: true, markdown: true, order: 5 },
        ],
      };
    });
    mockValidateTemplateData.mockReturnValue({ valid: true, errors: {} });
    mockPrisma.review.create.mockResolvedValue({
      id: "new-review-id",
      title: "Test Review",
      slug: "test-review",
      category: "game",
      content: "Content",
      score: 85,
      templateId: "standard-game",
      templateData: { intro: "Intro", gameplay: "Gameplay", pros: "- Pro 1", cons: "- Con 1", verdict: "Verdict" },
      templateVersion: 1,
    });
    mockPrisma.review.findUnique.mockResolvedValue({
      id: "existing-review",
      title: "Existing Review",
      slug: "existing-review",
      category: "game",
      content: "Content",
      score: 80,
      templateId: "standard-game",
      templateData: { intro: "Intro", gameplay: "Gameplay", pros: "- Pro 1", cons: "- Con 1", verdict: "Verdict" },
      templateVersion: 1,
      status: "draft",
    });
    mockPrisma.review.update.mockResolvedValue({
      id: "existing-review",
      title: "Updated Review",
      slug: "existing-review",
      category: "game",
      content: "Updated Content",
      score: 90,
      templateId: "standard-game",
      templateData: { intro: "Updated Intro", gameplay: "Updated Gameplay", pros: "- Pro 1", cons: "- Con 1", verdict: "Updated Verdict" },
      templateVersion: 1,
      status: "published",
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("POST /api/reviews (Create)", () => {
    it("should create review with templateId and templateData", async () => {
      const request = new NextRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Review",
          content: "Content",
          category: "game",
          score: 85,
          status: "draft",
          templateId: "standard-game",
          templateData: {
            intro: "Intro",
            gameplay: "Gameplay",
            pros: "- Pro 1",
            cons: "- Con 1",
            verdict: "Verdict",
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templateId).toBe("standard-game");
      expect(data.templateData).toEqual({
        intro: "Intro",
        gameplay: "Gameplay",
        pros: "- Pro 1",
        cons: "- Con 1",
        verdict: "Verdict",
      });
      expect(data.templateVersion).toBe(1);
    });

    it("should validate template data and return 400 for invalid data", async () => {
      mockValidateTemplateData.mockReturnValue({
        valid: false,
        errors: { gameplay: "Gameplay ist ein Pflichtfeld" },
      });

      const request = new NextRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Review",
          content: "Content",
          category: "game",
          score: 85,
          templateId: "standard-game",
          templateData: { intro: "Intro" }, // missing required gameplay
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Template-Validierung fehlgeschlagen");
      expect(data.details.gameplay).toBe("Gameplay ist ein Pflichtfeld");
    });

    it.skip("should return 400 for non-existent template", async () => {
      // Override the beforeEach mock for this test
      mockGetTemplate.mockReset();
      mockGetTemplate.mockImplementation(async (id: string) => {
        if (id === "non-existent") return null;
        return {
          id: "standard-game",
          name: "Standard Game Review",
          category: "game",
          default: true,
          fields: [{ id: "intro", type: "textarea", label: "Einleitung", required: true, markdown: true, order: 1 }],
        };
      });

      const request = new NextRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Review",
          content: "Content",
          category: "game",
          score: 85,
          templateId: "non-existent",
          templateData: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Template-Validierung fehlgeschlagen");
    });

    it.skip("should create review without template when feature flag is disabled", async () => {
      // Temporarily disable the feature flag
      const originalFlag = featureFlags.reviewTemplates;
      (featureFlags as any).reviewTemplates = false;

      try {
        const request = new NextRequest("http://localhost/api/reviews", {
          method: "POST",
          body: JSON.stringify({
            title: "Test Review",
            content: "Content",
            category: "game",
            score: 85,
            templateId: "standard-game",
            templateData: { intro: "Intro" },
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.templateId).toBeNull();
        expect(data.templateData).toBeNull();
      } finally {
        // Restore the feature flag
        (featureFlags as any).reviewTemplates = originalFlag;
      }
    });

    it("should require admin auth", async () => {
      mockRequireAdminAuth.mockReturnValue(new Response("Unauthorized", { status: 401 }));

      const request = new NextRequest("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Review",
          content: "Content",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/reviews/[id] (Update)", () => {
    it.skip("should update review with template data", async () => {
      const request = new NextRequest("http://localhost/api/reviews/existing-review", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Review",
          content: "Updated Content",
          score: 90,
          status: "published",
          templateId: "standard-game",
          templateData: {
            intro: "Updated Intro",
            gameplay: "Updated Gameplay",
            pros: "- Pro 1",
            cons: "- Con 1",
            verdict: "Updated Verdict",
          },
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "existing-review" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templateId).toBe("standard-game");
      expect(data.templateData.intro).toBe("Updated Intro");
      expect(data.templateVersion).toBe(1);
    });

    it.skip("should allow changing template", async () => {
      // Setup mock for the new template before the request
      mockGetTemplate.mockImplementation(async (id: string) => {
        if (id === "hardware") {
          return {
            id: "hardware",
            name: "Hardware Review",
            category: "hardware",
            default: false,
            fields: [{ id: "specs", type: "textarea", label: "Specs", required: true, markdown: true, order: 1 }],
          };
        }
        return {
          id: "standard-game",
          name: "Standard Game Review",
          category: "game",
          default: true,
          fields: [
            { id: "intro", type: "textarea", label: "Einleitung", required: true, markdown: true, order: 1 },
          ],
        };
      });
      mockValidateTemplateData.mockReturnValue({ valid: true, errors: {} });

      const request = new NextRequest("http://localhost/api/reviews/existing-review", {
        method: "PUT",
        body: JSON.stringify({
          templateId: "hardware",
          templateData: { specs: "New specs" },
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "existing-review" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templateId).toBe("hardware");
    });

    it.skip("should allow removing template", async () => {
      const request = new NextRequest("http://localhost/api/reviews/existing-review", {
        method: "PUT",
        body: JSON.stringify({
          templateId: null,
        }),
      });

      // Ensure getTemplate is not called for null templateId
      mockGetTemplate.mockClear();

      const response = await PUT(request, { params: Promise.resolve({ id: "existing-review" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templateId).toBeNull();
      expect(data.templateVersion).toBeNull();
      // Verify getTemplate was not called
      expect(mockGetTemplate).not.toHaveBeenCalled();
    });

    it("should validate template data on update", async () => {
      mockValidateTemplateData.mockReturnValue({
        valid: false,
        errors: { specs: "Specs ist ein Pflichtfeld" },
      });

      const request = new NextRequest("http://localhost/api/reviews/existing-review", {
        method: "PUT",
        body: JSON.stringify({
          templateId: "hardware",
          templateData: {},
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "existing-review" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Template-Validierung fehlgeschlagen");
    });

    it("should require admin auth", async () => {
      mockRequireAdminAuth.mockReturnValue(new Response("Unauthorized", { status: 401 }));

      const request = new NextRequest("http://localhost/api/reviews/existing-review", {
        method: "PUT",
        body: JSON.stringify({}),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "existing-review" }) });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/reviews/[id] (Read)", () => {
    it("should return review with template fields", async () => {
      const { GET } = await import("@/app/api/reviews/[id]/route");
      const request = new NextRequest("http://localhost/api/reviews/existing-review");

      const response = await GET(request, { params: Promise.resolve({ id: "existing-review" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templateId).toBe("standard-game");
      expect(data.templateData).toBeDefined();
      expect(data.templateVersion).toBe(1);
    });
  });
});