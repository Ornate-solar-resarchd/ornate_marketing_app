"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Eye, FileText, Image, Film, Clock, Building2, Presentation } from "lucide-react";
import axios from "axios";

interface PresentationDoc {
  id: string;
  documentId: string;
  docName: string;
  companyLabel: string;
  docType: string;
  mimeType: string;
  viewUrl: string | null;
  downloadUrl: string | null;
  position: number;
}

interface PresentationData {
  id: string;
  customerName: string;
  createdByName: string;
  expiresAt: string;
  docs: PresentationDoc[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  return FileText;
}

function formatExpiry(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function PresentationPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PresentationData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "expired" | "notfound">("loading");

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/presentations/view/${token}`)
      .then((res) => {
        setData(res.data);
        setStatus("ok");
      })
      .catch((err) => {
        if (err.response?.status === 410) setStatus("expired");
        else setStatus("notfound");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F7]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8611A] border-t-transparent" />
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F5F7] p-6 text-center">
        <Clock className="h-14 w-14 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-bold text-foreground">This presentation has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please contact Ornate Solar for a fresh link.</p>
      </div>
    );
  }

  if (status === "notfound" || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F5F7] p-6 text-center">
        <Presentation className="h-14 w-14 text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-bold text-foreground">Presentation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This link may have been revoked or never existed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="flex items-center gap-3 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ornate-logo.png" alt="Ornate Solar" className="h-8 w-auto" />
            <div className="h-5 w-px bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Marketing Presentation</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8611A]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50 uppercase tracking-wider">Prepared for</p>
              <h1 className="text-2xl font-bold">{data.customerName}</h1>
              <p className="mt-1 text-sm text-white/50">
                Shared by {data.createdByName} · Expires {formatExpiry(data.expiresAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents grid */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {data.docs.length} Document{data.docs.length !== 1 ? "s" : ""}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.docs.map((doc) => {
            const Icon = getMimeIcon(doc.mimeType);
            return (
              <div
                key={doc.id}
                className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Colored top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#E8611A] to-[#FF8A50]" />
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8611A]/10">
                      <Icon className="h-4.5 w-4.5 text-[#E8611A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{doc.docName}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{doc.companyLabel}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="rounded-md bg-[#E8611A]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#E8611A]">
                          {doc.docType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.viewUrl && (
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#E8611A]/10 px-3 py-2 text-xs font-semibold text-[#E8611A] hover:bg-[#E8611A]/20 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                    )}
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        download
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ornate-logo.png" alt="Ornate Solar" className="h-6 w-auto opacity-40" />
          <p className="text-xs text-muted-foreground">
            This presentation link expires on {formatExpiry(data.expiresAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
