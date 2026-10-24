import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockRequireTwitchAuth = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  reviewCollection: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  collectionItem: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  review: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/auth-twitch", () => ({
  requireTwitchAuth: mockRequireTwitchAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("@/lib/collection-follow", () => ({
  createCollectionUpdateNotification: vi.fn(),
}));

vi.mock("@/lib/collections-follow-schema", () => ({
  isCollectionsFollowEnabled: vi.fn(() => true),
}));

import { POST as postItems, DELETE as deleteItems } from "@/app/api/listen/[slug]/items/route";

describe("POST/DELETE /api/listen/[slug]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reviewCollection.findUnique.mockReset();
    mockPrisma.reviewCollection.update.mockReset();
    mockPrisma.collectionItem.createMany.mockReset();
    mockPrisma.collectionItem.deleteMany.mockReset();
    mockPrisma.review.findMany.mockReset();
    mockPrisma.$transaction.mockReset();
  });

  const createRequest = (method: string, slug: string, body?: unknown) => {
    const url = `http://localhost/api/listen/${slug}/items`;
    const options: RequestInit = { method };
    if (body) {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'application/json' };
    }
    return new NextRequest(url, options);
  };

  describe("POST /api/listen/[slug]/items", () => {
    it("lehnt nicht authentifizierte Nutzer ab (401)", async () => {
      mockRequireTwitchAuth.mockResolvedValue(new NextResponse(null, { status: 401 }));

      const req = createRequest('POST', 'test-collection', { reviewId: 'review_1' });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      expect(res.status).toBe(401);
    });

    it("lehnt Nicht-Owner ab (403)", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_2' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
        isPublic: true,
      });

      const req = createRequest('POST', 'test-collection', { reviewId: 'review_1' });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Nicht autorisiert');
    });

    it("fügt einzelnes Review hinzu", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
        isPublic: true,
      });
      mockPrisma.collectionItem.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([{ id: 'review_1' }]);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const req = createRequest('POST', 'test-collection', { reviewId: 'review_1' });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.addedCount).toBe(1);
      expect(data.totalCount).toBe(6);
    });

    it("fügt mehrere Reviews hinzu", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
        isPublic: true,
      });
      mockPrisma.collectionItem.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([{ id: 'review_1' }, { id: 'review_2' }]);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const req = createRequest('POST', 'test-collection', { reviewIds: ['review_1', 'review_2'] });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.addedCount).toBe(2);
      expect(data.totalCount).toBe(7);
    });

    it("überspringt bereits existierende Reviews", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
        isPublic: true,
      });
      mockPrisma.collectionItem.findMany.mockResolvedValue([{ reviewId: 'review_1' }]);
      mockPrisma.review.findMany.mockResolvedValue([{ id: 'review_1' }, { id: 'review_2' }]);
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const req = createRequest('POST', 'test-collection', { reviewIds: ['review_1', 'review_2'] });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.addedCount).toBe(1);
      expect(data.totalCount).toBe(6);
    });

    it("lehnt ungültige/ nicht veröffentlichte Reviews ab", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
        isPublic: true,
      });
      mockPrisma.collectionItem.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue([]);

      const req = createRequest('POST', 'test-collection', { reviewId: 'review_invalid' });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Keine gültigen Reviews zum Hinzufügen');
    });

    it("gibt 400 bei Überschreitung des 100-Item Limits", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 95,
        deletedAt: null,
        isPublic: true,
      });
      mockPrisma.collectionItem.findMany.mockResolvedValue([]);
      mockPrisma.review.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({ id: `review_${i}` }))
      );

      const req = createRequest('POST', 'test-collection', { reviewIds: Array.from({ length: 10 }, (_, i) => `review_${i}`) });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('Maximum von 100 Items');
    });

    it("gibt 404 bei gelöschter Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: new Date(),
        isPublic: true,
      });

      const req = createRequest('POST', 'deleted-collection', { reviewId: 'review_1' });
      const res = await postItems(req, { params: Promise.resolve({ slug: 'deleted-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Liste wurde gelöscht');
    });
  });

  describe("DELETE /api/listen/[slug]/items", () => {
    it("entfernt Reviews aus Collection", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
      });
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          collectionItem: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
          reviewCollection: { update: vi.fn().mockResolvedValue({}) },
        };
        return fn(tx);
      });

      const req = createRequest('DELETE', 'test-collection', { reviewIds: ['review_1', 'review_2'] });
      const res = await deleteItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.removedCount).toBe(2);
      expect(data.totalCount).toBe(3);
    });

    it("gibt 400 bei fehlenden reviewIds", async () => {
      mockRequireTwitchAuth.mockResolvedValue({ userId: 'user_1' });
      mockPrisma.reviewCollection.findUnique.mockResolvedValue({
        id: 'coll_1',
        ownerId: 'user_1',
        itemCount: 5,
        deletedAt: null,
      });

      const req = createRequest('DELETE', 'test-collection', {});
      const res = await deleteItems(req, { params: Promise.resolve({ slug: 'test-collection' }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('reviewIds erforderlich');
    });
  });
});