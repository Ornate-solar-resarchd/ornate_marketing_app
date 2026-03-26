import { prisma } from "../lib/prisma";
import {
  generateS3Key,
  uploadToS3,
  deleteFromS3,
  getSignedViewUrl,
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
  const displayName = customName || aiResult?.suggestedName || originalName.replace(/\.[^/.]+$/, "");

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

  const signedUrl = await getSignedViewUrl(document.fileKey, 86400);

  return { signedUrl, document };
}

export async function getDocumentsByCompany(companyId: string) {
  const documents = await prisma.document.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  // Generate short-lived signed URLs for thumbnails
  const docsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      try {
        const thumbnailUrl = await getSignedViewUrl(doc.fileKey, 3600);
        return { ...doc, fileUrl: thumbnailUrl };
      } catch {
        return doc;
      }
    })
  );

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

  const signedUrl = await getSignedViewUrl(document.fileKey, 3600);

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
