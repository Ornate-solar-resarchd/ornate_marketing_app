import { Router } from "express";
import bcrypt from "bcryptjs";
import { requirePermission } from "../middleware/rbac";
import { prisma } from "../lib/prisma";
import { deleteFromS3 } from "../services/s3.service";
import { CreateCompanySchema, ROLES } from "@ornate/types";
import { logger } from "../lib/logger";
import { backfillUntagged, autoTagDocument } from "../services/auto-tagger.service";

const router: Router = Router();

// GET /api/admin/users — List all users with roles
router.get(
  "/admin/users",
  requirePermission("manage_users"),
  async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
      res.json(users);
    } catch (error) {
      logger.error("Error listing users:", error);
      res.status(500).json({ error: "Failed to list users", code: "FETCH_ERROR" });
    }
  }
);

// PATCH /api/admin/users/:id/role — Update user role
router.patch(
  "/admin/users/:id/role",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const { role } = req.body;
      if (!role || !ROLES.includes(role)) {
        res.status(400).json({
          error: `Invalid role. Must be one of: ${ROLES.join(", ")}`,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const userId = req.params.id as string;
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, role: true },
      });

      res.json({ message: "Role updated", userId: user.id, role: user.role });
    } catch (error) {
      logger.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update role", code: "UPDATE_ERROR" });
    }
  }
);

// POST /api/admin/users — Create a new user (admin only)
router.post(
  "/admin/users",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      if (!email || !password || !fullName) {
        res.status(400).json({
          error: "email, password, fullName are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }
      if (role && !ROLES.includes(role)) {
        res.status(400).json({
          error: `Invalid role. Must be one of: ${ROLES.join(", ")}`,
          code: "VALIDATION_ERROR",
        });
        return;
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          fullName,
          role: role || "viewer",
        },
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
      });
      res.status(201).json(user);
    } catch (error: any) {
      if (error?.code === "P2002") {
        res.status(409).json({ error: "Email already exists", code: "CONFLICT" });
        return;
      }
      logger.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user", code: "CREATE_ERROR" });
    }
  }
);

// DELETE /api/admin/users/:id — Deactivate user (soft delete)
router.delete(
  "/admin/users/:id",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      await prisma.user.update({
        where: { id: req.params.id as string },
        data: { isActive: false },
      });
      res.json({ message: "User deactivated" });
    } catch (error) {
      logger.error("Error deactivating user:", error);
      res.status(500).json({ error: "Failed to deactivate user", code: "DELETE_ERROR" });
    }
  }
);

// POST /api/admin/companies — Create new company
router.post(
  "/admin/companies",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      const parsed = CreateCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.errors.map((e) => e.message).join(", "),
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const company = await prisma.company.create({ data: parsed.data });
      res.status(201).json(company);
    } catch (error) {
      logger.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company", code: "CREATE_ERROR" });
    }
  }
);

// PATCH /api/admin/companies/:id — Edit company
router.patch(
  "/admin/companies/:id",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      const company = await prisma.company.update({
        where: { id: req.params.id as string },
        data: req.body,
      });
      res.json(company);
    } catch (error) {
      logger.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company", code: "UPDATE_ERROR" });
    }
  }
);

// DELETE /api/admin/companies/:id — Delete company + all docs from S3 + DB
router.delete(
  "/admin/companies/:id",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      const companyId = req.params.id as string;
      const documents = await prisma.document.findMany({
        where: { companyId },
        select: { fileKey: true },
      });

      await Promise.all(documents.map((doc) => deleteFromS3(doc.fileKey)));

      await prisma.company.delete({ where: { id: companyId } });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: "delete",
          companyId,
          meta: { type: "company", filesDeleted: documents.length },
        },
      });

      res.json({ message: "Company and all associated files deleted" });
    } catch (error) {
      logger.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company", code: "DELETE_ERROR" });
    }
  }
);

// ─── Sub-Categories CRUD ──────────────────────────────────────────────

// POST /api/admin/subcategories — Create new sub-category
router.post(
  "/admin/subcategories",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      const { slug, label, icon, order, categoryId } = req.body as {
        slug?: string;
        label?: string;
        icon?: string;
        order?: number;
        categoryId?: string;
      };

      if (!slug || !label || !categoryId) {
        res.status(400).json({
          error: "slug, label and categoryId are required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const subCategory = await prisma.subCategory.create({
        data: {
          slug,
          label,
          icon: icon || "📦",
          order: order ?? 0,
          categoryId,
        },
      });
      res.status(201).json(subCategory);
    } catch (error) {
      logger.error("Error creating sub-category:", error);
      res.status(500).json({ error: "Failed to create sub-category", code: "CREATE_ERROR" });
    }
  }
);

// PATCH /api/admin/subcategories/:id — Edit sub-category
router.patch(
  "/admin/subcategories/:id",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      const sc = await prisma.subCategory.update({
        where: { id: req.params.id as string },
        data: req.body,
      });
      res.json(sc);
    } catch (error) {
      logger.error("Error updating sub-category:", error);
      res.status(500).json({ error: "Failed to update sub-category", code: "UPDATE_ERROR" });
    }
  }
);

// DELETE /api/admin/subcategories/:id — Delete sub-category (companies stay, just unlinked)
router.delete(
  "/admin/subcategories/:id",
  requirePermission("manage_companies"),
  async (req, res) => {
    try {
      await prisma.subCategory.delete({ where: { id: req.params.id as string } });
      res.json({ message: "Sub-category deleted (companies preserved without sub-category)" });
    } catch (error) {
      logger.error("Error deleting sub-category:", error);
      res.status(500).json({ error: "Failed to delete sub-category", code: "DELETE_ERROR" });
    }
  }
);

// GET /api/admin/audit-logs — Recent audit logs
router.get(
  "/admin/audit-logs",
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      res.json(logs);
    } catch (error) {
      logger.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs", code: "FETCH_ERROR" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────
// Auto-tagger admin endpoints — drive the local Qwen3 model.
// POST /admin/tags/backfill?limit=50  → tag N untagged docs (default 50)
// POST /admin/tags/retag/:documentId  → re-tag one doc (overwrites existing)
// ─────────────────────────────────────────────────────────────────────

router.post(
  "/admin/tags/backfill",
  requirePermission("manage_companies"),
  async (req, res) => {
    const limit = Math.min(
      500,
      Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50),
    );
    logger.info(`Auto-tagger backfill requested (limit=${limit})`);
    // Run in background so the HTTP request returns immediately — backfilling
    // 500 docs at ~2s each would otherwise time out the client.
    res.status(202).json({
      message: `Backfill of up to ${limit} untagged documents started in background. Check logs / DB for progress.`,
    });
    backfillUntagged(limit)
      .then((r) => logger.info(`Backfill done: ${r.tagged}/${r.processed} tagged`))
      .catch((err) => logger.warn("Backfill error:", err));
  },
);

router.post(
  "/admin/tags/retag/:documentId",
  requirePermission("manage_companies"),
  async (req, res) => {
    const id = req.params.documentId;
    if (!id) {
      res.status(400).json({ error: "documentId required" });
      return;
    }
    try {
      await autoTagDocument(id);
      const fresh = await prisma.document.findUnique({
        where: { id },
        select: { id: true, name: true, tags: true },
      });
      res.json(fresh);
    } catch (err) {
      logger.warn(`Retag failed for ${id}:`, err);
      res.status(500).json({ error: "Retag failed" });
    }
  },
);

export default router;
