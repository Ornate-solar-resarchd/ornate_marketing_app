"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type LibrarySort = "date" | "name" | "size";

export interface LibraryFilters {
  q: string;
  docType: string[];
  category: string[];
  company: string[];
  mimeType: string[];
  sort: LibrarySort;
  page: number;
}

function readCsv(sp: URLSearchParams, key: string): string[] {
  const v = sp.get(key);
  return v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

/**
 * Read + mutate the URL query string as the source of truth for the
 * Library page filters. Survives refresh, supports back/forward, and
 * makes the current view shareable as a URL.
 */
export function useLibraryFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const filters: LibraryFilters = useMemo(
    () => ({
      q: params.get("q") ?? "",
      docType: readCsv(params, "docType"),
      category: readCsv(params, "category"),
      company: readCsv(params, "company"),
      mimeType: readCsv(params, "mimeType"),
      sort: (params.get("sort") as LibrarySort) || "date",
      page: Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1),
    }),
    [params]
  );

  const write = useCallback(
    (next: Partial<LibraryFilters>) => {
      const sp = new URLSearchParams(params.toString());
      const merged: LibraryFilters = { ...filters, ...next };

      const setOrDelete = (key: string, value: string) => {
        if (value) sp.set(key, value);
        else sp.delete(key);
      };
      const setOrDeleteArr = (key: string, value: string[]) =>
        setOrDelete(key, value.join(","));

      setOrDelete("q", merged.q);
      setOrDeleteArr("docType", merged.docType);
      setOrDeleteArr("category", merged.category);
      setOrDeleteArr("company", merged.company);
      setOrDeleteArr("mimeType", merged.mimeType);
      setOrDelete("sort", merged.sort === "date" ? "" : merged.sort);
      // Reset to page 1 whenever a filter (other than `page`) changes.
      const filterChanged = Object.keys(next).some((k) => k !== "page");
      const page = filterChanged ? 1 : merged.page;
      setOrDelete("page", page > 1 ? String(page) : "");

      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [filters, params, router]
  );

  const toggle = useCallback(
    (facet: "docType" | "category" | "company" | "mimeType", value: string) => {
      const cur = filters[facet];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      write({ [facet]: next });
    },
    [filters, write]
  );

  const remove = useCallback(
    (facet: "docType" | "category" | "company" | "mimeType", value: string) => {
      write({ [facet]: filters[facet].filter((v) => v !== value) });
    },
    [filters, write]
  );

  const clearAll = useCallback(() => {
    router.replace("?", { scroll: false });
  }, [router]);

  const totalActive =
    filters.docType.length +
    filters.category.length +
    filters.company.length +
    filters.mimeType.length +
    (filters.q ? 1 : 0);

  return { filters, write, toggle, remove, clearAll, totalActive };
}
