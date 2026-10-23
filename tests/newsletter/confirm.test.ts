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

import ConfirmPage from "@/app/newsletter/confirm/[token]/page";

describe("GET /newsletter/confirm/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist ungültigen Token zurück (notFound)", async () => {
    mockFindUnique.mockResolvedValue(null);

    const params = Promise.resolve({ token: "ungültig" });

    await expect(ConfirmPage({ params })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("bestätigt ein noch nicht bestätigtes Abonnement", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sub_1",
      email: "test@example.com",
      isActive: false,
      confirmedAt: null,
    } as any);
    mockUpdate.mockResolvedValue({});

    const params = Promise.resolve({ token: "gültiger-token" });

    const result = await ConfirmPage({ params });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { isActive: true, confirmedAt: expect.any(Date) },
    });
    expect(result).toBeDefined();
  });

  it("behandelt bereits bestätigtes Abonnement ohne Fehler", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sub_1",
      email: "test@example.com",
      isActive: true,
      confirmedAt: new Date(),
    } as any);

    const params = Promise.resolve({ token: "bereits-bestaetigt" });

    const result = await ConfirmPage({ params });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
