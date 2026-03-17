import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

const router: Router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { companies: true } } },
    });
    res.json(categories);
  } catch (error) {
    logger.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories", code: "FETCH_ERROR" });
  }
});

router.get("/categories/:slug", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        companies: { orderBy: { label: "asc" } },
      },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found", code: "NOT_FOUND" });
      return;
    }

    res.json(category);
  } catch (error) {
    logger.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category", code: "FETCH_ERROR" });
  }
});

router.get("/companies/:id", async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        _count: { select: { documents: true } },
      },
    });

    if (!company) {
      const companyBySlug = await prisma.company.findUnique({
        where: { slug: req.params.id },
        include: {
          category: true,
          _count: { select: { documents: true } },
        },
      });

      if (!companyBySlug) {
        res.status(404).json({ error: "Company not found", code: "NOT_FOUND" });
        return;
      }

      res.json(companyBySlug);
      return;
    }

    res.json(company);
  } catch (error) {
    logger.error("Error fetching company:", error);
    res.status(500).json({ error: "Failed to fetch company", code: "FETCH_ERROR" });
  }
});

export default router;
