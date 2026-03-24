"use client";

import { useState } from "react";
import { Eye, Download, Share2, Trash2, FileText, Image, Film, Play, FileSpreadsheet, Presentation, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import PermissionGate from "@/components/rbac/PermissionGate";

interface FileCardProps {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl?: string;
  tags?: string[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

function getFileIcon(mimeType: string, ext: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (["pptx", "ppt"].includes(ext)) return Presentation;
  if (["xlsx", "xls", "csv"].includes(ext)) return FileSpreadsheet;
  if (["html", "eml"].includes(ext)) return Mail;
  return FileText;
}

function getFileColor(mimeType: string, ext: string) {
  if (mimeType.startsWith("image/")) return { gradient: "from-purple-500 to-pink-500", ring: "ring-purple-200" };
  if (mimeType.startsWith("video/")) return { gradient: "from-blue-500 to-cyan-500", ring: "ring-blue-200" };
  if (mimeType === "application/pdf" || ext === "pdf") return { gradient: "from-red-500 to-rose-500", ring: "ring-red-200" };
  if (["pptx", "ppt"].includes(ext)) return { gradient: "from-orange-500 to-amber-500", ring: "ring-orange-200" };
  if (["xlsx", "xls", "csv"].includes(ext)) return { gradient: "from-emerald-500 to-green-500", ring: "ring-emerald-200" };
  if (["docx", "doc"].includes(ext)) return { gradient: "from-blue-600 to-indigo-500", ring: "ring-blue-200" };
  if (["html", "eml"].includes(ext)) return { gradient: "from-pink-500 to-rose-500", ring: "ring-pink-200" };
  return { gradient: "from-[#E8611A] to-[#FF8A50]", ring: "ring-orange-200" };
}

export default function FileCard({
  id,
  name,
  originalName,
  mimeType,
  sizeBytes,
  createdAt,
  fileUrl,
  tags,
  onView,
  onDownload,
  onShare,
  onDelete,
}: FileCardProps) {
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  const Icon = getFileIcon(mimeType, ext);
  const colors = getFileColor(mimeType, ext);
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf" || ext === "pdf";
  const isVideo = mimeType.startsWith("video/");
  const [imgError, setImgError] = useState(false);

  const renderThumbnail = () => {
    // Image thumbnail
    if (isImage && fileUrl && !imgError) {
      return (
        <div className="relative h-40 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
              <Eye className="h-5 w-5 text-[#E8611A]" />
            </div>
          </div>
        </div>
      );
    }

    // PDF thumbnail - embedded preview
    if (isPdf && fileUrl) {
      return (
        <div className="relative h-40 w-full overflow-hidden bg-white">
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
            className="h-[200%] w-[200%] origin-top-left scale-50 pointer-events-none"
            title={name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
              <Eye className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <div className="absolute top-2 left-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            PDF
          </div>
        </div>
      );
    }

    // Video thumbnail
    if (isVideo && fileUrl) {
      return (
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
          <video
            src={fileUrl}
            className="h-full w-full object-cover opacity-70"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30 shadow-lg">
              <Play className="h-6 w-6 text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute top-2 left-2 rounded-md bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {ext.toUpperCase()}
          </div>
        </div>
      );
    }

    // Default icon thumbnail for other file types
    return (
      <div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-black/5" />
        </div>
        <div className={`absolute top-2 left-2 rounded-md bg-gradient-to-r ${colors.gradient} px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm`}>
          {ext.toUpperCase()}
        </div>
      </div>
    );
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="cursor-pointer" onClick={() => onView(id)}>
        {renderThumbnail()}
      </div>

      {/* File info */}
      <div className="p-3.5">
        <p
          className="truncate text-sm font-semibold text-foreground group-hover:text-[#E8611A] transition-colors duration-200 cursor-pointer"
          onClick={() => onView(id)}
          title={name}
        >
          {name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatBytes(sizeBytes)} &middot;{" "}
          {new Date(createdAt).toLocaleDateString()}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-md bg-[#E8611A]/8 px-1.5 py-0.5 text-[10px] font-medium text-[#E8611A]"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-2.5 flex items-center gap-1 border-t border-border/30 pt-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(id)}
            title="Preview"
            className="h-7 w-7 rounded-lg p-0 hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(id)}
            title="Download"
            className="h-7 w-7 rounded-lg p-0 hover:bg-green-50 hover:text-green-600 transition-all hover:scale-110 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <PermissionGate permission="share">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(id)}
              title="Share"
              className="h-7 w-7 rounded-lg p-0 hover:bg-purple-50 hover:text-purple-600 transition-all hover:scale-110 active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </PermissionGate>
          <div className="flex-1" />
          <PermissionGate permission="delete_own">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              title="Delete"
              className="h-7 w-7 rounded-lg p-0 text-destructive hover:bg-red-50 hover:text-red-600 transition-all hover:scale-110 active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
