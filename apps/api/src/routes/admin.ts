import { Router } from "express";
import bcrypt from "bcryptjs";
import { requirePermission } from "../middleware/rbac";
import { prisma } from "../lib/prisma";
import { deleteFromS3 } from "../services/s3.service";
import { CreateCompanySchema, ROLES } from "@ornate/types";
import { logger } from "../lib/logger";

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

export default router;
