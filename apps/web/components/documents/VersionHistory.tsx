"use client";

import { useState, useEffect } from "react";
import { X, History, Download, Eye, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

interface Version {
  id: string;
  name: string;
  originalName: string;
  version: number;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  uploadedBy: string;
  uploaderName: string;
}

interface VersionHistoryProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
}

export default function VersionHistory({
  documentId,
  documentName,
  onClose,
  onView,
  onDownload,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/documents/${documentId}/versions`)
      .then((res) => setVersions(res.data))
      .catch(() => toast.error("Failed to load version history"))
      .finally(() => setLoading(false));
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Version History</h3>
              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                {documentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-96 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <History className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No version history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((ver, index) => {
                const isLatest = index === 0;
                const isCurrent = ver.id === documentId;
                return (
                  <div
                    key={ver.id}
                    className={`relative rounded-xl border p-4 transition-all ${
                      isCurrent
                        ? "border-blue-300 bg-blue-50/50"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    {/* Timeline dot */}
                    {index < versions.length - 1 && (
                      <div className="absolute -bottom-3 left-7 h-4 w-0.5 bg-border/50" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${
                        isLatest
                          ? "bg-gradient-to-br from-emerald-500 to-green-500"
                          : "bg-gradient-to-br from-gray-400 to-gray-500"
                      }`}>
                        v{ver.version}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{ver.originalName}</p>
                          {isLatest && (
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              LATEST
                            </span>
                          )}
                          {isCurrent && (
                            <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ver.createdAt).toLocaleDateString()}
                          </span>
                          <span>{formatBytes(ver.sizeBytes)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-2 flex items-center gap-1 ml-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(ver.id)}
                        className="h-7 rounded-lg text-xs hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(ver.id)}
                        className="h-7 rounded-lg text-xs hover:bg-green-50 hover:text-green-600"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
