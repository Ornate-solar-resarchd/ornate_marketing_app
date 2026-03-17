"use client";

import { useState, useEffect } from "react";
import { X, Copy, ExternalLink, CheckCircle, Link2, Share2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import { toast } from "sonner";

interface ShareModalProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

export default function ShareModal({
  documentId,
  documentName,
  onClose,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .post(`/documents/${documentId}/share`)
      .then((res) => {
        setShareUrl(res.data.shareUrl);
        setExpiresAt(res.data.expiresAt);
      })
      .catch(() => toast.error("Failed to generate share link"))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out this file: ${documentName}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Shared File: ${documentName}`);
    const body = encodeURIComponent(`Hi,\n\nI'm sharing a file with you: ${documentName}\n\nView/Download here: ${shareUrl}\n\nThis link expires in 24 hours.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Share File</h3>
              <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                {documentName}
              </p>
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
        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E8611A] border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Generating share link...</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {/* Share via buttons */}
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Share via
              </label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <button
                  onClick={handleWhatsApp}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 transition-all hover:border-green-400 hover:bg-green-50 hover:scale-105 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">WhatsApp</span>
                </button>
                <button
                  onClick={handleEmail}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 transition-all hover:border-blue-400 hover:bg-blue-50 hover:scale-105 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EA4335]">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Email</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 transition-all hover:border-[#E8611A] hover:bg-orange-50 hover:scale-105 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8611A]">
                    {copied ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Link2 className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {copied ? "Copied!" : "Copy Link"}
                  </span>
                </button>
              </div>

              {/* Share URL */}
              <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Share Link
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={shareUrl}
                    readOnly
                    className="rounded-xl pl-10 text-sm bg-muted/30 border-border/50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className={`rounded-xl h-10 w-10 transition-all hover:scale-110 active:scale-95 ${
                    copied ? "border-green-500 bg-green-50 text-green-500" : "hover:border-[#E8611A] hover:text-[#E8611A]"
                  }`}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* QR Code */}
              <div className="mt-5 flex justify-center">
                <div className="rounded-2xl border border-border/50 bg-white p-4 shadow-sm">
                  <QRCodeSVG
                    value={shareUrl}
                    size={140}
                    fgColor="#1A1A1A"
                    includeMargin
                  />
                </div>
              </div>

              {/* Open in new tab */}
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareUrl, "_blank")}
                  className="rounded-xl gap-1.5 transition-all hover:bg-[#E8611A] hover:text-white hover:border-[#E8611A] hover:scale-105 active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in new tab
                </Button>
              </div>

              {/* Expiry notice */}
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center">
                <p className="text-xs font-medium text-amber-700">
                  This link expires in 24 hours
                  {expiresAt && (
                    <span className="block mt-0.5 text-amber-600/80">
                      {new Date(expiresAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
