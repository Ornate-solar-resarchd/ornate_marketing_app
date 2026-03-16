"use client";

import { useState } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactPlayer from "react-player";

interface FileViewerProps {
  url: string;
  name: string;
  mimeType: string;
  onClose: () => void;
  onDownload: () => void;
}

export default function FileViewer({
  url,
  name,
  mimeType,
  onClose,
  onDownload,
}: FileViewerProps) {
  const [pdfPage, setPdfPage] = useState(1);

  const renderContent = () => {
    if (mimeType.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />
        </div>
      );
    }

    if (mimeType.startsWith("video/")) {
      return (
        <div className="flex items-center justify-center p-4">
          <ReactPlayer url={url} controls width="100%" height="auto" />
        </div>
      );
    }

    if (mimeType === "application/pdf") {
      return (
        <div className="flex flex-col items-center">
          <iframe
            src={`${url}#page=${pdfPage}`}
            className="h-[80vh] w-full rounded-lg"
            title={name}
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {pdfPage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPdfPage(pdfPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (mimeType === "text/html") {
      return (
        <iframe
          src={url}
          sandbox="allow-same-origin"
          className="h-[80vh] w-full rounded-lg bg-white"
          title={name}
        />
      );
    }

    // PPT, DOCX — Google Docs viewer
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
          className="h-[80vh] w-full rounded-lg"
          title={name}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative mx-4 w-full max-w-5xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="truncate text-lg font-semibold">{name}</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="max-h-[85vh] overflow-auto p-4">{renderContent()}</div>
      </div>
    </div>
  );
}
