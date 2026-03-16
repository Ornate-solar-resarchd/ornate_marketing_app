import type { Request, Response, NextFunction } from "express";
import { hasPermission, type Permission } from "@ornate/types";

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated", code: "UNAUTHORIZED" });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: "Insufficient permissions",
        code: "FORBIDDEN",
      });
      return;
    }

    next();
  };
}
