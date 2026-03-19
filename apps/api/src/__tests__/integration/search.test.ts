import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../index";
import { prisma } from "../../lib/prisma";

const mockPrisma = vi.mocked(prisma);

describe("Search Routes (Public)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/search", () => {
    it("should return results for valid query", async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const res = await request(app).get("/api/search?q=solar");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
    });

    it("should return 400 if query parameter q is missing", async () => {
      const res = await request(app).get("/api/search");

      expect(res.status).toBe(400);
    });

    it("should return empty results for no matches", async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const res = await request(app).get("/api/search?q=xyznonexistent");

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it("should accept filter parameters", async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const res = await request(app).get(
        "/api/search?q=solar&category=panels&docType=brochure&sortBy=name"
      );

      expect(res.status).toBe(200);
    });

    it("should accept pagination parameters", async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      const res = await request(app).get("/api/search?q=solar&page=2&limit=10");

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
    });
  });
});
