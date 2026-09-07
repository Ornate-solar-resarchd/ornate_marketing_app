import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadDocument,
  deleteDocument,
  generateShareLink,
  getSharedDocument,
  getDocumentsByCompany,
  getDocumentViewUrl,
  moveDocuments,
} from "../../services/document.service";
import { prisma } from "../../lib/prisma";
import * as s3Service from "../../services/s3.service";

// `deep` types the nested delegate methods (document.findMany, $transaction, …)
// as mocks. Without it every `mockResolvedValue` in this file is a type error.
const mockPrisma = vi.mocked(prisma, { deep: true });
const mockS3 = vi.mocked(s3Service);

const mockDocument = {
  id: "doc_1",
  name: "test-file",
  originalName: "test-file.pdf",
  fileKey: "company_1/brochure/mock-uuid-test-file.pdf",
  fileUrl: "https://s3.amazonaws.com/mock-url",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  docType: "brochure",
  companyId: "company_1",
  uploadedBy: "user_1",
  uploaderName: "Test User",
  shareToken: null,
  shareExpiry: null,
  description: "",
  tags: [],
  version: 1,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Document Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadDocument()", () => {
    it("should upload file to S3 and create DB record", async () => {
      mockPrisma.document.create.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const result = await uploadDocument({
        buffer: Buffer.from("test"),
        originalName: "test-file.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        companyId: "company_1",
        docType: "brochure",
        uploadedBy: "user_1",
        uploaderName: "Test User",
      });

      expect(mockS3.generateS3Key).toHaveBeenCalledWith(
        "company_1",
        "brochure",
        "test-file.pdf"
      );
      expect(mockS3.uploadToS3).toHaveBeenCalled();
      expect(mockPrisma.document.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "upload",
            userId: "user_1",
          }),
        })
      );
      expect(result).toEqual(mockDocument);
    });

    it("should strip file extension from document name", async () => {
      mockPrisma.document.create.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      await uploadDocument({
        buffer: Buffer.from("test"),
        originalName: "my-report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        companyId: "company_1",
        docType: "brochure",
        uploadedBy: "user_1",
        uploaderName: "Test User",
      });

      expect(mockPrisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "my-report",
          }),
        })
      );
    });
  });

  describe("deleteDocument()", () => {
    it("should delete document if user is the uploader", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockPrisma.document.delete.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const result = await deleteDocument("doc_1", "user_1", "manager");

      expect(mockS3.deleteFromS3).toHaveBeenCalledWith(mockDocument.fileKey);
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({
        where: { id: "doc_1" },
      });
      expect(result).toEqual(mockDocument);
    });

    it("should delete document if user is super_admin (even if not uploader)", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockPrisma.document.delete.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const result = await deleteDocument("doc_1", "other_user", "super_admin");

      expect(mockPrisma.document.delete).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it("should delete document if user is admin (even if not uploader)", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockPrisma.document.delete.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const result = await deleteDocument("doc_1", "other_user", "admin");

      expect(mockPrisma.document.delete).toHaveBeenCalled();
      expect(result).toEqual(mockDocument);
    });

    it("should throw error if document not found", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(
        deleteDocument("nonexistent", "user_1", "admin")
      ).rejects.toThrow("Document not found");
    });

    it("should throw error if manager tries to delete another user's document", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);

      await expect(
        deleteDocument("doc_1", "other_user", "manager")
      ).rejects.toThrow("Cannot delete documents uploaded by other users");
    });

    it("should create audit log entry after deletion", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockPrisma.document.delete.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      await deleteDocument("doc_1", "user_1", "admin");

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "delete",
            docId: "doc_1",
          }),
        })
      );
    });
  });

  describe("generateShareLink()", () => {
    it("should generate share token and update document", async () => {
      const updatedDoc = {
        ...mockDocument,
        shareToken: "mock-uuid-1234",
        companyId: "company_1",
      };
      mockPrisma.document.update.mockResolvedValue(updatedDoc);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const result = await generateShareLink("doc_1", "user_1");

      expect(mockPrisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "doc_1" },
          data: expect.objectContaining({
            shareToken: "mock-uuid-1234",
          }),
        })
      );
      expect(result.shareUrl).toContain("/share/mock-uuid-1234");
      expect(result.shareToken).toBe("mock-uuid-1234");
      expect(result.expiresAt).toBeDefined();
    });

    it("should set expiry to 24 hours from now", async () => {
      mockPrisma.document.update.mockResolvedValue({
        ...mockDocument,
        companyId: "company_1",
      });
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const before = Date.now();
      const result = await generateShareLink("doc_1", "user_1");
      const after = Date.now();

      const expiryTime = new Date(result.expiresAt).getTime();
      const expectedMin = before + 24 * 60 * 60 * 1000;
      const expectedMax = after + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThanOrEqual(expectedMin - 100);
      expect(expiryTime).toBeLessThanOrEqual(expectedMax + 100);
    });
  });

  describe("getSharedDocument()", () => {
    it("should return signed URL for valid share token", async () => {
      const sharedDoc = {
        ...mockDocument,
        shareToken: "valid-token",
        shareExpiry: new Date(Date.now() + 86400000),
        company: {
          id: "company_1",
          slug: "bess",
          label: "UnityESS",
          logoUrl: "https://example.com/logo.png",
          category: { id: "cat_1", label: "Ornate Products", slug: "ornate-products" },
        },
      };
      mockPrisma.document.findUnique.mockResolvedValue(sharedDoc as never);

      const result = await getSharedDocument("valid-token");

      expect(result.signedUrl).toBeDefined();
      expect(result.document).toBeDefined();
      expect(mockS3.getSignedViewUrl).toHaveBeenCalledWith(
        mockDocument.fileKey,
        86400
      );
    });

    it("should throw error for invalid token", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(getSharedDocument("invalid-token")).rejects.toThrow(
        "Share link not found"
      );
    });

    it("should throw error for expired token", async () => {
      const expiredDoc = {
        ...mockDocument,
        shareToken: "expired-token",
        shareExpiry: new Date(Date.now() - 86400000), // 24h ago
      };
      mockPrisma.document.findUnique.mockResolvedValue(expiredDoc as never);

      await expect(getSharedDocument("expired-token")).rejects.toThrow(
        "Share link has expired"
      );
    });
  });

  describe("getDocumentsByCompany()", () => {
    it("should return documents grouped by docType", async () => {
      const docs = [
        { ...mockDocument, id: "doc_1", docType: "brochure" },
        { ...mockDocument, id: "doc_2", docType: "brochure" },
        { ...mockDocument, id: "doc_3", docType: "datasheet" },
      ];
      mockPrisma.document.findMany.mockResolvedValue(docs);

      const result = await getDocumentsByCompany("company_1");

      expect(result.brochure).toHaveLength(2);
      expect(result.datasheet).toHaveLength(1);
    });

    it("should return empty object for company with no documents", async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await getDocumentsByCompany("company_1");

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe("moveDocuments()", () => {
    const targetCompany = {
      id: "company_2",
      slug: "hopewind",
      label: "Hopewind",
      icon: "🔋",
      color: "#10B981",
      logoUrl: "logo.png",
      websiteUrl: "https://hopewind.com",
      docTypes: ["brochure", "datasheet"],
      categoryId: "cat_1",
      subCategoryId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // $transaction receives a callback and must run it against a client; hand
    // it the same mocked prisma so assertions can inspect updateMany/createMany.
    const runTransaction = () => {
      mockPrisma.$transaction.mockImplementation(
        async (cb: unknown) => (cb as (tx: unknown) => Promise<unknown>)(mockPrisma)
      );
      mockPrisma.document.updateMany.mockResolvedValue({ count: 1 } as never);
      mockPrisma.auditLog.createMany.mockResolvedValue({ count: 1 } as never);
    };

    it("moves every selected document to the target section", async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...mockDocument, id: "doc_1" },
        { ...mockDocument, id: "doc_2" },
      ]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1", "doc_2"],
        { docType: "datasheet" },
        "user_1",
        "manager"
      );

      expect(result.moved).toEqual(["doc_1", "doc_2"]);
      expect(result.skipped).toHaveLength(0);
      expect(mockPrisma.document.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["doc_1", "doc_2"] } },
        data: { companyId: "company_1", docType: "datasheet" },
      });
    });

    it("writes one audit row per moved document", async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...mockDocument, id: "doc_1" },
        { ...mockDocument, id: "doc_2" },
      ]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      await moveDocuments(["doc_1", "doc_2"], { docType: "datasheet" }, "user_1", "manager");

      const auditArg = mockPrisma.auditLog.createMany.mock.calls[0]![0] as {
        data: Array<{ docId: string; action: string }>;
      };
      expect(auditArg.data).toHaveLength(2);
      expect(auditArg.data.map((d) => d.docId)).toEqual(["doc_1", "doc_2"]);
      expect(auditArg.data.every((d) => d.action === "move")).toBe(true);
    });

    it("skips other users' files for a non-admin but still moves their own", async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...mockDocument, id: "doc_1", uploadedBy: "user_1" },
        { ...mockDocument, id: "doc_2", uploadedBy: "someone_else" },
      ]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1", "doc_2"],
        { docType: "datasheet" },
        "user_1",
        "manager"
      );

      expect(result.moved).toEqual(["doc_1"]);
      expect(result.skipped).toEqual([
        { id: "doc_2", name: mockDocument.name, reason: "Uploaded by someone else" },
      ]);
    });

    it("lets an admin move files uploaded by others", async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...mockDocument, id: "doc_1", uploadedBy: "someone_else" },
      ]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1"],
        { docType: "datasheet" },
        "admin_user",
        "admin"
      );

      expect(result.moved).toEqual(["doc_1"]);
      expect(result.skipped).toHaveLength(0);
    });

    it("reports ids that no longer exist instead of failing the batch", async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ ...mockDocument, id: "doc_1" }]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1", "doc_missing"],
        { docType: "datasheet" },
        "user_1",
        "manager"
      );

      expect(result.moved).toEqual(["doc_1"]);
      expect(result.skipped).toContainEqual({
        id: "doc_missing",
        name: null,
        reason: "Document not found",
      });
    });

    it("skips documents already in the destination", async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...mockDocument, id: "doc_1", docType: "datasheet" },
        { ...mockDocument, id: "doc_2", docType: "brochure" },
      ]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1", "doc_2"],
        { docType: "datasheet" },
        "user_1",
        "manager"
      );

      expect(result.moved).toEqual(["doc_2"]);
      expect(result.skipped).toEqual([
        { id: "doc_1", name: mockDocument.name, reason: "Already in that location" },
      ]);
    });

    it("never touches the database when nothing is movable", async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { ...mockDocument, id: "doc_1", docType: "datasheet" },
      ]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1"],
        { docType: "datasheet" },
        "user_1",
        "manager"
      );

      expect(result.moved).toHaveLength(0);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.document.updateMany).not.toHaveBeenCalled();
    });

    it("rejects a section the target company does not have", async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ ...mockDocument, id: "doc_1" }]);
      mockPrisma.company.findMany.mockResolvedValue([targetCompany]);

      await expect(
        moveDocuments(
          ["doc_1"],
          { companyId: "company_2", docType: "warranty" },
          "user_1",
          "manager"
        )
      ).rejects.toThrow("That section does not exist in the target company");
    });

    it("rejects an unknown target company", async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ ...mockDocument, id: "doc_1" }]);
      mockPrisma.company.findMany.mockResolvedValue([]);

      await expect(
        moveDocuments(["doc_1"], { companyId: "nope" }, "user_1", "manager")
      ).rejects.toThrow("Target company not found");
    });

    it("rejects an empty selection", async () => {
      await expect(
        moveDocuments([], { docType: "datasheet" }, "user_1", "manager")
      ).rejects.toThrow("No documents selected");
    });

    it("deduplicates repeated ids so a file moves once", async () => {
      mockPrisma.document.findMany.mockResolvedValue([{ ...mockDocument, id: "doc_1" }]);
      mockPrisma.company.findMany.mockResolvedValue([
        { ...targetCompany, id: "company_1" },
      ]);
      runTransaction();

      const result = await moveDocuments(
        ["doc_1", "doc_1", "doc_1"],
        { docType: "datasheet" },
        "user_1",
        "manager"
      );

      expect(result.moved).toEqual(["doc_1"]);
    });
  });

  describe("getDocumentViewUrl()", () => {
    it("should return signed URL and create audit log", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockPrisma.auditLog.create.mockResolvedValue({} as never);

      const result = await getDocumentViewUrl("doc_1", "user_1");

      expect(result.signedUrl).toBeDefined();
      expect(result.document).toEqual(mockDocument);
      expect(mockS3.getSignedViewUrl).toHaveBeenCalledWith(
        mockDocument.fileKey,
        3600
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "download",
            userId: "user_1",
          }),
        })
      );
    });

    it("should throw error if document not found", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(getDocumentViewUrl("nonexistent", "user_1")).rejects.toThrow(
        "Document not found"
      );
    });
  });
});
