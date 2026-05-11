import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { upload } from "../middleware/upload";
import { uploadDocument, registerDocument } from "../services/document.service";
import { generateS3Key, getSignedPutUrl } from "../services/s3.service";
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

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

// POST /api/upload
router.post(
  "/upload",
  uploadLimiter,
  requirePermission("upload"),
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { companyId, docType, customName, tags: tagsRaw } = req.body;
      const tags: string[] = tagsRaw ? (typeof tagsRaw === "string" ? JSON.parse(tagsRaw) : tagsRaw) : [];

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
        files.map((file, index) =>
          uploadDocument({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            companyId,
            docType,
            uploadedBy: req.user!.userId,
            uploaderName,
            customName: files.length === 1 && customName ? customName : undefined,
            tags,
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

// POST /api/upload/presign — issue a short-lived presigned PUT URL
router.post(
  "/upload/presign",
  uploadLimiter,
  requirePermission("upload"),
  async (req, res) => {
    try {
      const { companyId, docType, filename, mimeType, sizeBytes } = req.body as {
        companyId?: string;
        docType?: string;
        filename?: string;
        mimeType?: string;
        sizeBytes?: number;
      };

      if (!companyId || !docType || !filename || !mimeType) {
        res.status(400).json({
          error: "companyId, docType, filename, mimeType are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (!(docType in DOC_TYPES)) {
        res.status(400).json({ error: "Invalid document type", code: "VALIDATION_ERROR" });
        return;
      }

      const acceptedExts = DOC_TYPES[docType as DocTypeKey].accept.split(",");
      const ext = "." + filename.split(".").pop()?.toLowerCase();
      if (!acceptedExts.includes(ext)) {
        res.status(400).json({
          error: `File type ${ext} is not accepted for ${docType}. Accepted: ${acceptedExts.join(", ")}`,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (typeof sizeBytes === "number" && sizeBytes > MAX_UPLOAD_BYTES) {
        res.status(413).json({
          error: `File too large. Max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
          code: "FILE_TOO_LARGE",
        });
        return;
      }

      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        res.status(404).json({ error: "Company not found", code: "NOT_FOUND" });
        return;
      }

      const fileKey = generateS3Key(companyId, docType, filename);
      const expiresIn = 300; // 5 min
      const putUrl = await getSignedPutUrl(fileKey, mimeType, expiresIn);

      res.json({ putUrl, fileKey, expiresIn });
    } catch (error) {
      logger.error("Presign error:", error);
      res.status(500).json({ error: "Presign failed", code: "PRESIGN_ERROR" });
    }
  }
);

// POST /api/upload/complete — register an already-uploaded object as a Document
router.post(
  "/upload/complete",
  uploadLimiter,
  requirePermission("upload"),
  async (req, res) => {
    try {
      const {
        companyId,
        docType,
        fileKey,
        originalName,
        mimeType,
        sizeBytes,
        customName,
        tags,
      } = req.body as {
        companyId?: string;
        docType?: string;
        fileKey?: string;
        originalName?: string;
        mimeType?: string;
        sizeBytes?: number;
        customName?: string;
        tags?: string[];
      };

      if (!companyId || !docType || !fileKey || !originalName || !mimeType || typeof sizeBytes !== "number") {
        res.status(400).json({ error: "Missing required fields", code: "VALIDATION_ERROR" });
        return;
      }

      if (!(docType in DOC_TYPES)) {
        res.status(400).json({ error: "Invalid document type", code: "VALIDATION_ERROR" });
        return;
      }

      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        res.status(404).json({ error: "Company not found", code: "NOT_FOUND" });
        return;
      }

      const document = await registerDocument({
        fileKey,
        originalName,
        mimeType,
        sizeBytes,
        companyId,
        docType,
        uploadedBy: req.user!.userId,
        uploaderName: req.user!.userId,
        customName,
        tags,
      });

      res.status(201).json({ document });
    } catch (error) {
      logger.error("Upload complete error:", error);
      res.status(500).json({ error: "Registration failed", code: "REGISTER_ERROR" });
    }
  }
);

// POST /api/upload/gdrive — import files from Google Drive via the Apps Script fetcher
router.post(
  "/upload/gdrive",
  uploadLimiter,
  requirePermission("upload"),
  async (req, res) => {
    try {
      const { companyId, docType, files: gdriveFiles, customName, tags } = req.body as {
        companyId?: string;
        docType?: string;
        files?: Array<{ id: string; name: string; mimeType: string }>;
        customName?: string;
        tags?: string[];
      };

      if (!companyId || !docType || !gdriveFiles || gdriveFiles.length === 0) {
        res.status(400).json({ error: "companyId, docType, and files are required", code: "VALIDATION_ERROR" });
        return;
      }

      if (!(docType in DOC_TYPES)) {
        res.status(400).json({ error: "Invalid document type", code: "VALIDATION_ERROR" });
        return;
      }

      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        res.status(404).json({ error: "Company not found", code: "NOT_FOUND" });
        return;
      }

      const fetcherUrl = process.env.GDRIVE_FETCHER_URL;
      if (!fetcherUrl) {
        res.status(500).json({ error: "GDRIVE_FETCHER_URL not configured", code: "CONFIG_ERROR" });
        return;
      }

      const results = await Promise.all(
        gdriveFiles.map(async (gf) => {
          // Call Apps Script download endpoint - expects { success, name, mimeType, data (base64) }
          const downloadRes = await fetch(`${fetcherUrl}?action=download&id=${encodeURIComponent(gf.id)}`);
          if (!downloadRes.ok) throw new Error(`Failed to download ${gf.name}`);
          const payload = await downloadRes.json() as { success: boolean; data?: string; mimeType?: string; name?: string; error?: string };
          if (!payload.success || !payload.data) {
            throw new Error(payload.error || `Download failed for ${gf.name}`);
          }
          const buffer = Buffer.from(payload.data, "base64");
          return uploadDocument({
            buffer,
            originalName: payload.name || gf.name,
            mimeType: payload.mimeType || gf.mimeType,
            sizeBytes: buffer.length,
            companyId,
            docType,
            uploadedBy: req.user!.userId,
            uploaderName: req.user!.userId,
            customName: gdriveFiles.length === 1 && customName ? customName : undefined,
            tags: tags || [],
          });
        })
      );

      res.status(201).json({ documents: results });
    } catch (error) {
      logger.error("GDrive import error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "GDrive import failed", code: "GDRIVE_IMPORT_ERROR" });
    }
  }
);

export default router;
