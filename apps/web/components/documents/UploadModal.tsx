"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, CloudUpload, Tag, Type, HardDrive, Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOC_TYPES, type DocTypeKey } from "@ornate/types";
import { formatBytes } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

interface UploadModalProps {
  companyId: string;
  docType: DocTypeKey;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({
  companyId,
  docType,
  onClose,
  onSuccess,
}: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [customName, setCustomName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // GDrive state
  const [mode, setMode] = useState<"local" | "gdrive">("local");
  const [gdriveQuery, setGdriveQuery] = useState("");
  const [gdriveSearching, setGdriveSearching] = useState(false);
  const [gdriveResults, setGdriveResults] = useState<Array<{ id: string; name: string; mimeType: string; size: string; iconUrl: string }>>([]);
  const [gdriveSelected, setGdriveSelected] = useState<Record<string, { id: string; name: string; mimeType: string }>>({});
  const selectedCount = Object.keys(gdriveSelected).length;

  const typeInfo = DOC_TYPES[docType];
  const acceptExtensions = typeInfo.accept.split(",");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const valid = acceptedFiles.filter((f) => {
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        return acceptExtensions.includes(ext);
      });

      if (valid.length < acceptedFiles.length) {
        toast.error(
          `Some files were rejected. Accepted types: ${acceptExtensions.join(", ")}`
        );
      }

      setFiles((prev) => [...prev, ...valid]);
    },
    [acceptExtensions]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const searchGDrive = async () => {
    const q = gdriveQuery.trim();
    if (!q) return;
    setGdriveSearching(true);
    try {
      const fetcher = process.env.NEXT_PUBLIC_GDRIVE_FETCHER_URL;
      if (!fetcher) {
        toast.error("GDrive fetcher not configured");
        return;
      }
      const res = await fetch(`${fetcher}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "GDrive search failed");
        return;
      }
      // Filter by accepted extensions for this docType
      const filtered = (data.results || []).filter((r: { name: string }) => {
        const ext = "." + r.name.split(".").pop()?.toLowerCase();
        return acceptExtensions.includes(ext);
      });
      setGdriveResults(filtered);
      if (filtered.length === 0) {
        toast.info(`No ${acceptExtensions.join("/")} files found for "${q}"`);
      }
    } catch (e) {
      toast.error("GDrive search failed");
      console.error(e);
    } finally {
      setGdriveSearching(false);
    }
  };

  const toggleGDriveSelect = (file: { id: string; name: string; mimeType: string }) => {
    setGdriveSelected((prev) => {
      const next = { ...prev };
      if (next[file.id]) delete next[file.id];
      else next[file.id] = file;
      return next;
    });
  };

  const handleGDriveImport = async () => {
    if (selectedCount === 0) return;
    setUploading(true);
    setProgress(20);
    try {
      const filesPayload = Object.values(gdriveSelected);
      setProgress(50);
      await api.post("/upload/gdrive", {
        companyId,
        docType,
        files: filesPayload,
        customName: filesPayload.length === 1 && customName.trim() ? customName.trim() : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setProgress(100);
      toast.success(`Imported ${selectedCount} file${selectedCount !== 1 ? "s" : ""} from Google Drive!`);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "GDrive import failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (mode === "gdrive") return handleGDriveImport();
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    let completedBytes = 0;

    try {
      for (const file of files) {
        const mimeType = file.type || "application/octet-stream";

        // 1. Ask backend for a presigned PUT URL
        const { data: presign } = await api.post("/upload/presign", {
          companyId,
          docType,
          filename: file.name,
          mimeType,
          sizeBytes: file.size,
        });

        // 2. PUT the file directly to MinIO (bytes never touch the API)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presign.putUrl);
          xhr.setRequestHeader("Content-Type", mimeType);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && totalBytes > 0) {
              const done = completedBytes + e.loaded;
              setProgress(Math.round((done * 100) / totalBytes));
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`HTTP ${xhr.status}`));
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });

        completedBytes += file.size;
        setProgress(Math.round((completedBytes * 100) / totalBytes));

        // 3. Register the uploaded object in the DB
        await api.post("/upload/complete", {
          companyId,
          docType,
          fileKey: presign.fileKey,
          originalName: file.name,
          mimeType,
          sizeBytes: file.size,
          customName:
            files.length === 1 && customName.trim() ? customName.trim() : undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      }

      toast.success("Files uploaded successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-scale-in max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-5 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8611A] to-[#FF8A50] text-lg shadow-md">
              {typeInfo.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Upload Files</h3>
              <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
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
        <div className="p-5 space-y-4">
          {/* Mode Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
            <button
              onClick={() => setMode("local")}
              disabled={uploading}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === "local"
                  ? "bg-white text-[#E8611A] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CloudUpload className="h-4 w-4" />
              Computer
            </button>
            <button
              onClick={() => setMode("gdrive")}
              disabled={uploading}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === "gdrive"
                  ? "bg-white text-[#E8611A] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="h-4 w-4" />
              Google Drive
            </button>
          </div>

          {mode === "local" ? (
            /* Local Drop zone */
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                isDragActive
                  ? "border-[#E8611A] bg-orange-50 scale-[1.02]"
                  : "border-border/50 hover:border-[#E8611A]/50 hover:bg-orange-50/30"
              }`}
            >
              <input {...getInputProps()} />
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                isDragActive
                  ? "bg-gradient-to-br from-[#E8611A] to-[#FF8A50] text-white shadow-lg"
                  : "bg-muted/60 text-muted-foreground"
              }`}>
                <CloudUpload className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
              <p className="mt-2 inline-flex rounded-full bg-muted/60 px-3 py-1 text-[10px] font-medium text-muted-foreground">
                Accepted: {acceptExtensions.join(", ")}
              </p>
            </div>
          ) : (
            /* GDrive Panel */
            <div className="space-y-3 animate-fade-in">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Google Drive..."
                    value={gdriveQuery}
                    onChange={(e) => setGdriveQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchGDrive()}
                    disabled={uploading}
                    className="pl-9 rounded-xl"
                  />
                </div>
                <Button
                  onClick={searchGDrive}
                  disabled={!gdriveQuery.trim() || gdriveSearching || uploading}
                  className="rounded-xl bg-[#E8611A] hover:bg-[#D4550F]"
                >
                  {gdriveSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {gdriveResults.length > 0 && (
                <div className="max-h-72 overflow-auto rounded-xl border border-border/50 divide-y divide-border/30">
                  {gdriveResults.map((file) => {
                    const isSelected = !!gdriveSelected[file.id];
                    return (
                      <button
                        key={file.id}
                        onClick={() => toggleGDriveSelect(file)}
                        disabled={uploading}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          isSelected ? "bg-orange-50" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                          isSelected
                            ? "bg-[#E8611A] border-[#E8611A]"
                            : "border-border/50"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-lg">{file.iconUrl}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {gdriveResults.length === 0 && !gdriveSearching && (
                <div className="rounded-2xl border-2 border-dashed border-border/50 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                    <HardDrive className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">Search to find files</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Showing only {acceptExtensions.join(", ")} files
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Custom Name */}
          {(mode === "local" ? files.length > 0 : selectedCount > 0) && (
            <div className="animate-fade-in-up">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Type className="h-3 w-3" />
                Display Name {(mode === "local" ? files.length : selectedCount) > 1 && <span className="normal-case font-normal">(applies to single file only)</span>}
              </label>
              <Input
                placeholder="Custom name for the file (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="rounded-xl border-border/50 focus:border-[#E8611A]/30 focus:ring-1 focus:ring-[#E8611A]/10"
                disabled={(mode === "local" ? files.length : selectedCount) > 1}
              />
            </div>
          )}

          {/* Tags */}
          {(mode === "local" ? files.length > 0 : selectedCount > 0) && (
            <div className="animate-fade-in-up" style={{ animationDelay: "50ms" }}>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Tag className="h-3 w-3" />
                Tags <span className="normal-case font-normal">(press Enter or comma to add)</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/50 bg-white px-3 py-2 focus-within:border-[#E8611A]/30 focus-within:ring-1 focus-within:ring-[#E8611A]/10 transition-all">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#E8611A]/10 to-[#FF8A50]/10 px-2.5 py-1 text-xs font-medium text-[#E8611A] transition-all hover:from-[#E8611A]/20 hover:to-[#FF8A50]/20"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full hover:bg-[#E8611A]/20 p-0.5 transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  placeholder={tags.length === 0 ? "e.g. solar, brochure, 2026" : "Add more..."}
                  className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          )}

          {/* File list */}
          {mode === "local" && files.length > 0 && (
            <div className="max-h-48 space-y-2 overflow-auto rounded-xl">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-muted/40 p-3 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8611A] to-[#FF8A50]">
                      <FileText className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Uploading...</span>
                <span className="font-bold text-[#E8611A]">{progress}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E8611A] to-[#FF8A50] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border/50 p-5 sticky bottom-0 bg-white rounded-b-2xl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={(mode === "local" ? files.length === 0 : selectedCount === 0) || uploading}
            className="rounded-xl bg-[#E8611A] hover:bg-[#D4550F] shadow-md shadow-orange-200/30 transition-all hover:scale-105 active:scale-95"
          >
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {mode === "gdrive" ? "Importing..." : "Uploading..."}
              </>
            ) : mode === "gdrive" ? (
              <>
                <HardDrive className="mr-1.5 h-4 w-4" />
                Import {selectedCount} file{selectedCount !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-4 w-4" />
                Upload {files.length} file{files.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
