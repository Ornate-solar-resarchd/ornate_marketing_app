"use client";

import { useUser } from "@clerk/nextjs";
import { hasPermission, type Permission, type Role } from "@ornate/types";

export { hasPermission, type Permission, type Role };

export function usePermission(permission: Permission): boolean {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as Role) || "viewer";
  return hasPermission(role, permission);
}

export function useRole(): Role {
  const { user } = useUser();
  return (user?.publicMetadata?.role as Role) || "viewer";
}
