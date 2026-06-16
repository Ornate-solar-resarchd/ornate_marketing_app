"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Library as LibraryIcon } from "lucide-react";

import api from "@/lib/api";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import FilterSidebar, { type LibraryFacets } from "@/components/library/FilterSidebar";
import FilterChips from "@/components/library/FilterChips";
import ResultsHeader from "@/components/library/ResultsHeader";
import LibraryRow, { type LibraryDocument } from "@/components/library/LibraryRow";
import { Skeleton } from "@/components/ui/skeleton";

interface LibraryResponse {
  documents: LibraryDocument[];
  total: number;
  page: number;
  limit: number;
  facets: LibraryFacets;
}

function LibraryView() {
  const { filters } = useLibraryFilters();
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build the query string this page uses to call the backend.
  const queryKey = useMemo(
    () =>
      JSON.stringify({
        q: filters.q,
        docType: filters.docType.join(","),
        category: filters.category.join(","),
        company: filters.company.join(","),
        mimeType: filters.mimeType.join(","),
        sort: filters.sort,
        page: filters.page,
      }),
    [filters]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.docType.length) params.set("docType", filters.docType.join(","));
    if (filters.category.length) params.set("category", filters.category.join(","));
    if (filters.company.length) params.set("company", filters.company.join(","));
    if (filters.mimeType.length) params.set("mimeType", filters.mimeType.join(","));
    if (filters.sort !== "date") params.set("sort", filters.sort);
    if (filters.page > 1) params.set("page", String(filters.page));

    api
      .get<LibraryResponse>(`/library?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Library fetch failed", err);
          setError("Couldn't load documents. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const facets: LibraryFacets =
    data?.facets ?? { docType: [], category: [], company: [] };

  const companyLabels = Object.fromEntries(
    facets.company.map((f) => [f.value, f.label ?? f.value])
  );
  const categoryLabels = Object.fromEntries(
    facets.category.map((f) => [f.value, f.label ?? f.value])
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8611A] text-white">
          <LibraryIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Library</h1>
          <p className="text-sm text-[#6B7280]">
            Search and filter across every company, category, and document type.
          </p>
        </div>
      </header>

      <div className="flex gap-4">
        <FilterSidebar facets={facets} />

        <section className="flex-1 space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <ResultsHeader total={data?.total ?? 0} loading={loading} />

          <FilterChips
            labels={{ company: companyLabels, category: categoryLabels }}
          />

          <div className="divide-y divide-[#E5E7EB]">
            {loading && !data && (
              <div className="space-y-2 py-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}

            {error && (
              <div className="py-12 text-center text-sm text-[#DC2626]">
                {error}
              </div>
            )}

            {!loading && !error && data && data.documents.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-[#1A1A1A]">
                  No documents match these filters
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Try removing a chip above or expanding the search.
                </p>
              </div>
            )}

            {data?.documents.map((doc) => (
              <LibraryRow key={doc.id} doc={doc} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > data.limit && (
            <Pager
              page={data.page}
              totalPages={Math.ceil(data.total / data.limit)}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function Pager({ page, totalPages }: { page: number; totalPages: number }) {
  const { write } = useLibraryFilters();
  return (
    <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-sm text-[#6B7280]">
      <span>
        Page <span className="font-semibold text-[#1A1A1A]">{page}</span> of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => write({ page: page - 1 })}
          className="rounded-md border border-[#E5E7EB] px-3 py-1.5 font-medium text-[#1A1A1A] hover:border-[#E8611A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => write({ page: page + 1 })}
          className="rounded-md border border-[#E5E7EB] px-3 py-1.5 font-medium text-[#1A1A1A] hover:border-[#E8611A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  // Suspense boundary is required because useSearchParams() reads CSR-only state.
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full" />}>
      <LibraryView />
    </Suspense>
  );
}
