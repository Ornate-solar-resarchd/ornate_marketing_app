"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { docTypeLabel } from "@/lib/docTypes";
import { useLibraryFilters } from "@/lib/useLibraryFilters";

interface FacetOption {
  value: string;
  label?: string;
  count: number;
}

export interface LibraryFacets {
  docType: FacetOption[];
  category: FacetOption[];
  company: FacetOption[];
}

interface Props {
  facets: LibraryFacets;
}

const MIME_GROUPS: FacetOption[] = [
  { value: "application/pdf", label: "PDF", count: 0 },
  { value: "image/", label: "Image", count: 0 },
  { value: "video/", label: "Video", count: 0 },
];

export default function FilterSidebar({ facets }: Props) {
  return (
    <aside className="w-[260px] shrink-0 space-y-1 rounded-xl bg-white p-4 shadow-sm">
      <FacetGroup
        title="Document Type"
        facet="docType"
        options={facets.docType.map((o) => ({
          ...o,
          label: docTypeLabel(o.value),
        }))}
        defaultOpen
      />
      <FacetGroup
        title="Product"
        facet="company"
        options={facets.company}
      />
      <FacetGroup
        title="Category"
        facet="category"
        options={facets.category}
      />
      <FacetGroup
        title="File Type"
        facet="mimeType"
        options={MIME_GROUPS}
      />
    </aside>
  );
}

interface FacetGroupProps {
  title: string;
  facet: "docType" | "category" | "company" | "mimeType";
  options: FacetOption[];
  defaultOpen?: boolean;
}

function FacetGroup({ title, facet, options, defaultOpen }: FacetGroupProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const { filters, toggle } = useLibraryFilters();
  const selected = new Set(filters[facet]);

  return (
    <div className="border-b border-[#E5E7EB] py-2 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-1 py-2 text-left text-sm font-semibold text-[#1A1A1A] transition-colors hover:text-[#E8611A]"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {options.length === 0 && (
            <li className="px-1 py-1.5 text-xs text-[#9CA3AF]">
              No options
            </li>
          )}
          {options.map((opt) => {
            const isChecked = selected.has(opt.value);
            return (
              <li key={opt.value}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors",
                    isChecked
                      ? "text-[#E8611A]"
                      : "text-[#374151] hover:bg-[#F4F5F7]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(facet, opt.value)}
                    className="h-4 w-4 cursor-pointer accent-[#E8611A]"
                  />
                  <span className="flex-1 truncate">{opt.label ?? opt.value}</span>
                  {opt.count > 0 && (
                    <span className="text-xs text-[#9CA3AF]">
                      {opt.count}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
