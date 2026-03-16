"use client";

import { useEffect, useState } from "react";
import CategoryCard from "@/components/dashboard/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api";
import { Sparkles } from "lucide-react";

interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string;
  order: number;
  _count: { companies: number };
}

export default function DashboardPage() {
  const { user } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] p-8 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#E8611A]/20 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#FF8A50]/10 blur-2xl" />
        <div className="absolute right-20 top-4 h-2 w-2 rounded-full bg-[#E8611A] animate-float" />
        <div className="absolute right-40 bottom-8 h-1.5 w-1.5 rounded-full bg-[#FF8A50] animate-float" style={{ animationDelay: "1s" }} />

        <div className="relative">
          <div className="flex items-center gap-2 text-[#FF8A50]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Marketing Hub</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {greeting()}, {user?.firstName || "there"}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/60">
            Browse and manage marketing collateral across all Ornate Solar product categories, panel brands, and inverter partners.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Product Categories</h2>
            <p className="text-sm text-muted-foreground">
              Select a category to explore marketing materials
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))
            : categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  slug={cat.slug}
                  label={cat.label}
                  icon={cat.icon}
                  companyCount={cat._count.companies}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
