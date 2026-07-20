"use client";

import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

interface RenameModalProps {
  documentId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenameModal({ documentId, currentName, onClose, onSuccess }: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) { onClose(); return; }
    setSaving(true);
    try {
      await api.patch(`/documents/${documentId}/rename`, { name: trimmed });
      toast.success("File renamed");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to rename file");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#E8611A]" />
            <h2 className="text-sm font-bold">Rename File</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="mt-1.5 w-full rounded-xl border border-border/50 px-3 py-2.5 text-sm focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 rounded-xl bg-[#E8611A] hover:bg-[#D4550F]"
            >
              {saving ? "Saving…" : "Rename"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
