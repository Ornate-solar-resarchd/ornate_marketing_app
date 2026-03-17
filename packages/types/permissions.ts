export const ROLES = ["super_admin", "admin", "manager", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS: Record<string, readonly Role[]> = {
  view_documents: ["super_admin", "admin", "manager", "viewer"],
  download: ["super_admin", "admin", "manager", "viewer"],
  upload: ["super_admin", "admin", "manager"],
  delete_own: ["super_admin", "admin", "manager"],
  delete_any: ["super_admin", "admin"],
  share: ["super_admin", "admin", "manager"],
  manage_companies: ["super_admin", "admin"],
  manage_users: ["super_admin"],
};

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  return PERMISSIONS[permission].includes(role);
}
