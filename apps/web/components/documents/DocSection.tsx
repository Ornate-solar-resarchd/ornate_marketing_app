"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, LayoutGrid, List, Upload, FolderOpen, Search, Filter, X, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  fileUrl?: string;
  tags?: string[];
  version?: number;
  parentId?: string | null;
}

interface DocSectionProps {
  docType: DocTypeKey;
  documents: Document[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (docType: string) => void;
  onViewVersions?: (id: string) => void;
}

export default function DocSection({
  docType,
  documents,
  onView,
  onDownload,
  onShare,
  onDelete,
  onUpload,
  onViewVersions,
}: DocSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("");

  const typeInfo = DOC_TYPES[docType];
  const count = documents.length;

  // Collect all unique tags from documents
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((doc) => doc.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [documents]);

  // Collect all unique file types
  const allFileTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc) => {
      const ext = doc.originalName.split(".").pop()?.toLowerCase();
      if (ext) types.add(ext);
    });
    return Array.from(types).sort();
  }, [documents]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...documents];

    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.originalName.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter by tag
    if (selectedTag) {
      result = result.filter((d) => d.tags?.includes(selectedTag));
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = Date.now();
      const cutoff =
        dateFilter === "today" ? now - 24 * 60 * 60 * 1000 :
        dateFilter === "week" ? now - 7 * 24 * 60 * 60 * 1000 :
        now - 30 * 24 * 60 * 60 * 1000;
      result = result.filter((d) => new Date(d.createdAt).getTime() > cutoff);
    }

    // Filter by file type
    if (fileTypeFilter) {
      result = result.filter((d) => {
        const ext = d.originalName.split(".").pop()?.toLowerCase();
        return ext === fileTypeFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return b.sizeBytes - a.sizeBytes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [documents, searchQuery, selectedTag, dateFilter, fileTypeFilter, sortBy]);

  const hasActiveFilters = searchQuery || selectedTag || dateFilter !== "all" || fileTypeFilter;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
    setDateFilter("all");
    setFileTypeFilter("");
  };

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
              {hasActiveFilters && (
                <Badge variant="secondary" className="rounded-md px-2 py-0 text-[10px] font-medium bg-blue-50 text-blue-600">
                  {filtered.length} shown
                </Badge>
              )}
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
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {/* View toggle */}
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

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "name" | "size")}
                className="h-8 rounded-xl border border-border/50 bg-background px-2.5 text-xs transition-colors hover:border-[#E8611A]/30 focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
              >
                <option value="date">Newest first</option>
                <option value="name">A → Z</option>
                <option value="size">Largest first</option>
              </select>

              {/* Search in section */}
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-7 rounded-xl border-border/50 text-xs focus:border-[#E8611A]/30 focus:ring-1 focus:ring-[#E8611A]/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <Button
                variant={showFilters ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-8 rounded-xl text-xs gap-1",
                  hasActiveFilters && "bg-blue-50 text-blue-600 hover:bg-blue-100"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                    !
                  </span>
                )}
              </Button>

              {/* Upload */}
              <PermissionGate permission="upload">
                <Button
                  size="sm"
                  onClick={() => onUpload(docType)}
                  className="h-8 rounded-xl bg-[#E8611A] hover:bg-[#D4550F] transition-all hover:scale-105 active:scale-95 shadow-md shadow-orange-200/30 text-xs"
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Upload
                </Button>
              </PermissionGate>
            </div>

            {/* Filter bar */}
            {showFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 p-3 animate-fade-in">
                {/* Date filter */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                    className="h-7 rounded-lg border border-border/50 bg-white px-2 text-xs focus:border-[#E8611A] focus:outline-none"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                </div>

                {/* File type filter */}
                {allFileTypes.length > 1 && (
                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="h-7 rounded-lg border border-border/50 bg-white px-2 text-xs focus:border-[#E8611A] focus:outline-none"
                  >
                    <option value="">All formats</option>
                    {allFileTypes.map((ext) => (
                      <option key={ext} value={ext}>.{ext}</option>
                    ))}
                  </select>
                )}

                {/* Tag filter */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="h-7 rounded-lg border border-border/50 bg-white px-2 text-xs focus:border-[#E8611A] focus:outline-none"
                    >
                      <option value="">All tags</option>
                      {allTags.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Active tag pills */}
            {(selectedTag || dateFilter !== "all" || fileTypeFilter) && !showFilters && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5 animate-fade-in">
                {selectedTag && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8611A]/10 px-2 py-1 text-xs font-medium text-[#E8611A]">
                    <Tag className="h-3 w-3" />
                    {selectedTag}
                    <button onClick={() => setSelectedTag("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {dateFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                    <Calendar className="h-3 w-3" />
                    {dateFilter === "today" ? "Today" : dateFilter === "week" ? "This week" : "This month"}
                    <button onClick={() => setDateFilter("all")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {fileTypeFilter && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-xs font-medium text-purple-600">
                    .{fileTypeFilter}
                    <button onClick={() => setFileTypeFilter("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* File display */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-10">
                <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {count === 0 ? "No files uploaded yet" : "No files match your filters"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs text-[#E8611A] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <FileGrid
                documents={filtered}
                onView={onView}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
                onViewVersions={onViewVersions}
              />
            ) : (
              <FileList
                documents={filtered}
                onView={onView}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
                onViewVersions={onViewVersions}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
