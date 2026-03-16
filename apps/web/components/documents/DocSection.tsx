"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, LayoutGrid, List, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FileGrid from "./FileGrid";
import FileList from "./FileList";
import PermissionGate from "@/components/rbac/PermissionGate";
import { DOC_TYPES, type DocTypeKey } from "@ornate/types";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface DocSectionProps {
  docType: DocTypeKey;
  documents: Document[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (docType: string) => void;
}

export default function DocSection({
  docType,
  documents,
  onView,
  onDownload,
  onShare,
  onDelete,
  onUpload,
}: DocSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");

  const typeInfo = DOC_TYPES[docType];
  const count = documents.length;

  const sorted = [...documents].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "size") return b.sizeBytes - a.sizeBytes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="group/section overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all duration-300",
            expanded ? "bg-[#E8611A] text-white shadow-lg shadow-orange-200/50 scale-105" : "bg-muted/60"
          )}>
            {typeInfo.icon}
          </div>
          <div>
            <span className="font-semibold text-foreground">{typeInfo.label}</span>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge
                variant={count > 0 ? "default" : "secondary"}
                className="rounded-md px-2 py-0 text-[10px] font-medium"
              >
                {count} {count === 1 ? "file" : "files"}
              </Badge>
            </div>
          </div>
        </div>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
          expanded ? "bg-[#E8611A] text-white rotate-0" : "bg-muted/60 text-muted-foreground"
        )}>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="border-t border-border/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-border/50 p-0.5">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-lg h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-lg h-8 w-8 p-0"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "name" | "size")}
                  className="rounded-xl border border-border/50 bg-background px-3 py-1.5 text-sm transition-colors hover:border-[#E8611A]/30 focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
                >
                  <option value="date">Newest first</option>
                  <option value="name">A → Z</option>
                  <option value="size">Largest first</option>
                </select>
              </div>
              <PermissionGate permission="upload">
                <Button
                  size="sm"
                  onClick={() => onUpload(docType)}
                  className="rounded-xl bg-[#E8611A] hover:bg-[#D4550F] transition-all hover:scale-105 active:scale-95 shadow-md shadow-orange-200/30"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </Button>
              </PermissionGate>
            </div>

            {count === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-10">
                <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No files uploaded yet</p>
              </div>
            ) : viewMode === "grid" ? (
              <FileGrid
                documents={sorted}
                onView={onView}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
              />
            ) : (
              <FileList
                documents={sorted}
                onView={onView}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
