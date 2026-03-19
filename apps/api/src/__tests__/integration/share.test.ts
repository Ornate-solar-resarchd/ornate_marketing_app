import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../index";
import { prisma } from "../../lib/prisma";
import * as s3Service from "../../services/s3.service";

const mockPrisma = vi.mocked(prisma);

const mockDocument = {
  id: "doc_1",
  name: "test-file",
  originalName: "test-file.pdf",
  fileKey: "company_1/brochure/uuid-test.pdf",
  fileUrl: "https://s3.amazonaws.com/mock",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  docType: "brochure",
  companyId: "company_1",
  uploadedBy: "user_1",
  uploaderName: "Test User",
  shareToken: "valid-share-token",
  shareExpiry: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  updatedAt: new Date(),
  company: {
    id: "company_1",
    slug: "bess",
    label: "UnityESS",
    logoUrl: "https://example.com/logo.png",
    websiteUrl: "https://example.com",
    icon: "⚡",
    color: "#006297",
    docTypes: ["brochure"],
    categoryId: "cat_1",
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: "cat_1",
      slug: "ornate-products",
      label: "Ornate Solar Products",
      icon: "☀️",
      order: 0,
      createdAt: new Date(),
    },
  },
};

describe("Share Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/share/:token (Public)", () => {
    it("should return signed URL for valid share token", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument as never);

      const res = await request(app).get("/api/share/valid-share-token");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("signedUrl");
      expect(res.body).toHaveProperty("document");
    });

    it("should return 404 for invalid token", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/share/invalid-token");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("code", "SHARE_ERROR");
    });

    it("should return 410 for expired token", async () => {
      const expiredDoc = {
        ...mockDocument,
        shareExpiry: new Date(Date.now() - 86400000),
      };
      mockPrisma.document.findUnique.mockResolvedValue(expiredDoc as never);

      const res = await request(app).get("/api/share/expired-token");

      expect(res.status).toBe(410);
      expect(res.body.error).toContain("expired");
    });
  });
});
