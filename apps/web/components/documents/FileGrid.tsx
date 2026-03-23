"use client";

import FileCard from "./FileCard";

interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl?: string;
}

interface FileGridProps {
  documents: Document[];
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FileGrid({
  documents,
  onView,
  onDownload,
  onShare,
  onDelete,
}: FileGridProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl">📂</div>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          No files yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload files to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <FileCard
          key={doc.id}
          {...doc}
          onView={onView}
          onDownload={onDownload}
          onShare={onShare}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
