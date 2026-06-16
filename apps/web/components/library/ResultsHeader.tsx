"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLibraryFilters } from "@/lib/useLibraryFilters";

interface Props {
  total: number;
  loading?: boolean;
}

const SORT_OPTIONS: Array<{ value: "date" | "name" | "size"; label: string }> = [
  { value: "date", label: "Newest first" },
  { value: "name", label: "A → Z" },
  { value: "size", label: "Largest first" },
];

export default function ResultsHeader({ total, loading }: Props) {
  const { filters, write } = useLibraryFilters();
  const [qInput, setQInput] = useState(filters.q);
  const [open, setOpen] = useState(false);

  // Listen for chip-driven "clear q" requests so the input stays in sync.
  useEffect(() => {
    const onClear = () => {
      setQInput("");
      write({ q: "" });
    };
    window.addEventListener("library:clear-q", onClear);
    return () => window.removeEventListener("library:clear-q", onClear);
  }, [write]);

  // Sync if URL changes outside this component (e.g. clearAll).
  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  // Debounce search box → URL.
  useEffect(() => {
    if (qInput === filters.q) return;
    const t = setTimeout(() => write({ q: qInput }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const currentSort =
    SORT_OPTIONS.find((s) => s.value === filters.sort) ?? SORT_OPTIONS[0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <p className="text-sm text-[#374151]">
          {loading ? (
            <span className="text-[#9CA3AF]">Loading…</span>
          ) : (
            <>
              <span className="text-base font-semibold text-[#1A1A1A]">
                {total.toLocaleString()}
              </span>{" "}
              results found
            </>
          )}
        </p>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search documents…"
            className="h-9 w-64 rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#E8611A] focus:outline-none focus:ring-2 focus:ring-[#E8611A]/15"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#374151]">Sort by</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#E8611A]"
          >
            {currentSort.label}
            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>
          {open && (
            <ul className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      write({ sort: opt.value });
                      setOpen(false);
                    }}
                    className={
                      "block w-full px-3 py-2 text-left text-sm hover:bg-[#FEF0E8] hover:text-[#E8611A]" +
                      (opt.value === filters.sort
                        ? " bg-[#FEF0E8] text-[#E8611A]"
                        : " text-[#374151]")
                    }
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
