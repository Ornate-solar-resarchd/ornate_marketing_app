import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { getPublicUrl, getSignedViewUrl } from "../services/s3.service";

const router: Router = Router();

const DocItemSchema = z.object({
  documentId: z.string().min(1),
  docName: z.string().min(1).max(200),
  companyLabel: z.string().min(1).max(100),
  docType: z.string().min(1),
  mimeType: z.string().default(""),
  position: z.number().int().min(0).default(0),
});

const CreateSchema = z.object({
  customerName: z.string().min(1).max(120),
  docs: z.array(DocItemSchema).min(1).max(10),
  expiryDays: z.number().int().min(1).max(90).default(7),
});

// POST /api/presentations — create bundle (authenticated)
router.post("/presentations", async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  try {
    const author = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsed.data.expiryDays);

    const presentation = await prisma.presentation.create({
      data: {
        token: uuidv4(),
        customerName: parsed.data.customerName,
        createdById: req.user!.userId,
        createdByName: author?.fullName || req.user!.email,
        expiresAt,
        docs: {
          create: parsed.data.docs.map((d) => ({
            id: uuidv4(),
            documentId: d.documentId,
            docName: d.docName,
            companyLabel: d.companyLabel,
            docType: d.docType,
            mimeType: d.mimeType,
            position: d.position,
          })),
        },
      },
      include: { docs: true },
    });

    const shareUrl = `${process.env.FRONTEND_URL}/presentation/${presentation.token}`;
    res.status(201).json({ id: presentation.id, token: presentation.token, shareUrl, expiresAt });
  } catch (error) {
    logger.error("Error creating presentation:", error);
    res.status(500).json({ error: "Failed to create presentation", code: "CREATE_ERROR" });
  }
});

// GET /api/presentations/mine — list my presentations (authenticated)
router.get("/presentations/mine", async (req, res) => {
  try {
    const presentations = await prisma.presentation.findMany({
      where: { createdById: req.user!.userId, isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { docs: true } },
        docs: { orderBy: { position: "asc" }, take: 3, select: { docName: true, docType: true, companyLabel: true } },
      },
      take: 50,
    });
    res.json(presentations);
  } catch (error) {
    logger.error("Error fetching presentations:", error);
    res.status(500).json({ error: "Failed to fetch presentations", code: "FETCH_ERROR" });
  }
});

// DELETE /api/presentations/:id — soft-delete (authenticated, own only)
router.delete("/presentations/:id", async (req, res) => {
  try {
    const presentation = await prisma.presentation.findUnique({
      where: { id: req.params.id },
      select: { createdById: true },
    });
    if (!presentation) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }
    if (presentation.createdById !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    await prisma.presentation.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting presentation:", error);
    res.status(500).json({ error: "Failed to delete presentation", code: "DELETE_ERROR" });
  }
});

// GET /api/presentations/view/:token — public, no auth (also exported for direct registration)
export const presentationViewHandler = async (req: any, res: any) => {
  try {
    const presentation = await prisma.presentation.findUnique({
      where: { token: req.params.token },
      include: { docs: { orderBy: { position: "asc" } } },
    });

    if (!presentation || !presentation.isActive) {
      res.status(404).json({ error: "Presentation not found", code: "NOT_FOUND" });
      return;
    }

    if (new Date() > presentation.expiresAt) {
      res.status(410).json({ error: "Presentation has expired", code: "EXPIRED" });
      return;
    }

    // Increment view count (fire and forget)
    prisma.presentation.update({
      where: { id: presentation.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    // Generate signed view URLs for each doc
    const docsWithUrls = await Promise.all(
      presentation.docs.map(async (doc) => {
        try {
          const dbDoc = await prisma.document.findUnique({
            where: { id: doc.documentId },
            select: { fileKey: true, mimeType: true, originalName: true },
          });
          if (!dbDoc) return { ...doc, viewUrl: null, downloadUrl: null };

          const viewUrl = getPublicUrl(dbDoc.fileKey);
          const downloadUrl = await getSignedViewUrl(dbDoc.fileKey, 3600, {
            filename: dbDoc.originalName,
            mimeType: dbDoc.mimeType,
            download: true,
          });
          return { ...doc, viewUrl, downloadUrl, mimeType: dbDoc.mimeType };
        } catch {
          return { ...doc, viewUrl: null, downloadUrl: null };
        }
      })
    );

    res.json({
      id: presentation.id,
      customerName: presentation.customerName,
      createdByName: presentation.createdByName,
      expiresAt: presentation.expiresAt,
      viewCount: presentation.viewCount,
      docs: docsWithUrls,
    });
  } catch (error) {
    logger.error("Error fetching presentation:", error);
    res.status(500).json({ error: "Failed to fetch presentation", code: "FETCH_ERROR" });
  }
};

export default router;
