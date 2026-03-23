"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Globe, FileText, FolderOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatsRow from "@/components/dashboard/StatsRow";
import DocSection from "@/components/documents/DocSection";
import FileViewer from "@/components/documents/FileViewer";
import UploadModal from "@/components/documents/UploadModal";
import ShareModal from "@/components/documents/ShareModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DOC_TYPES, type DocTypeKey } from "@ornate/types";
import api from "@/lib/api";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  logoUrl: string;
  websiteUrl: string;
  docTypes: string[];
  category: { label: string; slug: string };
  _count: { documents: number };
}

interface DocumentData {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl?: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companySlug = params.company as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [documents, setDocuments] = useState<Record<string, DocumentData[]>>({});
  const [loading, setLoading] = useState(true);

  const [viewerDoc, setViewerDoc] = useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [uploadDocType, setUploadDocType] = useState<DocTypeKey | null>(null);
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [shareDocName, setShareDocName] = useState("");

  const fetchData = async () => {
    try {
      const companyRes = await api.get(`/companies/${companySlug}`);
      setCompany(companyRes.data);

      const docsRes = await api.get(
        `/companies/${companyRes.data.id}/documents`
      );
      setDocuments(docsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companySlug]);

  const handleView = async (docId: string) => {
    try {
      const res = await api.post(`/documents/${docId}/view-url`);
      setViewerDoc({
        url: res.data.signedUrl,
        name: res.data.document.name,
        mimeType: res.data.document.mimeType,
      });
    } catch {
      toast.error("Failed to load file");
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await api.post(`/documents/${docId}/view-url`);
      const link = document.createElement("a");
      link.href = res.data.signedUrl;
      link.download = res.data.document.originalName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleShare = (docId: string) => {
    for (const docs of Object.values(documents)) {
      const doc = docs.find((d) => d.id === docId);
      if (doc) {
        setShareDocName(doc.name);
        break;
      }
    }
    setShareDocId(docId);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success("File deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground">Company not found</p>
      </div>
    );
  }

  const allDocs = Object.values(documents).flat();
  const lastUploaded = allDocs.length > 0
    ? allDocs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0].createdAt
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Company Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
        {/* Accent bar */}
        <div
          className="absolute left-0 top-0 h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${company.color}, ${company.color}88)` }}
        />
        {/* Background glow */}
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[0.06]"
          style={{ backgroundColor: company.color }}
        />

        <div className="relative flex items-center gap-5">
          <Avatar className="h-16 w-16 rounded-2xl ring-2 ring-border/50 shadow-lg animate-scale-in">
            <AvatarImage src={company.logoUrl} alt={company.label} className="object-contain p-2" />
            <AvatarFallback className="rounded-2xl text-2xl font-bold" style={{ backgroundColor: `${company.color}15`, color: company.color }}>
              {company.icon}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{company.label}</h1>
              <Badge variant="secondary" className="rounded-lg px-2.5 py-1 text-xs font-medium">
                {company.category.label}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {allDocs.length} files
              </span>
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                {company.docTypes.length} sections
              </span>
              {lastUploaded && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last upload: {new Date(lastUploaded).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl transition-all hover:bg-[#E8611A] hover:text-white hover:border-[#E8611A] hover:scale-105 active:scale-95">
              <Globe className="h-4 w-4" />
              Website
            </Button>
          </a>
        </div>
      </div>

      {/* Stats */}
      <StatsRow
        totalFiles={allDocs.length}
        totalSections={company.docTypes.length}
        lastUploaded={lastUploaded}
      />

      {/* Document Sections */}
      <div className="space-y-4 stagger-children">
        {company.docTypes.map((dt) => {
          const docType = dt as DocTypeKey;
          if (!(docType in DOC_TYPES)) return null;
          return (
            <DocSection
              key={docType}
              docType={docType}
              documents={documents[docType] || []}
              onView={handleView}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
              onUpload={() => setUploadDocType(docType)}
            />
          );
        })}
      </div>

      {viewerDoc && (
        <FileViewer
          url={viewerDoc.url}
          name={viewerDoc.name}
          mimeType={viewerDoc.mimeType}
          onClose={() => setViewerDoc(null)}
          onDownload={() => {
            const link = document.createElement("a");
            link.href = viewerDoc.url;
            link.download = viewerDoc.name;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      )}

      {uploadDocType && (
        <UploadModal
          companyId={company.id}
          docType={uploadDocType}
          onClose={() => setUploadDocType(null)}
          onSuccess={fetchData}
        />
      )}

      {shareDocId && (
        <ShareModal
          documentId={shareDocId}
          documentName={shareDocName}
          onClose={() => setShareDocId(null)}
        />
      )}
    </div>
  );
}
