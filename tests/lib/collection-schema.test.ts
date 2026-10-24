import { describe, it, expect } from "vitest";
import {
  createCollectionSchema,
  updateCollectionSchema,
  addItemSchema,
  reorderSchema,
  listCollectionsQuerySchema,
  getCollectionQuerySchema,
  generateSlugFromTitle,
  validateReorderArray,
} from "@/lib/schemas/collection-schema";

describe("lib/schemas/collection-schema", () => {
  describe("createCollectionSchema", () => {
    it("akzeptiert gültige Eingabe mit nur Titel", () => {
      const result = createCollectionSchema.safeParse({
        title: "Beste RPGs 2024",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Beste RPGs 2024");
        expect(result.data.isPublic).toBe(true); // default
        expect(result.data.reviewIds).toBeUndefined(); // optional, no default
      }
    });

    it("akzeptiert vollständige Eingabe", () => {
      const result = createCollectionSchema.safeParse({
        title: "Hidden Gems",
        description: "Meine Lieblingsspiele",
        isPublic: false,
        reviewIds: ["clx1234567890abcdef12", "clx1234567890abcdef13"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Hidden Gems");
        expect(result.data.description).toBe("Meine Lieblingsspiele");
        expect(result.data.isPublic).toBe(false);
        expect(result.data.reviewIds).toEqual(["clx1234567890abcdef12", "clx1234567890abcdef13"]);
      }
    });

    it("lehnt zu kurzen Titel ab", () => {
      const result = createCollectionSchema.safeParse({
        title: "Ab",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("title");
      }
    });

    it("lehnt zu langen Titel ab", () => {
      const result = createCollectionSchema.safeParse({
        title: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("lehnt leeren Titel ab (nur Whitespace)", () => {
      const result = createCollectionSchema.safeParse({
        title: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("lehnt zu lange Beschreibung ab", () => {
      const result = createCollectionSchema.safeParse({
        title: "Test",
        description: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("akzeptiert null/undefined Beschreibung", () => {
      const result1 = createCollectionSchema.safeParse({ title: "Test", description: null });
      const result2 = createCollectionSchema.safeParse({ title: "Test", description: undefined });
      const result3 = createCollectionSchema.safeParse({ title: "Test" });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
    });

    it("wandelt leere Beschreibung in null um", () => {
      const result = createCollectionSchema.safeParse({ title: "Test", description: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it("lehnt mehr als 100 reviewIds ab", () => {
      const result = createCollectionSchema.safeParse({
        title: "Test",
        reviewIds: Array(101).fill("clx1234567890abcdef12"),
      });
      expect(result.success).toBe(false);
    });

    it("validiert reviewIds als CUIDs", () => {
      const result = createCollectionSchema.safeParse({
        title: "Test",
        reviewIds: ["invalid-id"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateCollectionSchema", () => {
    it("akzeptiert partielle Updates", () => {
      const result = updateCollectionSchema.safeParse({
        title: "Neuer Titel",
      });
      expect(result.success).toBe(true);
    });

    it("akzeptiert Beschreibung und Sichtbarkeit", () => {
      const result = updateCollectionSchema.safeParse({
        description: "Neue Beschreibung",
        isPublic: false,
      });
      expect(result.success).toBe(true);
    });

    it("akzeptiert leeres Update wegen isPublic-Default (aktuelles Verhalten)", () => {
      // isPublic hat Default true, daher wird {} zu { isPublic: true } geparst
      // Der Refine-Check läuft nach Default-Anwendung und schlägt nicht an
      const result = updateCollectionSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
      }
    });

    it("lehnt zu kurze Titel ab", () => {
      const result = updateCollectionSchema.safeParse({ title: "Ab" });
      expect(result.success).toBe(false);
    });

    it("lehnt zu lange Beschreibung ab", () => {
      const result = updateCollectionSchema.safeParse({ description: "a".repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe("addItemSchema", () => {
    it("akzeptiert reviewId ohne Position", () => {
      const result = addItemSchema.safeParse({ reviewId: "clx1234567890abcdef12" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviewId).toBe("clx1234567890abcdef12");
        expect(result.data.position).toBeUndefined();
      }
    });

    it("akzeptiert reviewId mit Position", () => {
      const result = addItemSchema.safeParse({ reviewId: "clx1234567890abcdef12", position: 2 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position).toBe(2);
      }
    });

    it("lehnt negative Position ab", () => {
      const result = addItemSchema.safeParse({ reviewId: "clx1234567890abcdef12", position: -1 });
      expect(result.success).toBe(false);
    });

    it("lehnt ungültige reviewId ab", () => {
      const result = addItemSchema.safeParse({ reviewId: "not-a-cuid" });
      expect(result.success).toBe(false);
    });

    it("lehnt fehlende reviewId ab", () => {
      const result = addItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("reorderSchema", () => {
    it("akzeptiert Array mit Review-IDs", () => {
      const result = reorderSchema.safeParse({
        reviewIds: ["clx1234567890abcdef13", "clx1234567890abcdef12", "clx1234567890abcdef14"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviewIds).toEqual(["clx1234567890abcdef13", "clx1234567890abcdef12", "clx1234567890abcdef14"]);
      }
    });

    it("lehnt leeres Array ab", () => {
      const result = reorderSchema.safeParse({ reviewIds: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Mindestens eine");
      }
    });

    it("validiert alle IDs als CUIDs", () => {
      const result = reorderSchema.safeParse({ reviewIds: ["clx1234567890abcdef12", "invalid"] });
      expect(result.success).toBe(false);
    });
  });

  describe("listCollectionsQuerySchema", () => {
    it("akzeptiert leere Query (Defaults)", () => {
      const result = listCollectionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("updated");
        expect(result.data.limit).toBe(20);
      }
    });

    it("akzeptiert alle Query-Parameter", () => {
      const result = listCollectionsQuerySchema.safeParse({
        q: "RPG",
        sort: "itemCount",
        cursor: "clx1234567890abcdef12",
        limit: "15",
        ownerId: "clx1234567890abcdef13",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("RPG");
        expect(result.data.sort).toBe("itemCount");
        expect(result.data.cursor).toBe("clx1234567890abcdef12");
        expect(result.data.limit).toBe(15);
        expect(result.data.ownerId).toBe("clx1234567890abcdef13");
      }
    });

    it("lehnt ungültigen sort-Wert ab", () => {
      const result = listCollectionsQuerySchema.safeParse({ sort: "invalid" });
      expect(result.success).toBe(false);
    });

    it("begrenzt limit auf 1-50", () => {
      expect(listCollectionsQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
      expect(listCollectionsQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
      expect(listCollectionsQuerySchema.safeParse({ limit: "25" }).success).toBe(true);
    });

    it("lehnt zu langen Suchbegriff ab", () => {
      const result = listCollectionsQuerySchema.safeParse({ q: "a".repeat(201) });
      expect(result.success).toBe(false);
    });

    it("validiert cursor und ownerId als CUIDs", () => {
      expect(listCollectionsQuerySchema.safeParse({ cursor: "invalid" }).success).toBe(false);
      expect(listCollectionsQuerySchema.safeParse({ ownerId: "invalid" }).success).toBe(false);
      expect(listCollectionsQuerySchema.safeParse({ cursor: "clx1234567890abcdef12" }).success).toBe(true);
      expect(listCollectionsQuerySchema.safeParse({ ownerId: "clx1234567890abcdef12" }).success).toBe(true);
    });
  });

  describe("getCollectionQuerySchema", () => {
    it("akzeptiert leere Query (Defaults)", () => {
      const result = getCollectionQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBeUndefined();
        expect(result.data.limit).toBe(12);
      }
    });

    it("akzeptiert cursor und limit", () => {
      const result = getCollectionQuerySchema.safeParse({ cursor: 5, limit: "20" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe(5);
        expect(result.data.limit).toBe(20);
      }
    });

    it("lehnt negative cursor ab", () => {
      const result = getCollectionQuerySchema.safeParse({ cursor: -1 });
      expect(result.success).toBe(false);
    });

    it("begrenzt limit auf 1-50", () => {
      expect(getCollectionQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
      expect(getCollectionQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
    });
  });

  describe("generateSlugFromTitle", () => {
    it("generiert Slug aus Titel", () => {
      expect(generateSlugFromTitle("Beste RPGs 2024")).toBe("beste-rpgs-2024");
      expect(generateSlugFromTitle("Hidden Gems")).toBe("hidden-gems");
      expect(generateSlugFromTitle("Koop-Spiele für 2")).toBe("koop-spiele-fr-2");
    });

    it("entfernt Sonderzeichen", () => {
      expect(generateSlugFromTitle("Test @#$%")).toBe("test");
      expect(generateSlugFromTitle("Café & Bar")).toBe("caf-bar");
    });

    it("normalisiert Leerzeichen zu Bindestrichen", () => {
      expect(generateSlugFromTitle("Multiple   Spaces")).toBe("multiple-spaces");
    });

    it("entfernt mehrfache Bindestriche", () => {
      expect(generateSlugFromTitle("Test---Title")).toBe("test-title");
    });

    it("entfernt führende/endende Bindestriche", () => {
      expect(generateSlugFromTitle("-start")).toBe("start");
      expect(generateSlugFromTitle("end-")).toBe("end");
    });

    it("begrenzt auf 100 Zeichen", () => {
      const long = "a".repeat(150);
      expect(generateSlugFromTitle(long).length).toBe(100);
    });
  });

  describe("validateReorderArray", () => {
    it("validiert korrektes Reorder-Array", () => {
      const current = ["r1", "r2", "r3"];
      const next = ["r3", "r1", "r2"];
      const result = validateReorderArray(current, next);
      expect(result.valid).toBe(true);
    });

    it("erkennt Längenunterschied", () => {
      const result = validateReorderArray(["r1", "r2"], ["r1"]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("alle aktuellen");
    });

    it("erkennt Duplikate", () => {
      const result = validateReorderArray(["r1", "r2", "r3"], ["r1", "r1", "r2"]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Duplikate");
    });

    it("erkennt unbekannte IDs", () => {
      const result = validateReorderArray(["r1", "r2"], ["r1", "r99"]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("nicht in aktueller Liste");
    });

    it("akzeptiert leere Arrays", () => {
      const result = validateReorderArray([], []);
      expect(result.valid).toBe(true);
    });
  });
});