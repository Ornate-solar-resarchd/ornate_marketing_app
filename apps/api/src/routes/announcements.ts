import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../middleware/rbac";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const router: Router = Router();

const CreateSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  type: z.enum(["news", "update", "alert"]).default("news"),
  isPinned: z.boolean().default(false),
});

const UpdateSchema = CreateSchema.partial();

// GET /api/announcements — all active, pinned first (all authenticated users)
router.get("/announcements", async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
    res.json(announcements);
  } catch (error) {
    logger.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements", code: "FETCH_ERROR" });
  }
});

// POST /api/announcements — create (admin+)
router.post(
  "/announcements",
  requirePermission("manage_companies"),
  async (req, res) => {
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

      const announcement = await prisma.announcement.create({
        data: {
          ...parsed.data,
          authorId: req.user!.userId,
          authorName: author?.fullName || req.user!.email,
        },
      });
      res.status(201).json(announcement);
    } catch (error) {
      logger.error("Error creating announcement:", error);
      res.status(500).json({ error: "Failed to create announcement", code: "CREATE_ERROR" });
    }
  }
);

// PATCH /api/announcements/:id — edit (admin+)
router.patch(
  "/announcements/:id",
  requirePermission("manage_companies"),
  async (req, res) => {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      return;
    }

    try {
      const announcement = await prisma.announcement.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      res.json(announcement);
    } catch (error) {
      logger.error("Error updating announcement:", error);
      res.status(500).json({ error: "Failed to update announcement", code: "UPDATE_ERROR" });
    }
  }
);

// DELETE /api/announcements/:id — soft-delete (admin+)
router.delete(
  "/announcements/:id",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      await prisma.announcement.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting announcement:", error);
      res.status(500).json({ error: "Failed to delete announcement", code: "DELETE_ERROR" });
    }
  }
);

export default router;
