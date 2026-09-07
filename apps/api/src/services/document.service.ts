import { prisma } from "../lib/prisma";
import {
  generateS3Key,
  uploadToS3,
  deleteFromS3,
  getPublicUrl,
} from "./s3.service";
import { v4 as uuidv4 } from "uuid";
import { autoTagFile } from "./ai-tagger.service";

interface UploadFileParams {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  companyId: string;
  docType: string;
  uploadedBy: string;
  uploaderName: string;
  customName?: string;
  tags?: string[];
}

export async function uploadDocument(params: UploadFileParams) {
  const {
    buffer,
    originalName,
    mimeType,
    sizeBytes,
    companyId,
    docType,
    uploadedBy,
    uploaderName,
    customName,
    tags,
  } = params;

  const fileKey = generateS3Key(companyId, docType, originalName);
  const fileUrl = await uploadToS3(buffer, fileKey, mimeType);

  // AI auto-tagging (runs in parallel, doesn't block upload)
  const aiResult = await autoTagFile(buffer, mimeType, originalName);

  // Merge user-provided tags with AI tags (user tags take priority)
  const mergedTags = [...new Set([...(tags || []), ...(aiResult?.tags || [])])];
  const description = aiResult?.description || "";
  // Only use custom name if user explicitly provided one — never auto-rename from AI
  const displayName = customName || originalName.replace(/\.[^/.]+$/, "");

  // Check for previous version — match by name (without extension) in same company+docType
  const baseName = originalName.replace(/\.[^/.]+$/, "").toLowerCase().trim();
  const existingDoc = await prisma.document.findFirst({
    where: {
      companyId,
      docType,
      OR: [
        { name: { equals: displayName, mode: "insensitive" } },
        { originalName: { startsWith: baseName, mode: "insensitive" } },
      ],
      parentId: null, // only match root documents or latest in chain
    },
    orderBy: { version: "desc" },
  });

  // Find the latest version in the chain
  let parentId: string | null = null;
  let newVersion = 1;

  if (existingDoc) {
    // Find the highest version in this document's chain
    const latestInChain = await prisma.document.findFirst({
      where: {
        OR: [
          { id: existingDoc.id },
          { parentId: existingDoc.id },
        ],
        companyId,
        docType,
      },
      orderBy: { version: "desc" },
    });

    if (latestInChain) {
      parentId = existingDoc.id;
      newVersion = latestInChain.version + 1;
    }
  }

  const document = await prisma.document.create({
    data: {
      name: displayName,
      originalName,
      fileKey,
      fileUrl,
      mimeType,
      sizeBytes,
      docType,
      tags: mergedTags,
      description,
      version: newVersion,
      parentId,
      companyId,
      uploadedBy,
      uploaderName,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: uploadedBy,
      action: "upload",
      docId: document.id,
      companyId,
      meta: { fileName: originalName, docType, mimeType },
    },
  });

  return document;
}

interface RegisterFileParams {
  fileKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  companyId: string;
  docType: string;
  uploadedBy: string;
  uploaderName: string;
  customName?: string;
  tags?: string[];
}

export async function registerDocument(params: RegisterFileParams) {
  const {
    fileKey,
    originalName,
    mimeType,
    sizeBytes,
    companyId,
    docType,
    uploadedBy,
    uploaderName,
    customName,
    tags,
  } = params;

  const region = process.env.AWS_REGION || "ap-south-1";
  const bucket = process.env.S3_BUCKET_NAME || "ornate-collateral-hub";
  const fileUrl = process.env.AWS_ENDPOINT_URL
    ? `${process.env.AWS_ENDPOINT_URL.replace(/\/$/, "")}/${bucket}/${fileKey}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;

  const displayName = customName || originalName.replace(/\.[^/.]+$/, "");
  const baseName = originalName.replace(/\.[^/.]+$/, "").toLowerCase().trim();
  const existingDoc = await prisma.document.findFirst({
    where: {
      companyId,
      docType,
      OR: [
        { name: { equals: displayName, mode: "insensitive" } },
        { originalName: { startsWith: baseName, mode: "insensitive" } },
      ],
      parentId: null,
    },
    orderBy: { version: "desc" },
  });

  let parentId: string | null = null;
  let newVersion = 1;
  if (existingDoc) {
    const latestInChain = await prisma.document.findFirst({
      where: {
        OR: [{ id: existingDoc.id }, { parentId: existingDoc.id }],
        companyId,
        docType,
      },
      orderBy: { version: "desc" },
    });
    if (latestInChain) {
      parentId = existingDoc.id;
      newVersion = latestInChain.version + 1;
    }
  }

  const document = await prisma.document.create({
    data: {
      name: displayName,
      originalName,
      fileKey,
      fileUrl,
      mimeType,
      sizeBytes,
      docType,
      tags: tags || [],
      description: "",
      version: newVersion,
      parentId,
      companyId,
      uploadedBy,
      uploaderName,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: uploadedBy,
      action: "upload",
      docId: document.id,
      companyId,
      meta: { fileName: originalName, docType, mimeType, presigned: true },
    },
  });

  return document;
}

export async function deleteDocument(
  documentId: string,
  userId: string,
  userRole: string
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (
    userRole !== "super_admin" &&
    userRole !== "admin" &&
    document.uploadedBy !== userId
  ) {
    throw new Error("Cannot delete documents uploaded by other users");
  }

  await deleteFromS3(document.fileKey);

  await prisma.document.delete({ where: { id: documentId } });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "delete",
      docId: documentId,
      companyId: document.companyId,
      meta: { fileName: document.originalName },
    },
  });

  return document;
}

export async function renameDocument(
  documentId: string,
  name: string,
  userId: string,
  userRole: string
) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    throw new Error("Document not found");
  }
  if (
    userRole !== "super_admin" &&
    userRole !== "admin" &&
    document.uploadedBy !== userId
  ) {
    throw new Error("Cannot rename documents uploaded by other users");
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { name },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "rename",
      docId: documentId,
      companyId: document.companyId,
      meta: { from: document.name, to: name },
    },
  });

  return updated;
}

export async function moveDocument(
  documentId: string,
  target: { companyId?: string; docType?: string },
  userId: string,
  userRole: string
) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    throw new Error("Document not found");
  }
  if (
    userRole !== "super_admin" &&
    userRole !== "admin" &&
    document.uploadedBy !== userId
  ) {
    throw new Error("Cannot move documents uploaded by other users");
  }

  const targetCompanyId = target.companyId || document.companyId;
  const targetDocType = target.docType || document.docType;

  // Nothing actually changed.
  if (targetCompanyId === document.companyId && targetDocType === document.docType) {
    return document;
  }

  const company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
  if (!company) {
    throw new Error("Target company not found");
  }
  if (!company.docTypes.includes(targetDocType)) {
    throw new Error("That section does not exist in the target company");
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { companyId: targetCompanyId, docType: targetDocType },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "move",
      docId: documentId,
      companyId: updated.companyId,
      meta: {
        fromCompany: document.companyId,
        toCompany: updated.companyId,
        fromDocType: document.docType,
        toDocType: updated.docType,
      },
    },
  });

  return updated;
}

export interface BulkMoveResult {
  moved: string[];
  skipped: Array<{ id: string; name: string | null; reason: string }>;
}

/**
 * Move many documents in one request.
 *
 * Partial success is the normal outcome, not an error: a manager selecting a
 * whole section will often include a file someone else uploaded, and failing
 * the entire batch over one such file would make bulk move useless. Per-document
 * problems (missing, not yours, already there) land in `skipped` and the rest
 * still move. Only problems with the *target* — unknown company, section the
 * target company doesn't have — throw, since those invalidate the whole request.
 */
export async function moveDocuments(
  documentIds: string[],
  target: { companyId?: string; docType?: string },
  userId: string,
  userRole: string
): Promise<BulkMoveResult> {
  const ids = Array.from(new Set(documentIds));
  if (ids.length === 0) {
    throw new Error("No documents selected");
  }

  const documents = await prisma.document.findMany({ where: { id: { in: ids } } });
  const byId = new Map(documents.map((d) => [d.id, d]));

  const moved: string[] = [];
  const skipped: BulkMoveResult["skipped"] = [];

  for (const id of ids) {
    if (!byId.has(id)) skipped.push({ id, name: null, reason: "Document not found" });
  }

  // Each document's destination falls back to where it already is, so a caller
  // may change only the company, only the section, or both. Resolve every
  // distinct destination company up front rather than querying per document.
  const isPrivileged = userRole === "super_admin" || userRole === "admin";
  const targetCompanyIds = new Set(
    documents.map((doc) => target.companyId || doc.companyId)
  );
  const companies = await prisma.company.findMany({
    where: { id: { in: Array.from(targetCompanyIds) } },
  });
  const companyById = new Map(companies.map((c) => [c.id, c]));

  // An explicit target the caller named must exist — that's a bad request, not
  // a per-document skip.
  if (target.companyId && !companyById.has(target.companyId)) {
    throw new Error("Target company not found");
  }

  // Group the movable documents by destination so each distinct destination is
  // a single updateMany instead of one update per document.
  const groups = new Map<string, { companyId: string; docType: string; ids: string[] }>();

  for (const doc of documents) {
    if (!isPrivileged && doc.uploadedBy !== userId) {
      skipped.push({
        id: doc.id,
        name: doc.name,
        reason: "Uploaded by someone else",
      });
      continue;
    }

    const toCompanyId = target.companyId || doc.companyId;
    const toDocType = target.docType || doc.docType;

    if (toCompanyId === doc.companyId && toDocType === doc.docType) {
      skipped.push({ id: doc.id, name: doc.name, reason: "Already in that location" });
      continue;
    }

    const company = companyById.get(toCompanyId);
    if (!company) {
      skipped.push({ id: doc.id, name: doc.name, reason: "Target company not found" });
      continue;
    }
    if (!company.docTypes.includes(toDocType)) {
      // With an explicit target section this is a whole-request error: the user
      // picked a section that company doesn't have, so nothing can move there.
      if (target.docType) {
        throw new Error("That section does not exist in the target company");
      }
      skipped.push({
        id: doc.id,
        name: doc.name,
        reason: `${company.label} has no ${doc.docType} section`,
      });
      continue;
    }

    const key = `${toCompanyId}::${toDocType}`;
    const group = groups.get(key) ?? { companyId: toCompanyId, docType: toDocType, ids: [] };
    group.ids.push(doc.id);
    groups.set(key, group);
  }

  if (groups.size === 0) {
    return { moved, skipped };
  }

  await prisma.$transaction(async (tx) => {
    for (const group of groups.values()) {
      await tx.document.updateMany({
        where: { id: { in: group.ids } },
        data: { companyId: group.companyId, docType: group.docType },
      });
      moved.push(...group.ids);
    }

    // One audit row per document, matching what a sequence of single moves
    // would have written — bulk is a UI convenience, not a different event.
    await tx.auditLog.createMany({
      data: Array.from(groups.values()).flatMap((group) =>
        group.ids.map((id) => {
          const doc = byId.get(id)!;
          return {
            userId,
            action: "move",
            docId: id,
            companyId: group.companyId,
            meta: {
              fromCompany: doc.companyId,
              toCompany: group.companyId,
              fromDocType: doc.docType,
              toDocType: group.docType,
              bulk: true,
              batchSize: ids.length,
            },
          };
        })
      ),
    });
  });

  return { moved, skipped };
}

export async function generateShareLink(documentId: string, userId: string) {
  const shareToken = uuidv4();
  const shareExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const document = await prisma.document.update({
    where: { id: documentId },
    data: { shareToken, shareExpiry },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "share",
      docId: documentId,
      companyId: document.companyId,
      meta: { shareToken, expiresAt: shareExpiry.toISOString() },
    },
  });

  const shareUrl = `${process.env.FRONTEND_URL}/share/${shareToken}`;

  return {
    shareUrl,
    shareToken,
    expiresAt: shareExpiry.toISOString(),
  };
}

export async function getSharedDocument(token: string) {
  const document = await prisma.document.findUnique({
    where: { shareToken: token },
    include: { company: { include: { category: true } } },
  });

  if (!document) {
    throw new Error("Share link not found");
  }

  if (document.shareExpiry && document.shareExpiry < new Date()) {
    throw new Error("Share link has expired");
  }

  const signedUrl = getPublicUrl(document.fileKey);

  return { signedUrl, document };
}

export async function getDocumentsByCompany(companyId: string) {
  const documents = await prisma.document.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  // Use permanent public URLs — bucket has "download" (public read) policy
  const docsWithUrls = documents.map((doc) => ({
    ...doc,
    fileUrl: getPublicUrl(doc.fileKey),
  }));

  const grouped: Record<string, typeof docsWithUrls> = {};
  for (const doc of docsWithUrls) {
    if (!grouped[doc.docType]) {
      grouped[doc.docType] = [];
    }
    grouped[doc.docType].push(doc);
  }

  return grouped;
}

export async function getDocumentViewUrl(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const signedUrl = getPublicUrl(document.fileKey);

  await prisma.auditLog.create({
    data: {
      userId,
      action: "download",
      docId: documentId,
      companyId: document.companyId,
    },
  });

  return { signedUrl, document };
}
