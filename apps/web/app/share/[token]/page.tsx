"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, AlertCircle, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";

interface SharedData {
  signedUrl: string;
  document: {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    company: {
      label: string;
      logoUrl: string;
      icon: string;
    };
  };
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    axios
      .get(`${apiUrl}/share/${token}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        const message =
          err.response?.data?.error || "Failed to load shared file";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E8611A] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
        <div className="mx-4 max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Link Unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handleDownload = async () => {
    try {
      const fileRes = await fetch(data.signedUrl);
      if (!fileRes.ok) throw new Error(`Fetch failed (${fileRes.status})`);
      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = data.document.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const mime = data.document.mimeType || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isPdf = mime === "application/pdf";
  const isInline = isImage || isVideo || isPdf;

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Header bar */}
      <div className="bg-white border-b border-border/40 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 rounded-lg shrink-0">
            <AvatarImage
              src={data.document.company.logoUrl}
              alt={data.document.company.label}
            />
            <AvatarFallback className="rounded-lg text-base">
              {data.document.company.icon}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {data.document.company.label}
            </p>
            <h2 className="text-sm font-semibold truncate">
              {data.document.name}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[#E8611A]">
            <Sun className="h-4 w-4" />
            <span className="text-xs font-bold">Ornate Solar</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* Inline preview area */}
      {isInline ? (
        <div className="flex items-center justify-center p-4 sm:p-8">
          {isImage && (
            <img
              src={data.signedUrl}
              alt={data.document.name}
              className="max-h-[85vh] w-auto max-w-full rounded-lg shadow-lg"
            />
          )}
          {isVideo && (
            <video
              src={data.signedUrl}
              controls
              autoPlay
              className="max-h-[85vh] w-full max-w-5xl rounded-lg shadow-lg bg-black"
            />
          )}
          {isPdf && (
            <iframe
              src={data.signedUrl}
              title={data.document.name}
              className="w-full max-w-6xl rounded-lg shadow-lg bg-white"
              style={{ height: "85vh" }}
            />
          )}
        </div>
      ) : (
        // Fallback for non-renderable types (Word, PPT, etc.)
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
            <p className="text-sm text-muted-foreground">
              {data.document.originalName}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              This file type cannot be previewed in the browser.
            </p>
            <Button className="mt-6 w-full" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
