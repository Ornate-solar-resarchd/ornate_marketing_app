"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  slug: string;
  label: string;
  icon: string;
  companyCount: number;
}

const categoryMeta: Record<string, { gradient: string; glow: string; bg: string }> = {
  "ornate-products": {
    gradient: "from-[#E8611A] via-[#FF7B3A] to-[#FF9A5C]",
    glow: "shadow-orange-200/60",
    bg: "bg-orange-50",
  },
  panels: {
    gradient: "from-[#F59E0B] via-[#FBBF24] to-[#FCD34D]",
    glow: "shadow-amber-200/60",
    bg: "bg-amber-50",
  },
  inverters: {
    gradient: "from-[#10B981] via-[#34D399] to-[#6EE7B7]",
    glow: "shadow-emerald-200/60",
    bg: "bg-emerald-50",
  },
};

export default function CategoryCard({
  slug,
  label,
  icon,
  companyCount,
}: CategoryCardProps) {
  const meta = categoryMeta[slug] || categoryMeta["ornate-products"];

  return (
    <Link href={`/dashboard/${slug}`}>
      <div className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:${meta.glow} hover:-translate-y-2 cursor-pointer`}>
        {/* Background decoration */}
        <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${meta.gradient} opacity-[0.07] transition-all duration-500 group-hover:opacity-[0.15] group-hover:scale-125`} />
        <div className={`absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-gradient-to-br ${meta.gradient} opacity-[0.04] transition-all duration-700 group-hover:opacity-[0.1] group-hover:scale-150`} />

        {/* Icon */}
        <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-2xl shadow-lg ${meta.glow} transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:animate-float`}>
          <span className="drop-shadow-sm">{icon}</span>
        </div>

        {/* Content */}
        <div className="relative mt-5">
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            {label}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className="font-medium text-xs rounded-lg px-2.5 py-1">
              {companyCount} {companyCount === 1 ? "company" : "companies"}
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 transition-all duration-300 group-hover:bg-[#E8611A] group-hover:text-white group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${meta.gradient} transition-all duration-500 group-hover:w-full`} />
      </div>
    </Link>
  );
}
