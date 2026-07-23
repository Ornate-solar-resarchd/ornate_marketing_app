import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requirePermission } from "../middleware/rbac";
import {
  getDocumentsByCompany,
  getDocumentViewUrl,
  deleteDocument,
  renameDocument,
  moveDocument,
} from "../services/document.service";
import { logger } from "../lib/logger";

const router: Router = Router();

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

// GET /documents/:id/versions — get all versions of a document
router.get("/documents/:id/versions", async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) {
      res.status(404).json({ error: "Document not found", code: "NOT_FOUND" });
      return;
    }

    // Find the root parent
    const rootId = doc.parentId || doc.id;

    const versions = await prisma.document.findMany({
      where: {
        OR: [
          { id: rootId },
          { parentId: rootId },
        ],
      },
      orderBy: { version: "desc" },
      select: {
        id: true,
        name: true,
        originalName: true,
        version: true,
        sizeBytes: true,
        mimeType: true,
        createdAt: true,
        uploadedBy: true,
        uploaderName: true,
      },
    });

    res.json(versions);
  } catch (error) {
    logger.error("Error fetching versions:", error);
    res.status(500).json({ error: "Failed to fetch versions", code: "FETCH_ERROR" });
  }
});

// PATCH /documents/:id/rename — change a document's display name
router.patch(
  "/documents/:id/rename",
  requirePermission("upload"),
  async (req, res) => {
    try {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      if (!name) {
        res.status(400).json({ error: "Name is required", code: "VALIDATION_ERROR" });
        return;
      }
      const document = await renameDocument(
        req.params.id as string,
        name,
        req.user!.userId,
        req.user!.role
      );
      res.json({ message: "Document renamed", document });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error renaming document:", error);
      const status =
        message === "Document not found" ? 404 : message.includes("Cannot rename") ? 403 : 500;
      res.status(status).json({ error: message, code: "RENAME_ERROR" });
    }
  }
);

// PATCH /documents/:id/move — move to a different company and/or section
router.patch(
  "/documents/:id/move",
  requirePermission("upload"),
  async (req, res) => {
    try {
      const companyId = typeof req.body?.companyId === "string" ? req.body.companyId : undefined;
      const docType = typeof req.body?.docType === "string" ? req.body.docType : undefined;
      const document = await moveDocument(
        req.params.id as string,
        { companyId, docType },
        req.user!.userId,
        req.user!.role
      );
      res.json({ message: "Document moved", document });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error moving document:", error);
      const status = message.includes("not found")
        ? 404
        : message.includes("Cannot move")
          ? 403
          : message.includes("section does not exist")
            ? 400
            : 500;
      res.status(status).json({ error: message, code: "MOVE_ERROR" });
    }
  }
);

router.delete(
  "/documents/:id",
  requirePermission("delete_own"),
  async (req, res) => {
    try {
      const result = await deleteDocument(
        req.params.id as string,
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
