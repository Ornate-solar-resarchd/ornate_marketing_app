"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CompanyCard from "@/components/dashboard/CompanyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Building2, Sparkles, FolderTree, ChevronRight } from "lucide-react";

interface Company {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  logoUrl: string;
  websiteUrl: string;
}

interface SubCategory {
  id: string;
  slug: string;
  label: string;
  icon: string;
  _count?: { companies: number };
}

interface CategoryData {
  id: string;
  slug: string;
  label: string;
  icon: string;
  companies: Company[];
  subCategories?: SubCategory[];
}

const categoryGradients: Record<string, { from: string; to: string; accent: string }> = {
  "ornate-products": { from: "#E8611A", to: "#FF8A50", accent: "orange" },
  panels: { from: "#F59E0B", to: "#FBBF24", accent: "amber" },
  inverters: { from: "#10B981", to: "#34D399", accent: "emerald" },
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/categories/${categorySlug}`)
      .then((res) => setCategory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug]);

  const colors = categoryGradients[categorySlug] || categoryGradients["ornate-products"];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground">Category not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Category Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-20 top-6 h-2 w-2 rounded-full bg-white/60 animate-float" />
        <div className="absolute right-40 bottom-6 h-1.5 w-1.5 rounded-full bg-white/40 animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-lg backdrop-blur-sm animate-scale-in">
            {category.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Category</span>
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{category.label}</h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <Building2 className="h-3.5 w-3.5" />
              {category.companies.length} {category.companies.length === 1 ? "company" : "companies"}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Categories Grid (if any) */}
      {category.subCategories && category.subCategories.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground">Component Types</h2>
          <p className="text-sm text-muted-foreground">Select a component type to view brands</p>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.subCategories.map((sc) => (
              <Link
                key={sc.id}
                href={`/dashboard/${categorySlug}/s/${sc.slug}`}
                className="group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-[#E8611A]/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-2xl">
                  {sc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{sc.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <FolderTree className="inline h-3 w-3 mr-1" />
                    {sc._count?.companies ?? 0} brand{(sc._count?.companies ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#E8611A]" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Companies Grid (only direct children — not those under sub-categories) */}
      {category.companies.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground">
            {category.subCategories && category.subCategories.length > 0 ? "Other Companies" : "Companies"}
          </h2>
          <p className="text-sm text-muted-foreground">Select a company to view marketing collateral</p>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {category.companies.map((company) => (
              <CompanyCard
                key={company.id}
                slug={company.slug}
                label={company.label}
                icon={company.icon}
                color={company.color}
                logoUrl={company.logoUrl}
                websiteUrl={company.websiteUrl}
                categorySlug={categorySlug}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
