"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileText, CloudUpload, Tag, Type } from "lucide-react";
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

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("docType", docType);
    if (customName.trim()) formData.append("customName", customName.trim());
    if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
    files.forEach((file) => formData.append("files", file));

    try {
      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

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
          {/* Drop zone */}
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

          {/* Custom Name */}
          {files.length > 0 && (
            <div className="animate-fade-in-up">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                <Type className="h-3 w-3" />
                Display Name {files.length > 1 && <span className="normal-case font-normal">(applies to single file only)</span>}
              </label>
              <Input
                placeholder="Custom name for the file (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="rounded-xl border-border/50 focus:border-[#E8611A]/30 focus:ring-1 focus:ring-[#E8611A]/10"
                disabled={files.length > 1}
              />
            </div>
          )}

          {/* Tags */}
          {files.length > 0 && (
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
          {files.length > 0 && (
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
            disabled={files.length === 0 || uploading}
            className="rounded-xl bg-[#E8611A] hover:bg-[#D4550F] shadow-md shadow-orange-200/30 transition-all hover:scale-105 active:scale-95"
          >
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
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
