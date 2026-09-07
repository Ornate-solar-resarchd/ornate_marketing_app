"use client";

import { useState, useEffect } from "react";
import { X, FolderInput, Loader2, AlertTriangle } from "lucide-react";
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

interface SkippedFile {
  id: string;
  name: string | null;
  reason: string;
}

interface BulkMoveModalProps {
  documentIds: string[];
  currentCompanyId: string;
  currentDocType: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkMoveModal({
  documentIds,
  currentCompanyId,
  currentDocType,
  onClose,
  onSuccess,
}: BulkMoveModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(currentCompanyId);
  const [selectedDocType, setSelectedDocType] = useState(currentDocType);
  const [saving, setSaving] = useState(false);
  // Populated when a move partially succeeds, so the user can see which files
  // stayed behind and why instead of just a count that doesn't add up.
  const [skipped, setSkipped] = useState<SkippedFile[] | null>(null);

  useEffect(() => {
    api.get("/companies")
      .then((res) => {
        setCompanies(res.data);
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
  const count = documentIds.length;

  const handleCompanyChange = (id: string) => {
    setSelectedCompanyId(id);
    const company = companies.find((c) => c.id === id);
    if (company) {
      setSelectedDocType(company.docTypes[0] ?? "");
    }
  };

  const isUnchanged =
    selectedCompanyId === currentCompanyId && selectedDocType === currentDocType;

  const handleMove = async () => {
    if (isUnchanged) {
      toast.info("Select a different company or section first");
      return;
    }
    setSaving(true);
    setSkipped(null);
    try {
      const res = await api.patch("/documents/bulk-move", {
        documentIds,
        companyId: selectedCompanyId !== currentCompanyId ? selectedCompanyId : undefined,
        docType: selectedDocType !== currentDocType ? selectedDocType : undefined,
      });

      const movedCount: number = res.data.movedCount ?? 0;
      const skippedFiles: SkippedFile[] = res.data.skipped ?? [];

      if (movedCount === 0) {
        // Nothing moved — keep the modal open and show why, rather than
        // closing on a toast the user may miss.
        setSkipped(skippedFiles);
        toast.error("No files were moved");
        return;
      }

      if (skippedFiles.length > 0) {
        toast.warning(
          `Moved ${movedCount} of ${count} files — ${skippedFiles.length} skipped`
        );
        setSkipped(skippedFiles);
        onSuccess();
        return;
      }

      toast.success(`${movedCount} file${movedCount === 1 ? "" : "s"} moved`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Failed to move files");
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
            <h2 className="text-sm font-bold">
              Move {count} File{count === 1 ? "" : "s"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
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
                  Change the company or section above to move these files.
                </p>
              )}
              {skipped && skipped.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {skipped.length} file{skipped.length === 1 ? "" : "s"} not moved
                  </p>
                  <ul className="mt-1.5 max-h-28 space-y-1 overflow-y-auto">
                    {skipped.map((f) => (
                      <li key={f.id} className="text-[11px] text-amber-700/90">
                        <span className="font-medium">{f.name ?? f.id}</span> — {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              {skipped && skipped.length > 0 ? "Done" : "Cancel"}
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
              ) : (
                `Move ${count} Here`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
