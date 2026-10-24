import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaReviewCollectionFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaReviewCollectionFindMany = vi.hoisted(() => vi.fn());
const mockPrismaReviewCollectionCreate = vi.hoisted(() => vi.fn());
const mockPrismaReviewCollectionUpdate = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemFindMany = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemCreate = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemCreateMany = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemDeleteMany = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemDelete = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemUpdateMany = vi.hoisted(() => vi.fn());
const mockPrismaReviewFindUnique = vi.hoisted(() => vi.fn());
const mockPrismaReviewFindMany = vi.hoisted(() => vi.fn());
const mockPrismaCollectionItemCount = vi.hoisted(() => vi.fn());
const mockPrismaTransaction = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    reviewCollection: {
      findUnique: mockPrismaReviewCollectionFindUnique,
      findMany: mockPrismaReviewCollectionFindMany,
      create: mockPrismaReviewCollectionCreate,
      update: mockPrismaReviewCollectionUpdate,
    },
    collectionItem: {
      findMany: mockPrismaCollectionItemFindMany,
      findUnique: mockPrismaCollectionItemFindUnique,
      create: mockPrismaCollectionItemCreate,
      createMany: mockPrismaCollectionItemCreateMany,
      deleteMany: mockPrismaCollectionItemDeleteMany,
      delete: mockPrismaCollectionItemDelete,
      updateMany: mockPrismaCollectionItemUpdateMany,
      count: mockPrismaCollectionItemCount,
    },
    review: {
      findUnique: mockPrismaReviewFindUnique,
      findMany: mockPrismaReviewFindMany,
    },
    $transaction: mockPrismaTransaction,
  },
}));

import {
  generateUniqueSlug,
  syncItemCount,
  incrementItemCount,
  decrementItemCount,
  reorderCollectionItems,
  insertItemAtPosition,
  removeItemFromCollection,
  getPublicCollections,
  getCollectionWithItems,
  getMyCollections,
  isCollectionOwner,
  isCollectionOwnerBySlug,
  getCollectionById,
  getCollectionBySlug,
  validateReviewForCollection,
  canAddItem,
} from "@/lib/collections";
import { validateReorderArray, generateSlugFromTitle } from "@/lib/schemas/collection-schema";

describe("lib/collections - Utility Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSlugFromTitle", () => {
    it("wandelt Titel in gültigen Slug um", () => {
      expect(generateSlugFromTitle("Beste RPGs 2024")).toBe("beste-rpgs-2024");
      expect(generateSlugFromTitle("Hidden Gems")).toBe("hidden-gems");
      expect(generateSlugFromTitle("Koop-Spiele")).toBe("koop-spiele");
    });

    it("entfernt Sonderzeichen", () => {
      expect(generateSlugFromTitle("Test@#$%^&*()")).toBe("test");
      expect(generateSlugFromTitle("Café & Bar")).toBe("caf-bar");
    });

    it("normalisiert mehrfache Bindestriche", () => {
      expect(generateSlugFromTitle("Test  ---  Title")).toBe("test-title");
    });

    it("entfernt führende/endende Bindestriche", () => {
      expect(generateSlugFromTitle("-Test Title-")).toBe("test-title");
    });

    it("begrenzt auf 100 Zeichen", () => {
      const longTitle = "a".repeat(150);
      expect(generateSlugFromTitle(longTitle).length).toBe(100);
    });

    it("behandelt leeren String", () => {
      expect(generateSlugFromTitle("")).toBe("");
      expect(generateSlugFromTitle("   ")).toBe("");
    });
  });

  describe("validateReorderArray", () => {
    it("akzeptiert valides Reorder-Array", () => {
      const current = ["review_1", "review_2", "review_3"];
      const next = ["review_3", "review_1", "review_2"];
      const result = validateReorderArray(current, next);
      expect(result.valid).toBe(true);
    });

    it("lehnt unterschiedliche Länge ab", () => {
      const current = ["review_1", "review_2"];
      const next = ["review_1"];
      const result = validateReorderArray(current, next);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("alle aktuellen Review-IDs");
    });

    it("lehnt Duplikate ab", () => {
      const current = ["review_1", "review_2", "review_3"];
      const next = ["review_1", "review_1", "review_2"];
      const result = validateReorderArray(current, next);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Duplikate");
    });

    it("lehnt unbekannte Review-IDs ab", () => {
      const current = ["review_1", "review_2"];
      const next = ["review_1", "review_3"];
      const result = validateReorderArray(current, next);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("nicht in aktueller Liste");
    });

    it("behandelt leere Arrays", () => {
      const result = validateReorderArray([], []);
      expect(result.valid).toBe(true);
    });
  });

  describe("generateUniqueSlug", () => {
    it("gibt Basis-Slug zurück wenn frei", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue(null);

      const result = await generateUniqueSlug("Test Title");

      expect(result).toBe("test-title");
      expect(mockPrismaReviewCollectionFindUnique).toHaveBeenCalledWith({
        where: { slug: "test-title" },
        select: { id: true },
      });
    });

    it("hängt -2 an bei Kollision", async () => {
      mockPrismaReviewCollectionFindUnique
        .mockResolvedValueOnce({ id: "existing_1" }) // base slug exists
        .mockResolvedValueOnce(null); // test-title-2 is free

      const result = await generateUniqueSlug("Test Title");

      expect(result).toBe("test-title-2");
    });

    it("sucht nächste freie Nummer", async () => {
      mockPrismaReviewCollectionFindUnique
        .mockResolvedValueOnce({ id: "existing_1" }) // test-title
        .mockResolvedValueOnce({ id: "existing_2" }) // test-title-2
        .mockResolvedValueOnce(null); // test-title-3 is free

      const result = await generateUniqueSlug("Test Title");

      expect(result).toBe("test-title-3");
    });

    it("wirft Error nach 1000 Versuchen", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ id: "existing" });

      await expect(generateUniqueSlug("Test")).rejects.toThrow("eindeutigen Slug");
    });
  });

  describe("syncItemCount", () => {
    it("aktualisiert itemCount basierend auf tatsächlicher Anzahl", async () => {
      mockPrismaCollectionItemCount.mockResolvedValue(5);
      mockPrismaReviewCollectionUpdate.mockResolvedValue({ itemCount: 5 });

      const result = await syncItemCount("collection_1");

      expect(result).toBe(5);
      expect(mockPrismaCollectionItemCount).toHaveBeenCalledWith({
        where: { collectionId: "collection_1" },
      });
      expect(mockPrismaReviewCollectionUpdate).toHaveBeenCalledWith({
        where: { id: "collection_1" },
        data: { itemCount: 5 },
      });
    });
  });

  describe("incrementItemCount / decrementItemCount", () => {
    it("inkrementiert atomar", async () => {
      mockPrismaReviewCollectionUpdate.mockResolvedValue({ itemCount: 6 });

      const result = await incrementItemCount("collection_1");

      expect(result).toBe(6);
      expect(mockPrismaReviewCollectionUpdate).toHaveBeenCalledWith({
        where: { id: "collection_1" },
        data: { itemCount: { increment: 1 } },
        select: { itemCount: true },
      });
    });

    it("dekrementiert atomar", async () => {
      mockPrismaReviewCollectionUpdate.mockResolvedValue({ itemCount: 4 });

      const result = await decrementItemCount("collection_1");

      expect(result).toBe(4);
      expect(mockPrismaReviewCollectionUpdate).toHaveBeenCalledWith({
        where: { id: "collection_1" },
        data: { itemCount: { decrement: 1 } },
        select: { itemCount: true },
      });
    });
  });

  describe("reorderCollectionItems", () => {
    it("führt Reorder erfolgreich durch", async () => {
      mockPrismaCollectionItemFindMany.mockResolvedValue([
        { reviewId: "review_1", position: 0 },
        { reviewId: "review_2", position: 1 },
      ]);
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ version: 1 });
      mockPrismaTransaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: {
            deleteMany: vi.fn().mockResolvedValue({}),
            createMany: vi.fn().mockResolvedValue({}),
          },
          reviewCollection: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const result = await reorderCollectionItems("collection_1", ["review_2", "review_1"], 1);

      expect(result.success).toBe(true);
      expect(result.version).toBe(2);
    });

    it("lehnt ungültiges Reorder-Array ab (unbekannte ID)", async () => {
      mockPrismaCollectionItemFindMany.mockResolvedValue([
        { reviewId: "review_1", position: 0 },
      ]);
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ version: 1 });

      const result = await reorderCollectionItems("collection_1", ["review_2"], 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain("nicht in aktueller Liste");
    });

    it("lehnt falsche Version ab (optimistisches Locking)", async () => {
      mockPrismaCollectionItemFindMany.mockResolvedValue([
        { reviewId: "review_1", position: 0 },
      ]);
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ version: 5 });

      const result = await reorderCollectionItems("collection_1", ["review_1"], 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain("zwischenzeitlich geändert");
    });

    it("gibt Fehler zurück wenn Collection nicht existiert", async () => {
      mockPrismaCollectionItemFindMany.mockResolvedValue([]);
      mockPrismaReviewCollectionFindUnique.mockResolvedValue(null);

      const result = await reorderCollectionItems("collection_1", [], 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Liste nicht gefunden");
    });

    it("fängt Transaktionsfehler ab", async () => {
      mockPrismaCollectionItemFindMany.mockResolvedValue([
        { reviewId: "review_1", position: 0 },
      ]);
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ version: 1 });
      mockPrismaTransaction.mockRejectedValue(new Error("DB Error"));

      const result = await reorderCollectionItems("collection_1", ["review_1"], 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Fehler beim Speichern der Reihenfolge");
    });
  });

  describe("insertItemAtPosition", () => {
    it("fügt Item an Position ein", async () => {
      mockPrismaTransaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: {
            updateMany: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
          },
          reviewCollection: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const result = await insertItemAtPosition("collection_1", "review_3", 1);

      expect(result.success).toBe(true);
    });

    it("gibt Fehler bei Duplikat zurück (P2002)", async () => {
      const error = new Error("P2002: Unique constraint violation");
      mockPrismaTransaction.mockRejectedValue(error);

      const result = await insertItemAtPosition("collection_1", "review_1", 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Review ist bereits in der Liste");
    });

    it("fängt andere Transaktionsfehler ab", async () => {
      mockPrismaTransaction.mockRejectedValue(new Error("Other DB Error"));

      const result = await insertItemAtPosition("collection_1", "review_1", 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Fehler beim Hinzufügen");
    });
  });

  describe("removeItemFromCollection", () => {
    it("entfernt Item und schiebt nachfolgende nach vorne", async () => {
      mockPrismaCollectionItemFindUnique.mockResolvedValue({ position: 1 });
      mockPrismaTransaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: {
            delete: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({}),
          },
          reviewCollection: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const result = await removeItemFromCollection("collection_1", "review_2");

      expect(result.success).toBe(true);
    });

    it("gibt Fehler wenn Item nicht in Liste", async () => {
      mockPrismaCollectionItemFindUnique.mockResolvedValue(null);

      const result = await removeItemFromCollection("collection_1", "review_99");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Review nicht in Liste gefunden");
    });

    it("fängt Transaktionsfehler ab", async () => {
      mockPrismaCollectionItemFindUnique.mockResolvedValue({ position: 0 });
      mockPrismaTransaction.mockRejectedValue(new Error("DB Error"));

      const result = await removeItemFromCollection("collection_1", "review_1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Fehler beim Entfernen");
    });
  });

  describe("getPublicCollections", () => {
    it("gibt öffentliche Listen mit Filter zurück", async () => {
      mockPrismaReviewCollectionFindMany.mockResolvedValue([
        {
          id: "coll_1",
          slug: "test-1",
          title: "Test 1",
          description: null,
          isPublic: true,
          itemCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
        },
      ]);

      const result = await getPublicCollections({ q: "test", sort: "updated", limit: 20 });

      expect(result.collections).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
      expect(mockPrismaReviewCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublic: true,
            deletedAt: null,
            OR: expect.arrayContaining([
              { title: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
            ]),
          }),
          orderBy: { updatedAt: "desc" },
          take: 21,
        })
      );
    });

    it("unterstützt verschiedene Sortierungen", async () => {
      mockPrismaReviewCollectionFindMany.mockResolvedValue([]);

      await getPublicCollections({ sort: "created" });
      expect(mockPrismaReviewCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" } })
      );

      await getPublicCollections({ sort: "itemCount" });
      expect(mockPrismaReviewCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { itemCount: "desc" } })
      );

      await getPublicCollections({ sort: "popularity" });
      expect(mockPrismaReviewCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { itemCount: "desc" } })
      );
    });

    it("unterstützt Cursor-Pagination", async () => {
      mockPrismaReviewCollectionFindMany.mockResolvedValue([
        { id: "coll_1", slug: "a", title: "A", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u1", username: "u1", displayName: "U1", profileImageUrl: null } },
        { id: "coll_2", slug: "b", title: "B", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u2", username: "u2", displayName: "U2", profileImageUrl: null } },
        { id: "coll_3", slug: "c", title: "C", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u3", username: "u3", displayName: "U3", profileImageUrl: null } },
      ]);

      const result = await getPublicCollections({ limit: 2, cursor: "coll_1" });

      expect(result.collections).toHaveLength(2);
      expect(result.nextCursor).toBe("coll_2");
      expect(mockPrismaReviewCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { lt: "coll_1" } }),
          take: 3,
        })
      );
    });
  });

  describe("getCollectionWithItems", () => {
    it("gibt Collection mit Items zurück", async () => {
      const mockCollection = {
        id: "coll_1",
        slug: "test-collection",
        title: "Test Collection",
        description: "Desc",
        isPublic: true,
        deletedAt: null,
        itemCount: 2,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "owner_1",
        owner: { id: "owner_1", username: "owner", displayName: "Owner", profileImageUrl: null },
        items: [
          { reviewId: "review_1", position: 0, addedAt: new Date(), review: { id: "review_1", title: "Review 1", slug: "review-1", category: "game", score: 80, images: [], releaseDate: null } },
          { reviewId: "review_2", position: 1, addedAt: new Date(), review: { id: "review_2", title: "Review 2", slug: "review-2", category: "movie", score: 90, images: [], releaseDate: null } },
        ],
      };
      mockPrismaReviewCollectionFindUnique.mockResolvedValue(mockCollection);

      const result = await getCollectionWithItems({ slug: "test-collection" });

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Collection");
      expect(result?.items).toHaveLength(2);
      expect(result?.nextCursor).toBeNull(); // all items fit in one page
    });

    it("gibt null für private Liste ohne Owner-Zugriff", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({
        id: "coll_1",
        slug: "private-collection",
        isPublic: false,
        ownerId: "owner_1",
        deletedAt: null,
        owner: { id: "owner_1", username: "owner", displayName: "Owner", profileImageUrl: null },
        items: [],
      });

      const result = await getCollectionWithItems({ slug: "private-collection", userId: "other_user" });

      expect(result).toBeNull();
    });

    it("gibt private Liste für Owner zurück", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({
        id: "coll_1",
        slug: "private-collection",
        isPublic: false,
        ownerId: "owner_1",
        deletedAt: null,
        owner: { id: "owner_1", username: "owner", displayName: "Owner", profileImageUrl: null },
        items: [],
      });

      const result = await getCollectionWithItems({ slug: "private-collection", userId: "owner_1" });

      expect(result).not.toBeNull();
    });

    it("gibt null für gelöschte Liste ohne Owner-Zugriff", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({
        id: "coll_1",
        slug: "deleted-collection",
        isPublic: true,
        ownerId: "owner_1",
        deletedAt: new Date(),
        owner: { id: "owner_1", username: "owner", displayName: "Owner", profileImageUrl: null },
        items: [],
      });

      const result = await getCollectionWithItems({ slug: "deleted-collection", userId: "other_user" });

      expect(result).toBeNull();
    });

    it("unterstützt Position-Cursor für Pagination", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({
        id: "coll_1",
        slug: "test",
        isPublic: true,
        ownerId: "owner_1",
        deletedAt: null,
        owner: { id: "owner_1", username: "owner", displayName: "Owner", profileImageUrl: null },
        items: [
          { reviewId: "r2", position: 1, addedAt: new Date(), review: { id: "r2", title: "R2", slug: "r2", category: "game", score: 80, images: [], releaseDate: null } },
          { reviewId: "r3", position: 2, addedAt: new Date(), review: { id: "r3", title: "R3", slug: "r3", category: "game", score: 80, images: [], releaseDate: null } },
          { reviewId: "r4", position: 3, addedAt: new Date(), review: { id: "r4", title: "R4", slug: "r4", category: "game", score: 80, images: [], releaseDate: null } },
        ],
      });

      const result = await getCollectionWithItems({ slug: "test", cursor: 1, limit: 2 });

      expect(result?.items).toHaveLength(2);
      expect(result?.items[0].review.id).toBe("r2");
      expect(result?.nextCursor).toBe(2);
    });
  });

  describe("getMyCollections", () => {
    it("gibt eigene Listen zurück (inkl. private)", async () => {
      mockPrismaReviewCollectionFindMany.mockResolvedValue([
        {
          id: "coll_1",
          slug: "public-1",
          title: "Public 1",
          isPublic: true,
          itemCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
        },
        {
          id: "coll_2",
          slug: "private-1",
          title: "Private 1",
          isPublic: false,
          itemCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: "user_1", username: "user1", displayName: "User 1", profileImageUrl: null },
        },
      ]);

      const result = await getMyCollections({ userId: "user_1", limit: 20 });

      expect(result.collections).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(mockPrismaReviewCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: "user_1" },
          orderBy: { updatedAt: "desc" },
        })
      );
    });

    it("unterstützt Cursor-Pagination", async () => {
      mockPrismaReviewCollectionFindMany.mockResolvedValue([
        { id: "coll_3", slug: "c", title: "C", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u1", username: "u1", displayName: "U1", profileImageUrl: null } },
        { id: "coll_2", slug: "b", title: "B", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u1", username: "u1", displayName: "U1", profileImageUrl: null } },
        { id: "coll_1", slug: "a", title: "A", isPublic: true, itemCount: 1, createdAt: new Date(), updatedAt: new Date(), owner: { id: "u1", username: "u1", displayName: "U1", profileImageUrl: null } },
      ]);

      const result = await getMyCollections({ userId: "user_1", limit: 2, cursor: "coll_2" });

      // Mock doesn't filter by cursor, so all 3 returned, then sliced to 2
      expect(result.collections).toHaveLength(2);
      expect(result.nextCursor).toBe("coll_2");
    });
  });

  describe("isCollectionOwner / isCollectionOwnerBySlug", () => {
    it("prüft Owner via ID", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ ownerId: "owner_1" });

      const result = await isCollectionOwner("coll_1", "owner_1");

      expect(result).toBe(true);
    });

    it("gibt false für Nicht-Owner", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ ownerId: "owner_1" });

      const result = await isCollectionOwner("coll_1", "other_user");

      expect(result).toBe(false);
    });

    it("gibt false wenn Collection nicht existiert", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue(null);

      const result = await isCollectionOwner("coll_1", "owner_1");

      expect(result).toBe(false);
    });

    it("prüft Owner via Slug", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ ownerId: "owner_1" });

      const result = await isCollectionOwnerBySlug("my-slug", "owner_1");

      expect(result).toBe(true);
    });
  });

  describe("getCollectionById / getCollectionBySlug", () => {
    it("holt Collection by ID", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ id: "coll_1", title: "Test" });

      const result = await getCollectionById("coll_1");

      expect(result).toEqual({ id: "coll_1", title: "Test" });
    });

    it("holt Collection by Slug", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ id: "coll_1", slug: "test" });

      const result = await getCollectionBySlug("test");

      expect(result).toEqual({ id: "coll_1", slug: "test" });
    });
  });

  describe("validateReviewForCollection", () => {
    it("validiert existierende published Review", async () => {
      mockPrismaReviewFindUnique.mockResolvedValue({ id: "review_1", status: "published" });

      const result = await validateReviewForCollection("review_1");

      expect(result.valid).toBe(true);
    });

    it("lehnt nicht existierende Review ab", async () => {
      mockPrismaReviewFindUnique.mockResolvedValue(null);

      const result = await validateReviewForCollection("review_99");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Review nicht gefunden");
    });

    it("lehnt nicht-published Review ab", async () => {
      mockPrismaReviewFindUnique.mockResolvedValue({ id: "review_1", status: "draft" });

      const result = await validateReviewForCollection("review_1");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Nur veröffentlichte Reviews können hinzugefügt werden");
    });
  });

  describe("canAddItem", () => {
    it("erlaubt Hinzufügen wenn unter Limit", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ itemCount: 50 });

      const result = await canAddItem("coll_1");

      expect(result.allowed).toBe(true);
    });

    it("verhindert Hinzufügen bei Max Items (100)", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue({ itemCount: 100 });

      const result = await canAddItem("coll_1");

      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Maximal 100");
    });

    it("gibt Fehler wenn Collection nicht existiert", async () => {
      mockPrismaReviewCollectionFindUnique.mockResolvedValue(null);

      const result = await canAddItem("coll_99");

      expect(result.allowed).toBe(false);
      expect(result.error).toBe("Liste nicht gefunden");
    });
  });
});