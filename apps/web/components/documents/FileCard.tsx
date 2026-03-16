"use client";

import { Eye, Download, Share2, Trash2, FileText, Image, Film } from "lucide-react";
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

export default function FileCard({
  id,
  name,
  originalName,
  mimeType,
  sizeBytes,
  createdAt,
  onView,
  onDownload,
  onShare,
  onDelete,
}: FileCardProps) {
  const Icon = getFileIcon(mimeType);
  const colors = getFileColor(mimeType);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Background glow on hover */}
      <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${colors.gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-10`} />

      <div className="relative flex items-start gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${colors.gradient} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-[#E8611A] transition-colors duration-200">
            {name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(sizeBytes)} &middot;{" "}
            {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="relative mt-3 flex items-center gap-1 border-t border-border/30 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(id)}
          title="View"
          className="h-8 w-8 rounded-lg p-0 hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(id)}
          title="Download"
          className="h-8 w-8 rounded-lg p-0 hover:bg-green-50 hover:text-green-600 transition-all hover:scale-110 active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <PermissionGate permission="share">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare(id)}
            title="Share"
            className="h-8 w-8 rounded-lg p-0 hover:bg-purple-50 hover:text-purple-600 transition-all hover:scale-110 active:scale-95"
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
            className="h-8 w-8 rounded-lg p-0 text-destructive hover:bg-red-50 hover:text-red-600 transition-all hover:scale-110 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
