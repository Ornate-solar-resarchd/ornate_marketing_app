import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../index";
import { prisma } from "../../lib/prisma";

const mockPrisma = vi.mocked(prisma);

const mockCategories = [
  {
    id: "cat_1",
    slug: "ornate-products",
    label: "Ornate Solar Products",
    icon: "☀️",
    order: 0,
    createdAt: new Date(),
    _count: { companies: 7 },
  },
  {
    id: "cat_2",
    slug: "panels",
    label: "Panels",
    icon: "🔆",
    order: 1,
    createdAt: new Date(),
    _count: { companies: 3 },
  },
];

const mockCategory = {
  id: "cat_1",
  slug: "ornate-products",
  label: "Ornate Solar Products",
  icon: "☀️",
  order: 0,
  createdAt: new Date(),
  companies: [
    {
      id: "comp_1",
      slug: "bess",
      label: "UnityESS",
      icon: "⚡",
      color: "#006297",
      logoUrl: "https://example.com/logo.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: ["brochure", "datasheet"],
      categoryId: "cat_1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

const mockCompany = {
  id: "comp_1",
  slug: "bess",
  label: "UnityESS",
  icon: "⚡",
  color: "#006297",
  logoUrl: "https://example.com/logo.png",
  websiteUrl: "https://ornatesolar.com",
  docTypes: ["brochure", "datasheet"],
  categoryId: "cat_1",
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: "cat_1", label: "Ornate Solar Products", slug: "ornate-products" },
  _count: { documents: 5 },
};

describe("Companies Routes (Public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/categories", () => {
    it("should return all categories with company counts", async () => {
      mockPrisma.category.findMany.mockResolvedValue(mockCategories as never);

      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("slug", "ornate-products");
      expect(res.body[0]._count.companies).toBe(7);
    });

    it("should return 500 on database error", async () => {
      mockPrisma.category.findMany.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("code", "FETCH_ERROR");
    });
  });

  describe("GET /api/categories/:slug", () => {
    it("should return category with companies", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory as never);

      const res = await request(app).get("/api/categories/ornate-products");

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("ornate-products");
      expect(res.body.companies).toHaveLength(1);
    });

    it("should return 404 for non-existent category", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/api/categories/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("GET /api/companies/:id", () => {
    it("should return company by ID", async () => {
      mockPrisma.company.findUnique.mockResolvedValueOnce(mockCompany as never);

      const res = await request(app).get("/api/companies/comp_1");

      expect(res.status).toBe(200);
      expect(res.body.label).toBe("UnityESS");
    });

    it("should fallback to slug lookup if ID not found", async () => {
      mockPrisma.company.findUnique
        .mockResolvedValueOnce(null) // ID lookup
        .mockResolvedValueOnce(mockCompany as never); // slug lookup

      const res = await request(app).get("/api/companies/bess");

      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("bess");
    });

    it("should return 404 if company not found by ID or slug", async () => {
      mockPrisma.company.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const res = await request(app).get("/api/companies/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("code", "NOT_FOUND");
    });
  });
});
