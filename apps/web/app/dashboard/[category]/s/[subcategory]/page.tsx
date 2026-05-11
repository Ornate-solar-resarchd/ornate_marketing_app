"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CompanyCard from "@/components/dashboard/CompanyCard";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { Building2, ChevronRight, Sparkles } from "lucide-react";

interface Company {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  logoUrl: string;
  websiteUrl: string;
}

interface SubCategoryData {
  id: string;
  slug: string;
  label: string;
  icon: string;
  companies: Company[];
  category: { slug: string; label: string };
}

export default function SubCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const subSlug = params.subcategory as string;
  const [data, setData] = useState<SubCategoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/subcategories/${subSlug}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [subSlug]);

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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground">Sub-category not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href="/dashboard" className="hover:text-[#E8611A]">Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/dashboard/${categorySlug}`} className="hover:text-[#E8611A]">{data.category.label}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{data.label}</span>
      </nav>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white shadow-xl bg-gradient-to-br from-[#E8611A] to-[#FF8A50]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-lg backdrop-blur-sm">
            {data.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Component Type</span>
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{data.label}</h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <Building2 className="h-3.5 w-3.5" />
              {data.companies.length} {data.companies.length === 1 ? "brand" : "brands"}
            </div>
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Brands</h2>
        <p className="text-sm text-muted-foreground">Select a brand to view marketing collateral</p>

        {data.companies.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">No brands yet — create one from the Admin panel.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {data.companies.map((company) => (
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
        )}
      </div>
    </div>
  );
}
