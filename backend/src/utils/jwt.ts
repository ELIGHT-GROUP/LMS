/**
 * JWT Utility Functions
 * =====================
 * Token generation, verification, and extraction utilities
 * Used for user authentication and session management
 */

import jwt, { SignOptions } from "jsonwebtoken";
import type { IJwtPayload, IAuthenticatedRequest } from "../types";
import logger from "./logger";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Generate JWT token for a user
 */
export const generateToken = (user: { id: string; role: string }): string => {
  try {
    const payload: IJwtPayload = {
      id: user.id,
      role: user.role as "OWNER" | "ADMIN" | "STUDENT",
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as string,
    } as SignOptions);

    logger.info(`JWT token generated for user: ${user.id}`);
    return token;
  } catch (error) {
    logger.error("Error generating JWT token", error);
    throw new Error("Failed to generate token");
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): IJwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
    return decoded;
  } catch (error) {
    logger.warn("JWT verification failed", error);
    throw new Error("Invalid or expired token");
  }
};

/**
 * Extract token from request header
 */
export const extractTokenFromHeader = (req: IAuthenticatedRequest): string | null => {
  const authHeader = req.headers?.authorization;

  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Check if token format is valid JWT (3 parts separated by dots)
 */
export const isJWTFormat = (token: string): boolean => {
  const parts = token.split(".");
  return parts.length === 3;
};

/**
 * Decode token without verification (for inspection)
 */
export const decodeToken = (token: string): IJwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as IJwtPayload;
    return decoded;
  } catch (error) {
    logger.warn("Error decoding token", error);
    return null;
  }
};
