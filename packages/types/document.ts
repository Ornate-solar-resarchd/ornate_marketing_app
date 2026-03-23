import { z } from "zod";

export const DOC_TYPES = {
  brochure: { label: "Brochure", icon: "📖", accept: ".pdf,.docx,.mp4,.mov,.avi,.webm" },
  datasheet: { label: "Datasheet", icon: "📊", accept: ".pdf,.xlsx,.docx,.mp4,.mov,.avi,.webm" },
  images: {
    label: "Images",
    icon: "🖼️",
    accept: ".jpg,.jpeg,.png,.webp,.svg,.pdf,.gif,.mp4,.mov,.avi,.webm",
  },
  videos: { label: "Videos", icon: "🎬", accept: ".mp4,.mov,.avi,.webm,.mkv,.url,.lnk" },
  ppt: { label: "PPT / Deck", icon: "📽️", accept: ".pptx,.ppt,.pdf,.mp4,.mov,.avi,.webm" },
  email: {
    label: "Email Template",
    icon: "✉️",
    accept: ".html,.pdf,.docx,.eml,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.webm",
  },
  compliance: { label: "Compliance Docs", icon: "🛡️", accept: ".pdf,.docx,.mp4,.mov,.avi,.webm" },
  casestudy: {
    label: "Case Studies",
    icon: "📋",
    accept: ".pdf,.docx,.pptx,.mp4,.mov,.avi,.webm",
  },
  installation: {
    label: "Installation Guide",
    icon: "🔧",
    accept: ".pdf,.docx,.mp4,.mov,.avi,.webm",
  },
  warranty: { label: "Warranty Docs", icon: "📜", accept: ".pdf,.docx,.mp4,.mov,.avi,.webm" },
  pricing: {
    label: "Pricing Sheets",
    icon: "💰",
    accept: ".pdf,.xlsx,.docx,.mp4,.mov,.avi,.webm",
  },
  approval: { label: "Type Approvals", icon: "✅", accept: ".pdf,.docx,.mp4,.mov,.avi,.webm" },
  scheme: { label: "Scheme Docs", icon: "📜", accept: ".pdf,.docx,.mp4,.mov,.avi,.webm" },
  structural: {
    label: "Structural Docs",
    icon: "🔩",
    accept: ".pdf,.docx,.dwg,.mp4,.mov,.avi,.webm",
  },
} as const;

export type DocTypeKey = keyof typeof DOC_TYPES;

export const docTypeKeys = Object.keys(DOC_TYPES) as DocTypeKey[];

export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  originalName: z.string(),
  fileKey: z.string(),
  fileUrl: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  docType: z.string(),
  companyId: z.string(),
  uploadedBy: z.string(),
  uploaderName: z.string(),
  shareToken: z.string().nullable(),
  shareExpiry: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const UploadSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  docType: z.string().refine((val) => val in DOC_TYPES, "Invalid document type"),
});

export type UploadInput = z.infer<typeof UploadSchema>;

export const ShareResponseSchema = z.object({
  shareUrl: z.string().url(),
  shareToken: z.string(),
  expiresAt: z.string().datetime(),
});

export type ShareResponse = z.infer<typeof ShareResponseSchema>;
