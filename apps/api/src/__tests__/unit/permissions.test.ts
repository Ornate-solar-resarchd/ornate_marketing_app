import { describe, it, expect } from "vitest";
import { hasPermission, ROLES, PERMISSIONS } from "@ornate/types";

describe("Permissions", () => {
  describe("ROLES", () => {
    it("should have 4 roles", () => {
      expect(ROLES).toHaveLength(4);
    });

    it("should contain all expected roles", () => {
      expect(ROLES).toContain("super_admin");
      expect(ROLES).toContain("admin");
      expect(ROLES).toContain("manager");
      expect(ROLES).toContain("viewer");
    });
  });

  describe("PERMISSIONS", () => {
    it("should have 8 permissions defined", () => {
      expect(Object.keys(PERMISSIONS)).toHaveLength(8);
    });

    it("should include all expected permission keys", () => {
      const expectedKeys = [
        "view_documents",
        "download",
        "upload",
        "delete_own",
        "delete_any",
        "share",
        "manage_companies",
        "manage_users",
      ];
      expect(Object.keys(PERMISSIONS)).toEqual(expect.arrayContaining(expectedKeys));
    });
  });

  describe("hasPermission()", () => {
    // super_admin has all permissions
    it("super_admin should have all permissions", () => {
      for (const permission of Object.keys(PERMISSIONS)) {
        expect(hasPermission("super_admin", permission)).toBe(true);
      }
    });

    // admin permissions
    it("admin should have upload permission", () => {
      expect(hasPermission("admin", "upload")).toBe(true);
    });

    it("admin should have delete_any permission", () => {
      expect(hasPermission("admin", "delete_any")).toBe(true);
    });

    it("admin should NOT have manage_users permission", () => {
      expect(hasPermission("admin", "manage_users")).toBe(false);
    });

    it("admin should have manage_companies permission", () => {
      expect(hasPermission("admin", "manage_companies")).toBe(true);
    });

    // manager permissions
    it("manager should have upload permission", () => {
      expect(hasPermission("manager", "upload")).toBe(true);
    });

    it("manager should have share permission", () => {
      expect(hasPermission("manager", "share")).toBe(true);
    });

    it("manager should NOT have delete_any permission", () => {
      expect(hasPermission("manager", "delete_any")).toBe(false);
    });

    it("manager should NOT have manage_companies permission", () => {
      expect(hasPermission("manager", "manage_companies")).toBe(false);
    });

    it("manager should NOT have manage_users permission", () => {
      expect(hasPermission("manager", "manage_users")).toBe(false);
    });

    // viewer permissions
    it("viewer should have view_documents permission", () => {
      expect(hasPermission("viewer", "view_documents")).toBe(true);
    });

    it("viewer should have download permission", () => {
      expect(hasPermission("viewer", "download")).toBe(true);
    });

    it("viewer should NOT have upload permission", () => {
      expect(hasPermission("viewer", "upload")).toBe(false);
    });

    it("viewer should NOT have delete_own permission", () => {
      expect(hasPermission("viewer", "delete_own")).toBe(false);
    });

    it("viewer should NOT have share permission", () => {
      expect(hasPermission("viewer", "share")).toBe(false);
    });

    it("viewer should NOT have manage_users permission", () => {
      expect(hasPermission("viewer", "manage_users")).toBe(false);
    });
  });
});
