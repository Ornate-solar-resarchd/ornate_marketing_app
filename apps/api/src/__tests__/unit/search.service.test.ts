import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchDocuments } from "../../services/search.service";
import { prisma } from "../../lib/prisma";

const mockPrisma = vi.mocked(prisma);

const mockDoc = (overrides = {}) => ({
  id: "doc_1",
  name: "Solar Panel Brochure",
  originalName: "solar-panel-brochure.pdf",
  fileKey: "company_1/brochure/uuid.pdf",
  fileUrl: "https://s3.amazonaws.com/mock",
  mimeType: "application/pdf",
  sizeBytes: 2048,
  docType: "brochure",
  companyId: "company_1",
  uploadedBy: "user_1",
  uploaderName: "Test User",
  shareToken: null,
  shareExpiry: null,
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
  ...overrides,
});

describe("Search Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return grouped results by company", async () => {
    const docs = [mockDoc(), mockDoc({ id: "doc_2", name: "Solar Datasheet" })];
    mockPrisma.document.findMany.mockResolvedValue(docs as never);
    mockPrisma.document.count.mockResolvedValue(2);

    const result = await searchDocuments({ q: "solar" });

    expect(result.results).toHaveLength(1); // 1 company group
    expect(result.results[0].documents).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  it("should highlight matching terms in document names", async () => {
    const docs = [mockDoc()];
    mockPrisma.document.findMany.mockResolvedValue(docs as never);
    mockPrisma.document.count.mockResolvedValue(1);

    const result = await searchDocuments({ q: "Solar" });

    expect(result.results[0].documents[0].highlight).toContain("<mark>");
    expect(result.results[0].documents[0].highlight).toContain("Solar");
  });

  it("should group results from multiple companies", async () => {
    const docs = [
      mockDoc(),
      mockDoc({
        id: "doc_2",
        companyId: "company_2",
        company: {
          ...mockDoc().company,
          id: "company_2",
          slug: "inroof",
          label: "Ornate Inroof",
        },
      }),
    ];
    mockPrisma.document.findMany.mockResolvedValue(docs as never);
    mockPrisma.document.count.mockResolvedValue(2);

    const result = await searchDocuments({ q: "solar" });

    expect(result.results).toHaveLength(2); // 2 company groups
  });

  it("should return empty results for no matches", async () => {
    mockPrisma.document.findMany.mockResolvedValue([]);
    mockPrisma.document.count.mockResolvedValue(0);

    const result = await searchDocuments({ q: "nonexistent" });

    expect(result.results).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should use default pagination (page 1, limit 30)", async () => {
    mockPrisma.document.findMany.mockResolvedValue([]);
    mockPrisma.document.count.mockResolvedValue(0);

    const result = await searchDocuments({ q: "test" });

    expect(result.page).toBe(1);
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 30,
      })
    );
  });

  it("should respect custom pagination", async () => {
    mockPrisma.document.findMany.mockResolvedValue([]);
    mockPrisma.document.count.mockResolvedValue(0);

    await searchDocuments({ q: "test", page: 3, limit: 10 });

    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
  });

  it("should include company info in results", async () => {
    const docs = [mockDoc()];
    mockPrisma.document.findMany.mockResolvedValue(docs as never);
    mockPrisma.document.count.mockResolvedValue(1);

    const result = await searchDocuments({ q: "solar" });

    const company = result.results[0].company;
    expect(company.id).toBe("company_1");
    expect(company.slug).toBe("bess");
    expect(company.label).toBe("UnityESS");
    expect(company.categorySlug).toBe("ornate-products");
    expect(company.categoryLabel).toBe("Ornate Solar Products");
  });
});
