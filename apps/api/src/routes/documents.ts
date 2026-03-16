import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requirePermission } from "../middleware/rbac";
import {
  getDocumentsByCompany,
  getDocumentViewUrl,
  deleteDocument,
} from "../services/document.service";
import { logger } from "../lib/logger";

const router = Router();

router.get("/companies/:id/documents", async (req, res) => {
  try {
    const grouped = await getDocumentsByCompany(req.params.id);
    res.json(grouped);
  } catch (error) {
    logger.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents", code: "FETCH_ERROR" });
  }
});

router.get("/companies/:id/documents/:docType", async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        companyId: req.params.id,
        docType: req.params.docType,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(documents);
  } catch (error) {
    logger.error("Error fetching documents by type:", error);
    res.status(500).json({ error: "Failed to fetch documents", code: "FETCH_ERROR" });
  }
});

router.post("/documents/:id/view-url", async (req, res) => {
  try {
    const result = await getDocumentViewUrl(req.params.id, req.user!.userId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error generating view URL:", error);
    res.status(message === "Document not found" ? 404 : 500).json({
      error: message,
      code: message === "Document not found" ? "NOT_FOUND" : "FETCH_ERROR",
    });
  }
});

router.delete(
  "/documents/:id",
  requirePermission("delete_own"),
  async (req, res) => {
    try {
      const result = await deleteDocument(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      res.json({ message: "Document deleted", document: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error deleting document:", error);
      const status =
        message === "Document not found"
          ? 404
          : message.includes("Cannot delete")
            ? 403
            : 500;
      res.status(status).json({ error: message, code: "DELETE_ERROR" });
    }
  }
);

export default router;
