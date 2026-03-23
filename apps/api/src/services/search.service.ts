import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

interface SearchParams {
  q: string;
  category?: string;
  docType?: string;
  mimeType?: string;
  sortBy?: "date" | "name" | "size";
  page?: number;
  limit?: number;
}

export async function searchDocuments(params: SearchParams) {
  const {
    q,
    category,
    docType,
    mimeType,
    sortBy = "date",
    page = 1,
    limit = 30,
  } = params;

  const where: Prisma.DocumentWhereInput = {
    AND: [
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { originalName: { contains: q, mode: "insensitive" } },
          { company: { label: { contains: q, mode: "insensitive" } } },
        ],
      },
      ...(category
        ? [{ company: { category: { slug: category } } }]
        : []),
      ...(docType ? [{ docType }] : []),
      ...(mimeType ? [{ mimeType: { startsWith: mimeType } }] : []),
    ],
  };

  const orderBy: Prisma.DocumentOrderByWithRelationInput =
    sortBy === "name"
      ? { name: "asc" }
      : sortBy === "size"
        ? { sizeBytes: "desc" }
        : { createdAt: "desc" };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: {
          include: { category: true },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  const grouped = new Map<
    string,
    {
      company: {
        id: string;
        slug: string;
        label: string;
        logoUrl: string;
        categoryLabel: string;
      };
      documents: Array<(typeof documents)[0] & { highlight: string }>;
    }
  >();

  for (const doc of documents) {
    const companyId = doc.companyId;
    if (!grouped.has(companyId)) {
      grouped.set(companyId, {
        company: {
          id: doc.company.id,
          slug: doc.company.slug,
          label: doc.company.label,
          logoUrl: doc.company.logoUrl,
          categorySlug: doc.company.category.slug,
          categoryLabel: doc.company.category.label,
        },
        documents: [],
      });
    }

    const highlight = doc.name.replace(
      new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
      "<mark>$1</mark>"
    );

    grouped.get(companyId)!.documents.push({
      ...doc,
      highlight,
    });
  }

  return {
    results: Array.from(grouped.values()),
    total,
    page,
  };
}
