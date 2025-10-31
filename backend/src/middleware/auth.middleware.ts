/**
 * Authentication Middleware
 * =========================
 * JWT verification and user authentication middleware
 * Validates tokens and attaches user information to requests
 */

import { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../types";
import { unauthorizedResponse } from "../utils/response";
import { isJWTFormat, verifyToken, extractTokenFromHeader } from "../utils/jwt";
import logger from "../utils/logger";
import { getPrisma } from "../config/database";

/**
 * Authentication middleware - Validates JWT token
 */
export const authMiddleware = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      unauthorizedResponse(res, "No token provided");
      return;
    }

    // Check JWT format
    if (!isJWTFormat(token)) {
      unauthorizedResponse(res, "Invalid token format");
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if token is active in database (JSON array search)
    const prisma = getPrisma();
    const authUser = await prisma.authUser.findUnique({
      where: { id: decoded.id },
    });

    if (!authUser) {
      unauthorizedResponse(res, "User not found");
      return;
    }

    // Search token in JSON array
    const tokenRecord = ((authUser as any).tokens || []).find((t: any) => t.token === token);

    if (!tokenRecord || !tokenRecord.isActive) {
      unauthorizedResponse(res, "Token is not active or has been revoked");
      return;
    }

    // Check token expiration
    if (new Date(tokenRecord.expireAt) < new Date()) {
      unauthorizedResponse(res, "Token has expired");
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error("Authentication middleware error:", error);
    unauthorizedResponse(res, "Authentication failed");
  }
};

/**
 * Optional authentication middleware - Does not fail if no token
 */
export const optionalAuth = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req);

    if (token && isJWTFormat(token)) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.id,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    logger.warn("Optional auth error (non-critical):", error);
    next();
  }
};

/**
 * Role-based authorization middleware factory
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, "User not authenticated");
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      unauthorizedResponse(
        res,
        `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`
      );
      return;
    }

    next();
  };
};
