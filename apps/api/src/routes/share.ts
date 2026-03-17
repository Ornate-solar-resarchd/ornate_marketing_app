import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { authMiddleware } from "../middleware/auth";
import {
  generateShareLink,
  getSharedDocument,
} from "../services/document.service";
import { logger } from "../lib/logger";

const router: Router = Router();

router.post(
  "/documents/:id/share",
  authMiddleware,
  requirePermission("share"),
  async (req, res) => {
    try {
      const result = await generateShareLink(req.params.id as string, req.user!.userId);
      res.json(result);
    } catch (error) {
      logger.error("Error generating share link:", error);
      res.status(500).json({ error: "Failed to generate share link", code: "SHARE_ERROR" });
    }
  }
);

router.get("/share/:token", async (req, res) => {
  try {
    const result = await getSharedDocument(req.params.token);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("expired")
      ? 410
      : message.includes("not found")
        ? 404
        : 500;
    res.status(status).json({ error: message, code: "SHARE_ERROR" });
  }
});

export default router;
