"use client";

import { X } from "lucide-react";
import { docTypeLabel } from "@/lib/docTypes";
import { useLibraryFilters } from "@/lib/useLibraryFilters";

interface Props {
  /** Optional human-friendly labels per facet — falls back to the value itself. */
  labels?: {
    company?: Record<string, string>;
    category?: Record<string, string>;
  };
}

const MIME_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "image/": "Image",
  "video/": "Video",
};

export default function FilterChips({ labels }: Props) {
  const { filters, remove, clearAll, totalActive } = useLibraryFilters();
  if (totalActive === 0) return null;

  const chips: Array<{
    facet: "docType" | "category" | "company" | "mimeType" | "q";
    value: string;
    label: string;
  }> = [];

  if (filters.q) {
    chips.push({ facet: "q", value: filters.q, label: `"${filters.q}"` });
  }
  filters.docType.forEach((v) =>
    chips.push({ facet: "docType", value: v, label: docTypeLabel(v) })
  );
  filters.company.forEach((v) =>
    chips.push({
      facet: "company",
      value: v,
      label: labels?.company?.[v] ?? v,
    })
  );
  filters.category.forEach((v) =>
    chips.push({
      facet: "category",
      value: v,
      label: labels?.category?.[v] ?? v,
    })
  );
  filters.mimeType.forEach((v) =>
    chips.push({ facet: "mimeType", value: v, label: MIME_LABEL[v] ?? v })
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.facet}-${c.value}`}
          type="button"
          onClick={() => {
            if (c.facet === "q") {
              // Handled separately — clear the search box too.
              const evt = new CustomEvent("library:clear-q");
              window.dispatchEvent(evt);
              return;
            }
            remove(c.facet, c.value);
          }}
          className="group inline-flex items-center gap-1.5 rounded-full bg-[#F4F5F7] px-3 py-1.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#FEF0E8] hover:text-[#E8611A]"
        >
          <span className="max-w-[160px] truncate">{c.label}</span>
          <X className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="ml-1 text-sm font-semibold text-[#1A1A1A] underline-offset-2 hover:text-[#E8611A] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
