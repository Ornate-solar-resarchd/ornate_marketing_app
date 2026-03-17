import { createClerkClient } from "@clerk/backend";
import type { Request, Response, NextFunction } from "express";
import type { Role } from "@ornate/types";
import { logger } from "../lib/logger";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing authorization token", code: "UNAUTHORIZED" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Use X-Forwarded-Proto from nginx to get correct protocol
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    const url = `${proto}://${host}${req.originalUrl}`;
    const webRequest = new globalThis.Request(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const requestState = await clerkClient.authenticateRequest(webRequest, {
      authorizedParties: [
        "https://ornate-marketing-app-web.vercel.app",
        "http://localhost:3000",
        process.env.FRONTEND_URL || "",
      ].filter(Boolean),
    });
    const userId = requestState.toAuth()?.userId;

    if (!userId) {
      res.status(401).json({ error: "Invalid token", code: "UNAUTHORIZED" });
      return;
    }

    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata?.role as Role) || "viewer";

    req.user = { userId, role };
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed", code: "UNAUTHORIZED" });
  }
}
