import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockUpsert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    newsletterSubscription: {
      upsert: mockUpsert,
    },
  },
}));

import { POST } from "@/app/api/newsletter/subscribe/route";

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("erstellt ein inaktives Abonnement mit bestaetigungstoken (Double-Optin)", async () => {
    mockUpsert.mockResolvedValue({
      id: "sub_1",
      email: "test@example.com",
      isActive: false,
      confirmationToken: "token-123",
    });

    const req = new NextRequest(
      "http://localhost/api/newsletter/subscribe",
      {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      },
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.confirmationToken).toBeDefined();
    expect(data.message).toContain("bestaetige");
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      create: expect.objectContaining({ isActive: false }),
      update: expect.objectContaining({ isActive: false }),
    });
  });

  it("lehnt eine ungültige E-Mail-Adresse ab (400)", async () => {
    const req = new NextRequest(
      "http://localhost/api/newsletter/subscribe",
      {
        method: "POST",
        body: JSON.stringify({ email: "keine-volle.email" }),
      },
    );

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("arbeitet idempotent: upsert wird mit gleicher E-Mail aufgerufen", async () => {
    mockUpsert.mockResolvedValue({
      id: "sub_1",
      email: "test@example.com",
      isActive: false,
    });

    const req = new NextRequest(
      "http://localhost/api/newsletter/subscribe",
      {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      },
    );

    await POST(req);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "test@example.com" } }),
    );
  });
});
