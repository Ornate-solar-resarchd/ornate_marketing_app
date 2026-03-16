import { Router } from "express";
import { createClerkClient } from "@clerk/backend";
import { requirePermission } from "../middleware/rbac";
import { prisma } from "../lib/prisma";
import { deleteFromS3 } from "../services/s3.service";
import { CreateCompanySchema, ROLES } from "@ornate/types";
import { logger } from "../lib/logger";

const router = Router();
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// GET /api/admin/users — List all users with roles
router.get(
  "/admin/users",
  requirePermission("manage_users"),
  async (_req, res) => {
    try {
      const users = await clerkClient.users.getUserList({ limit: 100 });
      const mapped = users.data.map((u) => ({
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress || "",
        firstName: u.firstName,
        lastName: u.lastName,
        imageUrl: u.imageUrl,
        role: (u.publicMetadata?.role as string) || "viewer",
        createdAt: u.createdAt,
      }));
      res.json(mapped);
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

      await clerkClient.users.updateUserMetadata(req.params.id, {
        publicMetadata: { role },
      });

      res.json({ message: "Role updated", userId: req.params.id, role });
    } catch (error) {
      logger.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update role", code: "UPDATE_ERROR" });
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
        where: { id: req.params.id },
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
      const documents = await prisma.document.findMany({
        where: { companyId: req.params.id },
        select: { fileKey: true },
      });

      await Promise.all(documents.map((doc) => deleteFromS3(doc.fileKey)));

      await prisma.company.delete({ where: { id: req.params.id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: "delete",
          companyId: req.params.id,
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
