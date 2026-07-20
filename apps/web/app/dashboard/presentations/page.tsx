"use client";

import { useEffect, useState } from "react";
import { Presentation, Copy, Check, ExternalLink, Trash2, Eye, Clock, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { DOC_TYPES } from "@ornate/types";

interface PresentationDoc {
  docName: string;
  docType: string;
  companyLabel: string;
}

interface PresentationItem {
  id: string;
  token: string;
  customerName: string;
  createdByName: string;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  _count: { docs: number };
  docs: PresentationDoc[];
}

const DOC_TYPE_COLORS: Record<string, string> = {
  brochure: "bg-red-100 text-red-700",
  datasheet: "bg-blue-100 text-blue-700",
  images: "bg-purple-100 text-purple-700",
  videos: "bg-pink-100 text-pink-700",
  ppt: "bg-orange-100 text-orange-700",
  pricing: "bg-green-100 text-green-700",
  default: "bg-gray-100 text-gray-700",
};

function getExpiryState(expiresAt: string): { label: string; className: string } {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (diff <= 0) return { label: "Expired", className: "bg-red-100 text-red-700" };
  if (days <= 2) return { label: `Expires in ${Math.ceil(days)}d`, className: "bg-amber-100 text-amber-700" };
  return { label: `${Math.ceil(days)} days left`, className: "bg-emerald-100 text-emerald-700" };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PresentationsPage() {
  const [items, setItems] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchItems = () => {
    setLoading(true);
    api.get("/presentations/mine")
      .then((res) => setItems(res.data))
      .catch(() => toast.error("Failed to load presentations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const getShareUrl = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/presentation/${token}`;

  const handleCopy = (item: PresentationItem) => {
    navigator.clipboard.writeText(getShareUrl(item.token));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this presentation? The link will stop working.")) return;
    try {
      await api.delete(`/presentations/${id}`);
      toast.success("Presentation deactivated");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Presentations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shareable links you&apos;ve built for customers
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8611A]">
          <Presentation className="h-5 w-5 text-white" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 py-20 text-center">
          <Presentation className="h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="text-base font-semibold text-muted-foreground">No presentations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select files from any company page and click &quot;Build Presentation&quot;
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const expiry = getExpiryState(item.expiresAt);
            const isExpired = new Date(item.expiresAt) < new Date();
            const shareUrl = getShareUrl(item.token);

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${isExpired ? "border-border/30 opacity-70" : "border-border/50"}`}
              >
                {/* Orange top bar */}
                <div className="h-1.5 bg-gradient-to-r from-[#E8611A] to-[#FF8A50]" />

                <div className="p-4 space-y-3">
                  {/* Customer + expiry badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{item.customerName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${expiry.className}`}>
                      {expiry.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {item._count.docs} doc{item._count.docs !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.viewCount} view{item.viewCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {formatDate(item.expiresAt)}
                    </span>
                  </div>

                  {/* Doc chips (preview of first 3) */}
                  {item.docs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.docs.map((doc, idx) => (
                        <span
                          key={idx}
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${DOC_TYPE_COLORS[doc.docType] ?? DOC_TYPE_COLORS.default}`}
                          title={doc.docName}
                        >
                          {DOC_TYPES[doc.docType as keyof typeof DOC_TYPES]?.icon ?? "📄"} {doc.docType}
                        </span>
                      ))}
                      {item._count.docs > 3 && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          +{item._count.docs - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item)}
                      className={`h-8 flex-1 rounded-xl text-xs gap-1.5 ${copiedId === item.id ? "text-emerald-600 bg-emerald-50" : "hover:bg-[#E8611A]/10 hover:text-[#E8611A]"}`}
                    >
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === item.id ? "Copied!" : "Copy Link"}
                    </Button>
                    {!isExpired && (
                      <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-xl p-0 hover:bg-blue-50 hover:text-blue-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 rounded-xl p-0 text-destructive hover:bg-red-50 hover:text-red-600"
                      title="Deactivate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
