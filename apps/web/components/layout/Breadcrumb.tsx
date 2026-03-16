"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  "ornate-products": "Ornate Solar Products",
  panels: "Panels",
  inverters: "Inverters",
  admin: "Admin",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 px-6 py-3 text-sm animate-fade-in">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label =
          labelMap[segment] ||
          segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            {isLast ? (
              <span className="rounded-lg bg-muted/40 px-2.5 py-1 font-semibold text-foreground text-xs">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="rounded-lg px-2 py-1 text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground text-xs"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
