import { Router } from "express";
import { z } from "zod";
import { listLibrary } from "../services/library.service";
import { logger } from "../lib/logger";

const router: Router = Router();

const csvArray = z
  .string()
  .optional()
  .transform((v) =>
    v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );

const querySchema = z.object({
  q: z.string().optional(),
  docType: csvArray,
  category: csvArray,
  company: csvArray,
  mimeType: csvArray,
  sort: z.enum(["date", "name", "size"]).optional().default("date"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

router.get("/library", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid query parameters",
      code: "VALIDATION_ERROR",
      details: parsed.error.issues,
    });
    return;
  }

  try {
    const data = await listLibrary(parsed.data);
    res.json(data);
  } catch (err) {
    logger.error("Library list error:", err);
    res.status(500).json({ error: "Library query failed", code: "LIBRARY_ERROR" });
  }
});

export default router;
