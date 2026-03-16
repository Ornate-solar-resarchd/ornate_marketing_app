"use client";

import { usePermission } from "@/lib/permissions";
import type { Permission } from "@ornate/types";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function PermissionGate({
  permission,
  children,
}: PermissionGateProps) {
  const allowed = usePermission(permission);
  if (!allowed) return null;
  return <>{children}</>;
}
