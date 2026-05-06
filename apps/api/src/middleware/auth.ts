import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { Role } from "@ornate/types";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        email: string;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
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

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      res.status(401).json({ error: "Invalid or expired token", code: "UNAUTHORIZED" });
      return;
    }

    // Confirm the user is still active in the DB (handles deactivation).
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive", code: "UNAUTHORIZED" });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed", code: "UNAUTHORIZED" });
  }
}

/** Helper used by the login route to issue a JWT. */
export function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
