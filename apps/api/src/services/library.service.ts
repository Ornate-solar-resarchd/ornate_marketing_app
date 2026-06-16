import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export interface LibraryParams {
  q?: string;
  docType?: string[];
  category?: string[];
  company?: string[];
  mimeType?: string[];
  sort?: "date" | "name" | "size";
  page?: number;
  limit?: number;
}

/**
 * Build a Prisma `where` clause for the Library list view.
 * `excludeFacet` lets us drop one facet's constraint so its facet counts
 * reflect the *other* filters only — standard faceted-search behaviour.
 */
function buildWhere(
  params: LibraryParams,
  excludeFacet?: "docType" | "category" | "company" | "mimeType"
): Prisma.DocumentWhereInput {
  const { q, docType, category, company, mimeType } = params;
  const and: Prisma.DocumentWhereInput[] = [];

  if (q && q.trim()) {
    const term = q.trim();
    and.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { originalName: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { company: { label: { contains: term, mode: "insensitive" } } },
        { tags: { hasSome: term.split(/\s+/).filter(Boolean) } },
      ],
    });
  }
  if (docType?.length && excludeFacet !== "docType") {
    and.push({ docType: { in: docType } });
  }
  if (category?.length && excludeFacet !== "category") {
    and.push({ company: { category: { slug: { in: category } } } });
  }
  if (company?.length && excludeFacet !== "company") {
    and.push({ company: { slug: { in: company } } });
  }
  if (mimeType?.length && excludeFacet !== "mimeType") {
    and.push({
      OR: mimeType.map((m) => ({ mimeType: { startsWith: m } })),
    });
  }
  return and.length ? { AND: and } : {};
}

async function facetCounts(
  params: LibraryParams,
  facet: "docType" | "category" | "company"
) {
  const where = buildWhere(params, facet);

  if (facet === "docType") {
    const rows = await prisma.document.groupBy({
      by: ["docType"],
      where,
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ value: r.docType, count: r._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  if (facet === "category") {
    const docs = await prisma.document.findMany({
      where,
      select: {
        company: { select: { category: { select: { slug: true, label: true } } } },
      },
    });
    const tally = new Map<string, { value: string; label: string; count: number }>();
    for (const d of docs) {
      const slug = d.company.category.slug;
      const label = d.company.category.label;
      const cur = tally.get(slug);
      if (cur) cur.count += 1;
      else tally.set(slug, { value: slug, label, count: 1 });
    }
    return Array.from(tally.values()).sort((a, b) => b.count - a.count);
  }

  // company
  const docs = await prisma.document.findMany({
    where,
    select: {
      company: { select: { slug: true, label: true } },
    },
  });
  const tally = new Map<string, { value: string; label: string; count: number }>();
  for (const d of docs) {
    const slug = d.company.slug;
    const label = d.company.label;
    const cur = tally.get(slug);
    if (cur) cur.count += 1;
    else tally.set(slug, { value: slug, label, count: 1 });
  }
  return Array.from(tally.values()).sort((a, b) => b.count - a.count);
}

export async function listLibrary(params: LibraryParams) {
  const { sort = "date", page = 1, limit = 30 } = params;
  const where = buildWhere(params);

  const orderBy: Prisma.DocumentOrderByWithRelationInput =
    sort === "name"
      ? { name: "asc" }
      : sort === "size"
        ? { sizeBytes: "desc" }
        : { createdAt: "desc" };

  const [documents, total, docTypeFacet, categoryFacet, companyFacet] =
    await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          company: { include: { category: true } },
        },
      }),
      prisma.document.count({ where }),
      facetCounts(params, "docType"),
      facetCounts(params, "category"),
      facetCounts(params, "company"),
    ]);

  return {
    documents,
    total,
    page,
    limit,
    facets: {
      docType: docTypeFacet,
      category: categoryFacet,
      company: companyFacet,
    },
  };
}
