import { Router } from "express";
import { searchDocuments } from "../services/search.service";
import { logger } from "../lib/logger";

const router: Router = Router();

router.get("/search", async (req, res) => {
  try {
    const { q, category, docType, mimeType, sortBy, page, limit } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        error: "Search query (q) is required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const results = await searchDocuments({
      q: q as string,
      category: category as string | undefined,
      docType: docType as string | undefined,
      mimeType: mimeType as string | undefined,
      sortBy: (sortBy as "date" | "name" | "size") || "date",
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 30,
    });

    res.json(results);
  } catch (error) {
    logger.error("Search error:", error);
    res.status(500).json({ error: "Search failed", code: "SEARCH_ERROR" });
  }
});

export default router;
