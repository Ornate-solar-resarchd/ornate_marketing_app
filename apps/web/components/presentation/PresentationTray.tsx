"use client";

import { useState } from "react";
import { Presentation, X, Trash2, Copy, Check, ChevronUp, ChevronDown } from "lucide-react";
import { usePresentationTray } from "@/lib/presentation-context";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const DOC_TYPE_COLORS: Record<string, string> = {
  brochure: "bg-red-100 text-red-700",
  datasheet: "bg-blue-100 text-blue-700",
  images: "bg-purple-100 text-purple-700",
  videos: "bg-pink-100 text-pink-700",
  ppt: "bg-orange-100 text-orange-700",
  pricing: "bg-green-100 text-green-700",
  default: "bg-gray-100 text-gray-700",
};

export default function PresentationTray() {
  const { selectedDocs, removeDoc, clearDocs } = usePresentationTray();

  const [expanded, setExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [building, setBuilding] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  if (selectedDocs.length === 0 && !showModal) return null;

  const handleBuild = async () => {
    if (!customerName.trim()) {
      toast.error("Enter customer / company name");
      return;
    }
    setBuilding(true);
    try {
      const res = await api.post("/presentations", {
        customerName: customerName.trim(),
        docs: selectedDocs,
        expiryDays,
      });
      setShareUrl(res.data.shareUrl);
      clearDocs();
      toast.success("Presentation created!");
    } catch {
      toast.error("Failed to create presentation");
    } finally {
      setBuilding(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating tray */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl mx-4 mb-4 rounded-2xl border border-[#E8611A]/30 bg-white shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] cursor-pointer"
            onClick={() => setExpanded((p) => !p)}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8611A]">
                <Presentation className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Presentation Builder</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8611A] text-[11px] font-bold text-white">
                {selectedDocs.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); clearDocs(); }}
                className="rounded-lg p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-white/60" />
              ) : (
                <ChevronUp className="h-4 w-4 text-white/60" />
              )}
            </div>
          </div>

          {/* Doc list */}
          {expanded && (
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedDocs.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="flex items-center gap-1.5 rounded-xl bg-muted/50 border border-border/50 px-2.5 py-1.5 max-w-[220px]"
                  >
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${DOC_TYPE_COLORS[doc.docType] ?? DOC_TYPE_COLORS.default}`}>
                      {doc.docType}
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">{doc.docName}</span>
                    <button
                      onClick={() => removeDoc(doc.documentId)}
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowModal(true)}
                className="w-full bg-[#E8611A] hover:bg-[#D4550F] rounded-xl h-9 text-sm font-bold shadow-md shadow-orange-200/40"
              >
                <Presentation className="mr-2 h-4 w-4" />
                Build Presentation ({selectedDocs.length} doc{selectedDocs.length !== 1 ? "s" : ""})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Build modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Presentation className="h-5 w-5 text-[#E8611A]" />
                <h2 className="text-base font-bold">
                  {shareUrl ? "Presentation Ready" : "Build Presentation"}
                </h2>
              </div>
              <button
                onClick={() => { setShowModal(false); setShareUrl(""); setCustomerName(""); }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {!shareUrl ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Customer / Company Name *
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleBuild()}
                      placeholder="e.g. Tata Power, L&T Construction"
                      className="mt-1.5 w-full rounded-xl border border-border/50 px-3 py-2.5 text-sm focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Link Expires In
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      {[3, 7, 30].map((d) => (
                        <button
                          key={d}
                          onClick={() => setExpiryDays(d)}
                          className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                            expiryDays === d
                              ? "border-[#E8611A] bg-[#E8611A]/10 text-[#E8611A]"
                              : "border-border/50 text-muted-foreground hover:border-[#E8611A]/30"
                          }`}
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                    {selectedDocs.length} document{selectedDocs.length !== 1 ? "s" : ""} will be included
                  </div>
                  <Button
                    onClick={handleBuild}
                    disabled={building || !customerName.trim()}
                    className="w-full bg-[#E8611A] hover:bg-[#D4550F] rounded-xl h-10 font-bold"
                  >
                    {building ? "Creating…" : "Create Shareable Link"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">Share this link with your customer</p>
                  {shareUrl && (
                    <div className="flex justify-center">
                      <div className="rounded-xl border border-border/50 p-2">
                        <QRCodeSVG value={shareUrl} size={140} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-2.5">
                    <span className="flex-1 truncate text-xs font-mono text-foreground">{shareUrl}</span>
                    <button
                      onClick={handleCopy}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        copied
                          ? "bg-emerald-500 text-white"
                          : "bg-[#E8611A] text-white hover:bg-[#D4550F]"
                      }`}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expires in {expiryDays} days · Customer needs no login
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
