"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CompanyCard from "@/components/dashboard/CompanyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Building2, Sparkles } from "lucide-react";

interface Company {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  logoUrl: string;
  websiteUrl: string;
}

interface CategoryData {
  id: string;
  slug: string;
  label: string;
  icon: string;
  companies: Company[];
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

      {/* Companies Grid */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Companies</h2>
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
    </div>
  );
}
