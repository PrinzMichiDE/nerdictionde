import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/templates/reviews/route";
import { featureFlags } from "@/lib/feature-flags";

// Mock dependencies
vi.mock("@/lib/review-templates", () => ({
  getTemplates: vi.fn(),
}));

vi.mock("@/lib/feature-flags", () => ({
  featureFlags: {
    reviewTemplates: true,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

import { getTemplates } from "@/lib/review-templates";
import { rateLimit } from "@/lib/rate-limit";

const mockGetTemplates = getTemplates as any;
const mockRateLimit = rateLimit as any;

describe("Template API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplates.mockResolvedValue([
      {
        id: "standard-game",
        name: "Standard Game Review",
        description: "Klassischer Game-Review",
        category: "game",
        default: true,
        fields: [
          { id: "intro", type: "textarea", label: "Einleitung", required: true, markdown: true, order: 1 },
        ],
      },
      {
        id: "hardware",
        name: "Hardware Review",
        description: "Technisches Hardware-Review",
        category: "hardware",
        default: false,
        fields: [
          { id: "specs", type: "textarea", label: "Specs", required: true, markdown: true, order: 1 },
        ],
      },
    ]);
    mockRateLimit.mockResolvedValue({ success: true, headers: new Headers() });
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("GET /api/templates/reviews", () => {
    it("should return templates when feature flag is enabled", async () => {
      const request = new NextRequest(new URL("http://localhost/api/templates/reviews"));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.templates).toHaveLength(2);
      expect(data.templates[0].id).toBe("standard-game");
      expect(data.templates[0].default).toBe(true);
    });

    it("should return 404 when feature flag is disabled", async () => {
      vi.doMock("@/lib/feature-flags", () => ({
        featureFlags: {
          reviewTemplates: false,
        },
      }));

      const { GET: GETDisabled } = await import("@/app/api/templates/reviews/route");
      const request = new NextRequest(new URL("http://localhost/api/templates/reviews"));
      const response = await GETDisabled(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Feature nicht verfügbar");
    });

    it("should return 429 when rate limited", async () => {
      mockRateLimit.mockResolvedValue({
        success: false,
        headers: new Headers({ "Retry-After": "60" }),
      });

      const request = new NextRequest(new URL("http://localhost/api/templates/reviews"));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Zu viele Anfragen");
    });

    it("should sort templates with default first", async () => {
      const request = new NextRequest(new URL("http://localhost/api/templates/reviews"));
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates[0].default).toBe(true);
      expect(data.templates[1].default).toBe(false);
    });

    it("should handle getTemplates error", async () => {
      mockGetTemplates.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest(new URL("http://localhost/api/templates/reviews"));
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Interner Serverfehler");
    });
  });
});