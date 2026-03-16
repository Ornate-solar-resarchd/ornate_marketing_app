"use client";

import Link from "next/link";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CompanyCardProps {
  slug: string;
  label: string;
  icon: string;
  color: string;
  logoUrl: string;
  websiteUrl: string;
  categorySlug: string;
}

export default function CompanyCard({
  slug,
  label,
  icon,
  color,
  logoUrl,
  websiteUrl,
  categorySlug,
}: CompanyCardProps) {
  return (
    <Link href={`/dashboard/${categorySlug}/${slug}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer">
        {/* Top color accent bar */}
        <div
          className="h-1.5 w-full transition-all duration-300 group-hover:h-2"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        />

        {/* Background glow */}
        <div
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06] transition-all duration-500 group-hover:opacity-[0.12] group-hover:scale-150"
          style={{ backgroundColor: color }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between">
            <Avatar className="h-12 w-12 rounded-xl ring-2 ring-border/50 transition-all duration-300 group-hover:ring-4 group-hover:shadow-lg" style={{ ['--tw-ring-color' as string]: `${color}30` }}>
              <AvatarImage src={logoUrl} alt={label} className="object-contain p-1" />
              <AvatarFallback className="rounded-xl text-lg font-bold" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(websiteUrl, "_blank", "noopener,noreferrer");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all duration-200 hover:bg-[#E8611A] hover:text-white hover:scale-110 active:scale-95"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <h3 className="mt-4 text-base font-bold text-foreground tracking-tight group-hover:text-[#E8611A] transition-colors duration-200">
            {label}
          </h3>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-[#E8611A] transition-colors duration-200">
            <span>View collateral</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
