"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CompanyCard from "@/components/dashboard/CompanyCard";
import PermissionGate from "@/components/rbac/PermissionGate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toast } from "sonner";
import { Building2, ChevronRight, Sparkles, Plus, X, Pencil, Trash2 } from "lucide-react";

const DEFAULT_DOC_TYPES = ["brochure", "datasheet", "images", "compliance", "casestudy"];
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
  category: { id: string; slug: string; label: string };
}

export default function SubCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const subSlug = params.subcategory as string;
  const [data, setData] = useState<SubCategoryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Add/Edit manufacturer modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mfName, setMfName] = useState("");
  const [mfIcon, setMfIcon] = useState("🏭");
  const [mfColor, setMfColor] = useState("#6B7280");
  const [mfLogoUrl, setMfLogoUrl] = useState("");
  const [mfWebsite, setMfWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = () =>
    api.get(`/subcategories/${subSlug}`).then((res) => setData(res.data));

  useEffect(() => {
    reload().catch(console.error).finally(() => setLoading(false));
  }, [subSlug]);

  const openAdd = () => {
    setEditingId(null);
    setMfName(""); setMfIcon("🏭"); setMfColor("#6B7280");
    setMfLogoUrl(""); setMfWebsite("");
    setShowModal(true);
  };

  const openEdit = (c: Company) => {
    setEditingId(c.id);
    setMfName(c.label);
    setMfIcon(c.icon || "🏭");
    setMfColor(c.color || "#6B7280");
    setMfLogoUrl(c.logoUrl || "");
    setMfWebsite(c.websiteUrl || "");
    setShowModal(true);
  };

  const handleDelete = async (c: Company) => {
    if (!confirm(`Delete "${c.label}" and ALL its uploaded files? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/companies/${c.id}`);
      toast.success(`Deleted "${c.label}"`);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    if (!mfName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        label: mfName.trim(),
        icon: mfIcon || "🏭",
        color: mfColor || "#6B7280",
        logoUrl: mfLogoUrl.trim() || "https://ornatesolar.com/wp-content/uploads/2023/10/Ornate-logo-02-e1697005298472.png",
        websiteUrl: mfWebsite.trim() || "https://ornatesolar.com",
      };
      if (editingId) {
        await api.patch(`/admin/companies/${editingId}`, payload);
        toast.success(`Updated "${mfName}"`);
      } else {
        await api.post("/admin/companies", {
          ...payload,
          slug: slugify(mfName),
          docTypes: DEFAULT_DOC_TYPES,
          categoryId: (data as any).category.id,
          subCategoryId: data.id,
        });
        toast.success(`Manufacturer "${mfName}" added`);
      }
      setShowModal(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-foreground">Manufacturers</h2>
            <p className="text-sm text-muted-foreground">Select a manufacturer to view marketing collateral</p>
          </div>
          <PermissionGate permission="manage_companies">
            <Button onClick={openAdd} className="bg-[#E8611A] hover:bg-[#D4550F]">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Manufacturer
            </Button>
          </PermissionGate>
        </div>

        {data.companies.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">No manufacturers yet.</p>
            <PermissionGate permission="manage_companies">
              <Button onClick={openAdd} className="mt-4 bg-[#E8611A] hover:bg-[#D4550F]">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Your First Manufacturer
              </Button>
            </PermissionGate>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
            {data.companies.map((company) => (
              <div key={company.id} className="relative group">
                <CompanyCard
                  slug={company.slug}
                  label={company.label}
                  icon={company.icon}
                  color={company.color}
                  logoUrl={company.logoUrl}
                  websiteUrl={company.websiteUrl}
                  categorySlug={categorySlug}
                />
                <PermissionGate permission="manage_companies">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(company); }}
                      title="Edit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md border border-border/40 text-[#E8611A] hover:bg-orange-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(company); }}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md border border-border/40 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </PermissionGate>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Manufacturer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
             onClick={() => setShowModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl animate-scale-in max-h-[90vh] overflow-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border/50 p-5">
              <div>
                <h3 className="text-lg font-bold tracking-tight">{editingId ? "Edit Manufacturer" : "Add Manufacturer"}</h3>
                <p className="text-xs text-muted-foreground">{data.category.label} → {data.label}</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name *</label>
                <input required type="text" value={mfName} onChange={(e) => setMfName(e.target.value)}
                  placeholder="e.g. BYD, CATL, Sungrow"
                  className="mt-1 w-full rounded-xl border border-border/50 px-3 py-2 text-sm focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Icon</label>
                  <input type="text" value={mfIcon} onChange={(e) => setMfIcon(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border/50 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color</label>
                  <input type="color" value={mfColor} onChange={(e) => setMfColor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border/50 px-1 py-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logo URL (optional)</label>
                <input type="url" value={mfLogoUrl} onChange={(e) => setMfLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-border/50 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website (optional)</label>
                <input type="url" value={mfWebsite} onChange={(e) => setMfWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-border/50 px-3 py-2 text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">
                Default sections (brochure, datasheet, images, compliance, case study) will be created where you can upload files.
              </p>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-[#E8611A] hover:bg-[#D4550F]">
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Add Manufacturer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
