"use client";

import { useState } from "react";
import { Eye, Download, Share2, Trash2, FileText, Image, Film, Play } from "lucide-react";
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
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  return FileText;
}

function getFileColor(mimeType: string) {
  if (mimeType.startsWith("image/")) return { gradient: "from-purple-500 to-pink-500", bg: "bg-purple-50", text: "text-purple-600" };
  if (mimeType.startsWith("video/")) return { gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-600" };
  if (mimeType === "application/pdf") return { gradient: "from-red-500 to-rose-500", bg: "bg-red-50", text: "text-red-600" };
  return { gradient: "from-[#E8611A] to-[#FF8A50]", bg: "bg-orange-50", text: "text-[#E8611A]" };
}

function getExtBadge(originalName: string) {
  const ext = originalName.split(".").pop()?.toUpperCase() || "";
  return ext;
}

export default function FileCard({
  id,
  name,
  originalName,
  mimeType,
  sizeBytes,
  createdAt,
  fileUrl,
  onView,
  onDownload,
  onShare,
  onDelete,
}: FileCardProps) {
  const Icon = getFileIcon(mimeType);
  const colors = getFileColor(mimeType);
  const ext = getExtBadge(originalName);
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Thumbnail / Preview area */}
      <div
        className="relative cursor-pointer overflow-hidden bg-muted/20"
        onClick={() => onView(id)}
      >
        {isImage && fileUrl && !imgError ? (
          <div className="relative h-40 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <Eye className="h-5 w-5 text-[#E8611A]" />
              </div>
            </div>
          </div>
        ) : isVideo ? (
          <div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30">
              <Play className="h-6 w-6 text-white ml-0.5" />
            </div>
            <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {ext}
            </div>
          </div>
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div className="absolute bottom-2 right-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {ext}
            </div>
          </div>
        )}
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
