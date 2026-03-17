import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { upload } from "../middleware/upload";
import { uploadDocument } from "../services/document.service";
import { DOC_TYPES, type DocTypeKey } from "@ornate/types";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import rateLimit from "express-rate-limit";

const router: Router = Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.userId || req.ip || "anonymous",
  message: { error: "Too many uploads. Please try again later.", code: "RATE_LIMITED" },
});

// POST /api/upload
router.post(
  "/upload",
  uploadLimiter,
  requirePermission("upload"),
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { companyId, docType } = req.body;

      if (!companyId || !docType) {
        res.status(400).json({
          error: "companyId and docType are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (!(docType in DOC_TYPES)) {
        res.status(400).json({
          error: "Invalid document type",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        res.status(404).json({ error: "Company not found", code: "NOT_FOUND" });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          error: "No files provided",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const acceptedExts = DOC_TYPES[docType as DocTypeKey].accept.split(",");
      for (const file of files) {
        const ext = "." + file.originalname.split(".").pop()?.toLowerCase();
        if (!acceptedExts.includes(ext)) {
          res.status(400).json({
            error: `File type ${ext} is not accepted for ${docType}. Accepted: ${acceptedExts.join(", ")}`,
            code: "VALIDATION_ERROR",
          });
          return;
        }
      }

      const uploaderName = req.user!.userId;

      const results = await Promise.all(
        files.map((file) =>
          uploadDocument({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            companyId,
            docType,
            uploadedBy: req.user!.userId,
            uploaderName,
          })
        )
      );

      res.status(201).json({ documents: results });
    } catch (error) {
      logger.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed", code: "UPLOAD_ERROR" });
    }
  }
);

export default router;
