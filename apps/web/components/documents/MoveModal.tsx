"use client";

import { useState, useEffect } from "react";
import { X, FolderInput, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { DOC_TYPES } from "@ornate/types";

interface Company {
  id: string;
  label: string;
  icon: string;
  docTypes: string[];
  category: { label: string };
}

interface MoveModalProps {
  documentId: string;
  currentCompanyId: string;
  currentDocType: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MoveModal({
  documentId,
  currentCompanyId,
  currentDocType,
  onClose,
  onSuccess,
}: MoveModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(currentCompanyId);
  const [selectedDocType, setSelectedDocType] = useState(currentDocType);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/companies")
      .then((res) => {
        setCompanies(res.data);
        // Ensure selectedDocType is valid for the initial company
        const current = (res.data as Company[]).find((c) => c.id === currentCompanyId);
        if (current && !current.docTypes.includes(currentDocType)) {
          setSelectedDocType(current.docTypes[0] ?? currentDocType);
        }
      })
      .catch(() => toast.error("Failed to load companies"))
      .finally(() => setLoadingCompanies(false));
  }, [currentCompanyId, currentDocType]);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const availableDocTypes = selectedCompany?.docTypes ?? [];

  const handleCompanyChange = (id: string) => {
    setSelectedCompanyId(id);
    const company = companies.find((c) => c.id === id);
    if (company) {
      // Always reset docType to first available when company changes
      setSelectedDocType(company.docTypes[0] ?? "");
    }
  };

  const isUnchanged = selectedCompanyId === currentCompanyId && selectedDocType === currentDocType;

  const handleMove = async () => {
    if (isUnchanged) {
      toast.info("Select a different company or section first");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/documents/${documentId}/move`, {
        companyId: selectedCompanyId !== currentCompanyId ? selectedCompanyId : undefined,
        docType: selectedDocType !== currentDocType ? selectedDocType : undefined,
      });
      toast.success("File moved successfully");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Failed to move file");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <FolderInput className="h-4 w-4 text-[#E8611A]" />
            <h2 className="text-sm font-bold">Move File</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {loadingCompanies ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading companies…
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border/50 px-3 py-2.5 text-sm bg-white focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.label} — {c.category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Section
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border/50 px-3 py-2.5 text-sm bg-white focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
                >
                  {availableDocTypes.map((dt) => (
                    <option key={dt} value={dt}>
                      {DOC_TYPES[dt as keyof typeof DOC_TYPES]?.icon ?? "📄"}{" "}
                      {DOC_TYPES[dt as keyof typeof DOC_TYPES]?.label ?? dt}
                    </option>
                  ))}
                </select>
              </div>
              {isUnchanged && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Change the company or section above to move this file.
                </p>
              )}
            </>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={saving || loadingCompanies}
              className="flex-1 rounded-xl bg-[#E8611A] hover:bg-[#D4550F]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Moving…
                </>
              ) : "Move Here"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
