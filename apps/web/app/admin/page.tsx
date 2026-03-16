"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES, type Role } from "@ornate/types";
import api from "@/lib/api";
import { toast } from "sonner";
import { Users, FileText, Shield, Activity, Sparkles } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  role: string;
  createdAt: number;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  docId: string | null;
  companyId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/audit-logs?limit=50"),
      ]);
      setUsers(usersRes.data);
      setAuditLogs(logsRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success("Role updated");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      toast.error("Failed to update role");
    }
  };

  const roleBadgeStyles: Record<string, string> = {
    super_admin: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    admin: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
    manager: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    viewer: "bg-muted text-muted-foreground",
  };

  const actionStyles: Record<string, { bg: string; text: string }> = {
    upload: { bg: "bg-emerald-50", text: "text-emerald-700" },
    delete: { bg: "bg-red-50", text: "text-red-700" },
    share: { bg: "bg-blue-50", text: "text-blue-700" },
    download: { bg: "bg-amber-50", text: "text-amber-700" },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#E8611A]/10 blur-2xl" />
        <div className="absolute right-24 top-6 h-2 w-2 rounded-full bg-purple-400 animate-float" />

        <div className="relative">
          <div className="flex items-center gap-2 text-purple-300">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Administration</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="mt-2 max-w-lg text-sm text-white/60">
            Manage users, roles, and view audit logs for all platform activity.
          </p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            tab === "users"
              ? "bg-[#E8611A] text-white shadow-md shadow-orange-200/30 scale-105"
              : "bg-white border border-border/50 text-muted-foreground hover:text-foreground hover:border-[#E8611A]/30"
          }`}
        >
          <Users className="h-4 w-4" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab("audit")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            tab === "audit"
              ? "bg-[#E8611A] text-white shadow-md shadow-orange-200/30 scale-105"
              : "bg-white border border-border/50 text-muted-foreground hover:text-foreground hover:border-[#E8611A]/30"
          }`}
        >
          <Activity className="h-4 w-4" />
          Audit Log
        </button>
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm animate-fade-in-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.imageUrl}
                        alt=""
                        className="h-9 w-9 rounded-xl ring-2 ring-border/50 object-cover"
                      />
                      <span className="font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${roleBadgeStyles[user.role] || "bg-muted text-muted-foreground"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="rounded-xl border border-border/50 bg-background px-3 py-1.5 text-sm transition-all hover:border-[#E8611A]/30 focus:border-[#E8611A] focus:outline-none focus:ring-1 focus:ring-[#E8611A]/20"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === "audit" && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm animate-fade-in-up">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User ID</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, index) => {
                const style = actionStyles[log.action] || { bg: "bg-gray-50", text: "text-gray-700" };
                return (
                  <tr
                    key={log.id}
                    className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {log.userId.slice(0, 12)}...
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.meta
                        ? JSON.stringify(log.meta).slice(0, 60)
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
