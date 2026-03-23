"use client";

import { useState } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Film,
  FileSpreadsheet,
  Presentation,
  Mail,
  File,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactPlayer from "react-player";

interface FileViewerProps {
  url: string;
  name: string;
  mimeType: string;
  onClose: () => void;
  onDownload: () => void;
}

function getFileTypeInfo(mimeType: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext))
    return { type: "image" as const, label: "Image", icon: Image };
  if (mimeType.startsWith("video/") || ["mp4", "mov", "avi", "webm", "mkv"].includes(ext))
    return { type: "video" as const, label: "Video", icon: Film };
  if (mimeType === "application/pdf" || ext === "pdf")
    return { type: "pdf" as const, label: "PDF", icon: FileText };
  if (mimeType === "text/html" || ext === "html" || ext === "eml")
    return { type: "html" as const, label: "Email/HTML", icon: Mail };
  if (["pptx", "ppt"].includes(ext) || mimeType.includes("presentation"))
    return { type: "office" as const, label: "Presentation", icon: Presentation };
  if (["docx", "doc"].includes(ext) || mimeType.includes("word"))
    return { type: "office" as const, label: "Document", icon: FileText };
  if (["xlsx", "xls", "csv"].includes(ext) || mimeType.includes("spreadsheet"))
    return { type: "office" as const, label: "Spreadsheet", icon: FileSpreadsheet };
  if (["url", "lnk"].includes(ext))
    return { type: "link" as const, label: "Link", icon: ExternalLink };
  if (ext === "dwg")
    return { type: "unsupported" as const, label: "CAD Drawing", icon: File };

  return { type: "unsupported" as const, label: "File", icon: File };
}

export default function FileViewer({
  url,
  name,
  mimeType,
  onClose,
  onDownload,
}: FileViewerProps) {
  const [pdfPage, setPdfPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileInfo = getFileTypeInfo(mimeType, name);

  const renderContent = () => {
    switch (fileInfo.type) {
      case "image":
        return (
          <div className="relative flex items-center justify-center p-4 bg-[#1A1A1A]/5 rounded-xl min-h-[400px]">
            {/* Zoom & Rotate controls */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-xl bg-white/90 backdrop-blur-sm p-1 shadow-md border border-border/50">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-border mx-0.5" />
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setZoom(1); setRotation(0); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors text-xs font-medium"
                title="Reset"
              >
                1:1
              </button>
            </div>

            <div className="overflow-auto max-h-[75vh] max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="rounded-lg object-contain transition-transform duration-300"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  maxHeight: zoom === 1 ? "75vh" : "none",
                  maxWidth: zoom === 1 ? "100%" : "none",
                }}
              />
            </div>
          </div>
        );

      case "video":
        return (
          <div className="flex items-center justify-center rounded-xl bg-black p-2 min-h-[400px]">
            <ReactPlayer
              url={url}
              controls
              width="100%"
              height="auto"
              style={{ maxHeight: "75vh" }}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                  },
                },
              }}
            />
          </div>
        );

      case "pdf":
        return (
          <div className="flex flex-col items-center gap-3">
            <iframe
              src={`${url}#page=${pdfPage}&toolbar=1&navpanes=1`}
              className="h-[75vh] w-full rounded-xl border border-border/50"
              title={name}
            />
            <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
                disabled={pdfPage <= 1}
                className="rounded-lg h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground min-w-[80px] text-center">
                Page {pdfPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfPage(pdfPage + 1)}
                className="rounded-lg h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "html":
        return (
          <iframe
            src={url}
            sandbox="allow-same-origin"
            className="h-[75vh] w-full rounded-xl border border-border/50 bg-white"
            title={name}
          />
        );

      case "office":
        return (
          <div className="flex flex-col items-center gap-4">
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
              className="h-[75vh] w-full rounded-xl border border-border/50"
              title={name}
            />
            <p className="text-xs text-muted-foreground">
              Powered by Google Docs Viewer. If the preview doesn&apos;t load,{" "}
              <button onClick={onDownload} className="text-[#E8611A] underline font-medium">
                download the file
              </button>{" "}
              to view it locally.
            </p>
          </div>
        );

      case "link":
        return (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-xl">
              <ExternalLink className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">External Link</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              This is a link/shortcut file. Click below to open it or download to view the URL.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(url, "_blank")}
                className="rounded-xl gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Link
              </Button>
              <Button
                onClick={onDownload}
                className="rounded-xl bg-[#E8611A] hover:bg-[#D4550F] gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        );

      case "unsupported":
      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-xl">
              <File className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{fileInfo.label}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Preview is not available for this file type.
              Download the file to view it on your device.
            </p>
            <Button
              onClick={onDownload}
              className="rounded-xl bg-[#E8611A] hover:bg-[#D4550F] gap-2 shadow-md"
            >
              <Download className="h-4 w-4" />
              Download {name}
            </Button>
          </div>
        );
    }
  };

  const FileIcon = fileInfo.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 w-full max-w-6xl rounded-2xl bg-white shadow-2xl animate-scale-in max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8611A] to-[#FF8A50] shadow-md shrink-0">
              <FileIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold tracking-tight">{name}</h3>
              <span className="text-xs text-muted-foreground">{fileInfo.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank")}
              className="rounded-xl gap-1.5 hidden sm:flex"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Full Screen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="rounded-xl gap-1.5 hover:bg-[#E8611A] hover:text-white hover:border-[#E8611A] transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-110 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
