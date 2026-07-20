"use client";

import { useEffect, useState } from "react";
import { Megaphone, Pin, Newspaper, RefreshCw, AlertTriangle, X } from "lucide-react";
import api from "@/lib/api";
import { usePermission } from "@/lib/permissions";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "news" | "update" | "alert";
  isPinned: boolean;
  authorName: string;
  createdAt: string;
}

const TYPE_CONFIG = {
  news: {
    label: "News",
    icon: Newspaper,
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  update: {
    label: "Update",
    icon: RefreshCw,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  alert: {
    label: "Alert",
    icon: AlertTriangle,
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const canManage = usePermission("manage_companies");

  const fetchAnnouncements = () => {
    setLoading(true);
    api
      .get("/announcements")
      .then((res) => setAnnouncements(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement removed");
    } catch {
      toast.error("Failed to remove announcement");
    }
  };

  if (loading) {
    return (
      <div className="mb-8 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-[#E8611A]" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Announcements</h2>
      </div>

      <div className="space-y-3">
        {announcements.map((ann) => {
          const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.news;
          const Icon = cfg.icon;
          return (
            <div
              key={ann.id}
              className={`relative rounded-xl border px-4 py-3.5 ${cfg.bg} ${cfg.border}`}
            >
              {ann.isPinned && (
                <div className="absolute right-3 top-3">
                  <Pin className="h-3 w-3 text-[#E8611A] fill-[#E8611A]" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.badge}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[12px] font-semibold text-gray-900">{ann.title}</span>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{ann.body}</p>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {ann.authorName} · {timeAgo(ann.createdAt)}
                  </p>
                </div>
              </div>

              {canManage && (
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="absolute bottom-3 right-3 rounded-md p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
                  title="Remove announcement"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
