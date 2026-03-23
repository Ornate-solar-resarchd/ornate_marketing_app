"use client";

import { Eye, Download, Share2, Trash2, FileText, Image, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import PermissionGate from "@/components/rbac/PermissionGate";

interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl?: string;
}

interface FileListProps {
  documents: Document[];
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

export default function FileList({
  documents,
  onView,
  onDownload,
  onShare,
  onDelete,
}: FileListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl">📂</div>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          No files yet
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Size</th>
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.mimeType);
            return (
              <tr key={doc.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => onView(doc.id)}>
                    {doc.mimeType.startsWith("image/") && doc.fileUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={doc.fileUrl} alt="" className="h-8 w-8 rounded-md object-cover ring-1 ring-border/50" />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate font-medium hover:text-[#E8611A] transition-colors">{doc.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {formatBytes(doc.sizeBytes)}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(doc.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDownload(doc.id)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <PermissionGate permission="share">
                      <Button variant="ghost" size="sm" onClick={() => onShare(doc.id)}>
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="delete_own">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(doc.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
