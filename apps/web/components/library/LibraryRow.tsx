"use client";

import { Download, FileText, Image as ImageIcon, Film, FileType2 } from "lucide-react";
import type { ReactNode } from "react";
import { docTypeLabel } from "@/lib/docTypes";
import { formatBytes } from "@/lib/utils";

export interface LibraryDocument {
  id: string;
  name: string;
  docType: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
  createdAt: string;
  company: {
    id: string;
    slug: string;
    label: string;
    logoUrl?: string;
    category: { slug: string; label: string };
  };
}

interface Props {
  doc: LibraryDocument;
  onView?: (doc: LibraryDocument) => void;
}

function fileIcon(mime: string): ReactNode {
  if (mime?.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
  if (mime?.startsWith("video/")) return <Film className="h-5 w-5" />;
  if (mime === "application/pdf") return <FileType2 className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function iconColor(mime: string): string {
  if (mime === "application/pdf") return "bg-[#FEE2E2] text-[#DC2626]";
  if (mime?.startsWith("image/")) return "bg-[#FEF3C7] text-[#D97706]";
  if (mime?.startsWith("video/")) return "bg-[#EDE9FE] text-[#7C3AED]";
  return "bg-[#E5E7EB] text-[#374151]";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function LibraryRow({ doc, onView }: Props) {
  return (
    <div className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[#FEF0E8]">
      <div
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " +
          iconColor(doc.mimeType)
        }
      >
        {fileIcon(doc.mimeType)}
      </div>

      <button
        type="button"
        onClick={() => onView?.(doc)}
        className="flex-1 truncate text-left"
      >
        <p className="truncate text-sm font-semibold text-[#1A1A1A] group-hover:text-[#E8611A]">
          {doc.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-[#6B7280]">
          {doc.company.label} • {doc.company.category.label} •{" "}
          {docTypeLabel(doc.docType)} • {formatBytes(doc.sizeBytes)}
        </p>
      </button>

      <span className="hidden text-xs text-[#9CA3AF] sm:inline">
        {formatDate(doc.createdAt)}
      </span>

      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="rounded-md p-1.5 text-[#6B7280] transition-colors hover:bg-white hover:text-[#E8611A]"
        title="Download"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}
