"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Shield,
  Menu,
  X,
  ChevronRight,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Role } from "@ornate/types";
import api from "@/lib/api";

interface Category {
  id: string;
  slug: string;
  label: string;
  icon: string;
  section: string;
  order: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as Role) || "viewer";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const ornateItems = categories.filter((c) => c.section === "ornate");
  const partnerItems = categories.filter((c) => c.section === "partners");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const renderCatItem = (cat: Category, index: number) => (
    <Link
      key={cat.slug}
      href={`/dashboard/${cat.slug}`}
      onClick={() => setMobileOpen(false)}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive(`/dashboard/${cat.slug}`)
          ? "bg-gradient-to-r from-[#FEF0E8] to-[#FFF5F0] text-[#E8611A] shadow-sm"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all duration-200",
          isActive(`/dashboard/${cat.slug}`)
            ? "bg-[#E8611A] shadow-md shadow-orange-200"
            : "bg-muted/80 group-hover:bg-muted"
        )}
      >
        {cat.icon}
      </div>
      <span className="flex-1">{cat.label}</span>
      {isActive(`/dashboard/${cat.slug}`) && (
        <ChevronRight className="h-4 w-4 text-[#E8611A]/60" />
      )}
    </Link>
  );

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="flex h-[60px] items-center gap-3 border-b border-border/50 px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png"
          alt="Ornate Solar"
          className="h-9 w-auto object-contain"
        />
        <span className="text-sm font-bold bg-gradient-to-r from-[#E8611A] to-[#FF8A50] bg-clip-text text-transparent">
          Collateral Hub
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-[#FEF0E8] to-[#FFF5F0] text-[#E8611A] shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
              pathname === "/dashboard"
                ? "bg-[#E8611A] text-white shadow-md shadow-orange-200"
                : "bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            )}>
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="flex-1">Dashboard</span>
            {pathname === "/dashboard" && <ChevronRight className="h-4 w-4 text-[#E8611A]/60" />}
          </Link>
        </div>

        {/* Ornate Solar Section */}
        {ornateItems.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ornate Solar
            </p>
            <div className="space-y-1">
              {ornateItems.map((cat, i) => renderCatItem(cat, i + 1))}
            </div>
          </div>
        )}

        {/* Partners / Categories */}
        {partnerItems.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Partners
            </p>
            <div className="space-y-1">
              {partnerItems.map((cat, i) => renderCatItem(cat, i + 4))}
            </div>
          </div>
        )}

        {/* Tools */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
          <div className="space-y-1">
            <Link
              href="/dashboard/library"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive("/dashboard/library")
                  ? "bg-gradient-to-r from-[#FEF0E8] to-[#FFF5F0] text-[#E8611A] shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                isActive("/dashboard/library")
                  ? "bg-[#E8611A] text-white shadow-md shadow-orange-200"
                  : "bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
              )}>
                <Library className="h-4 w-4" />
              </div>
              <span className="flex-1">Library</span>
              {isActive("/dashboard/library") && <ChevronRight className="h-4 w-4 text-[#E8611A]/60" />}
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Link */}
      {role === "super_admin" && (
        <div className="border-t border-border/50 px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Administration
          </p>
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname.startsWith("/admin")
                ? "bg-gradient-to-r from-purple-50 to-purple-50/50 text-purple-700 shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
              pathname.startsWith("/admin")
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-muted/80 text-muted-foreground group-hover:bg-muted"
            )}>
              <Shield className="h-4 w-4" />
            </div>
            <span className="flex-1">Admin Panel</span>
          </Link>
        </div>
      )}

      {/* Bottom gradient accent */}
      <div className="h-1 bg-gradient-to-r from-[#E8611A] via-[#FF8A50] to-[#FFB088]" />
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-4 top-4 z-50 rounded-xl bg-white p-2.5 shadow-lg border border-border/50 md:hidden transition-transform active:scale-95"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-border/50 bg-white/95 backdrop-blur-sm transition-transform duration-300 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
