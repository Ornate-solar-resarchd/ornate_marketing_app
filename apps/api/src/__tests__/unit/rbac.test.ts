import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermission } from "../../middleware/rbac";
import type { Request, Response, NextFunction } from "express";

function createMockReqResNext(user?: { userId: string; role: string }) {
  const req = { user } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("RBAC Middleware - requirePermission()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if no user is attached to request", () => {
    const { req, res, next } = createMockReqResNext(undefined);
    const middleware = requirePermission("upload");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "UNAUTHORIZED" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if user lacks permission", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "viewer",
    });
    const middleware = requirePermission("upload");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "FORBIDDEN" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next() if user has permission", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "admin",
    });
    const middleware = requirePermission("upload");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow super_admin for any permission", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "super_admin",
    });
    const middleware = requirePermission("manage_users");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should deny viewer from uploading", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "viewer",
    });
    const middleware = requirePermission("upload");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow manager to share", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "manager",
    });
    const middleware = requirePermission("share");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should deny manager from managing companies", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "manager",
    });
    const middleware = requirePermission("manage_companies");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should deny admin from managing users", () => {
    const { req, res, next } = createMockReqResNext({
      userId: "user_1",
      role: "admin",
    });
    const middleware = requirePermission("manage_users");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
