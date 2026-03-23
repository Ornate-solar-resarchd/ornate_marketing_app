"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { DOC_TYPES, type DocTypeKey } from "@ornate/types";

interface SearchResult {
  company: {
    id: string;
    slug: string;
    label: string;
    logoUrl: string;
    categorySlug: string;
    categoryLabel: string;
  };
  documents: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    docType: string;
    highlight: string;
    companyId: string;
  }>;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (categoryFilter) params.set("category", categoryFilter);
        if (docTypeFilter) params.set("docType", docTypeFilter);

        const res = await api.get<SearchResponse>(`/search?${params}`);
        setResults(res.data.results);
        setTotal(res.data.total);
        setOpen(true);
      } catch {
        console.error("Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, categoryFilter, docTypeFilter]);

  return (
    <div ref={ref} className="relative w-full max-w-lg">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#E8611A]" />
        <Input
          placeholder="Search collateral..."
          className="pl-10 pr-8 rounded-xl border-border/50 bg-muted/30 transition-all focus:bg-white focus:shadow-md focus:border-[#E8611A]/30 focus:ring-1 focus:ring-[#E8611A]/10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-muted transition-all hover:bg-muted-foreground/20 hover:scale-110"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {open && (
        <div className="mt-2 flex gap-2 animate-fade-in">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-xs transition-all hover:border-[#E8611A]/30 focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
          >
            <option value="">All Categories</option>
            <option value="ornate-products">Ornate Products</option>
            <option value="panels">Panels</option>
            <option value="inverters">Inverters</option>
          </select>
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="rounded-lg border border-border/50 bg-white px-2.5 py-1.5 text-xs transition-all hover:border-[#E8611A]/30 focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
          >
            <option value="">All Types</option>
            {Object.entries(DOC_TYPES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.icon} {val.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Results dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-2xl border border-border/50 bg-white shadow-xl animate-fade-in-up">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E8611A] border-t-transparent" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <Search className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No results found
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Try different keywords or filters
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 border-b border-border/50 px-4 py-2.5">
                <Sparkles className="h-3 w-3 text-[#E8611A]" />
                <span className="text-xs font-medium text-muted-foreground">
                  {total} result{total !== 1 ? "s" : ""} found
                </span>
              </div>
              {results.map((group) => (
                <div key={group.company.id}>
                  <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span>{group.company.label}</span>
                    <span className="text-muted-foreground/40">&middot;</span>
                    <span className="text-muted-foreground/60">{group.company.categoryLabel}</span>
                  </div>
                  {group.documents.map((doc) => (
                    <button
                      key={doc.id}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-orange-50/50"
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        router.push(`/dashboard/${group.company.categorySlug}/${group.company.slug}`);
                      }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8611A] to-[#FF8A50]">
                        <FileText className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium"
                          dangerouslySetInnerHTML={{ __html: doc.highlight }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPES[doc.docType as DocTypeKey]?.label || doc.docType}{" "}
                          &middot; {formatBytes(doc.sizeBytes)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
