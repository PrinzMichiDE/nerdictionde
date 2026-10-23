import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockNotFound = vi.hoisted(() => vi.fn(() => {
  throw new Error("NOT_FOUND");
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    newsletterSubscription: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

import UnsubscribePage from "@/app/newsletter/unsubscribe/[token]/page";

describe("GET /newsletter/unsubscribe/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist ungültigen Token zurück (notFound)", async () => {
    mockFindUnique.mockResolvedValue(null);

    const params = Promise.resolve({ token: "ungültig" });

    await expect(UnsubscribePage({ params })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("meldet ein aktives Abonnement ab", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sub_1",
      email: "test@example.com",
      isActive: true,
    } as any);
    mockUpdate.mockResolvedValue({});

    const params = Promise.resolve({ token: "gültiger-token" });

    const result = await UnsubscribePage({ params });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { isActive: false, unsubscribedAt: expect.any(Date) },
    });
    expect(result).toBeDefined();
  });
});
